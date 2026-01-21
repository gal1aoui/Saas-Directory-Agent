import asyncio
from datetime import datetime, timedelta
from typing import Dict, List

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Directory, SaasProduct, Submission, SubmissionStatus
from app.services.ai_form_reader import AIFormReader
from app.services.browser_automation import BrowserAutomation
from app.services.browser_use_service import BrowserUseService
from app.utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()


class WorkflowManager:
    """Orchestrates the entire submission workflow."""

    def __init__(self, db: Session):
        self.db = db
        self.settings = settings
        self.ai_reader = AIFormReader()
        self.scheduler = AsyncIOScheduler()
        self.is_running = False

    async def submit_to_directory(
        self, saas_product_id: int, directory_id: int, user_id: int
    ) -> Submission:
        """Execute single submission with Browser Use AI or traditional automation."""
        # Get SaaS product and directory
        saas_product = self.db.query(SaasProduct).filter(SaasProduct.id == saas_product_id).first()

        directory = self.db.query(Directory).filter(Directory.id == directory_id).first()

        if not saas_product or not directory:
            raise ValueError("SaaS product or directory not found")

        # Create submission record
        submission = Submission(
            user_id=user_id,
            saas_product_id=saas_product_id,
            directory_id=directory_id,
            status=SubmissionStatus.PENDING,
        )
        self.db.add(submission)
        self.db.commit()
        self.db.refresh(submission)

        try:
            # Choose automation method: Browser Use AI or Traditional Playwright
            if settings.USE_BROWSER_USE:
                return await self._submit_with_browser_use(
                    submission, saas_product, directory
                )
            else:
                return await self._submit_with_playwright(
                    submission, saas_product, directory
                )
        except Exception as e:
            logger.error(f"Submission failed: {str(e)}")
            submission.status = SubmissionStatus.FAILED
            submission.response_message = f"Error: {str(e)}"
            self.db.commit()
            raise

    async def _submit_with_browser_use(
        self, submission: Submission, saas_product: SaasProduct, directory: Directory
    ) -> Submission:
        """
        Submit using Browser Use AI-powered automation.

        This method uses Qwen2.5-VL vision model to intelligently:
        - Detect and fill forms automatically
        - Handle multi-step forms without manual configuration
        - Perform login if required
        - Handle special submission patterns
        """
        logger.info(f"🤖 Using Browser Use AI for {directory.name}")

        browser_use = BrowserUseService()

        # Prepare form data from SaaS product
        form_data = self._saas_product_to_dict(saas_product)

        # Prepare login credentials if required
        login_credentials = None
        if directory.requires_login:
            login_credentials = {
                "username": directory.login_username,
                "password": directory.login_password,
                "login_url": directory.login_url,
            }

        # Prepare URL-first selectors if needed
        url_first_selectors = None
        if directory.requires_url_first:
            url_first_selectors = {
                "url_field_selector": directory.url_field_selector,
                "url_submit_selector": directory.url_submit_selector,
            }

        # AI agent performs the submission
        result = await browser_use.submit_to_directory(
            url=directory.submission_url or directory.url,
            form_data=form_data,
            login_credentials=login_credentials,
            requires_url_first=directory.requires_url_first,
            url_first_selectors=url_first_selectors,
        )

        # Update submission based on result
        if result["success"]:
            submission.status = SubmissionStatus.SUBMITTED
            submission.submitted_at = datetime.now()
            submission.response_message = result["message"]
            submission.form_screenshot_url = result.get("screenshot_path")

            directory.total_submissions += 1
            directory.successful_submissions += 1

            logger.info(f"✅ AI submission {submission.id} to {directory.name} successful")
        else:
            submission.status = SubmissionStatus.FAILED
            submission.response_message = result["message"]
            submission.form_screenshot_url = result.get("screenshot_path")

            directory.total_submissions += 1

            logger.error(f"❌ AI submission {submission.id} failed: {result['message']}")

        self.db.commit()
        return submission

    async def _submit_with_playwright(
        self, submission: Submission, saas_product: SaasProduct, directory: Directory
    ) -> Submission:
        """Traditional Playwright automation (fallback method)."""
        logger.info(f"🔧 Using traditional Playwright for {directory.name}")

        try:
            # Use persistent browser context
            async with BrowserAutomation() as browser:
                # Step 1: Login if required
                if directory.requires_login:
                    login_success = await browser.login_if_required(
                        login_url=directory.login_url,
                        username=directory.login_username,
                        password=directory.login_password,
                    )

                    if not login_success:
                        raise Exception("Login failed")

                    logger.info(f"✅ Logged in to {directory.name}")

                # Step 1.5: Handle URL-first submission pattern (e.g., SaaSHub)
                actual_form_url = directory.submission_url or directory.url
                if directory.requires_url_first:
                    logger.info(f"Submitting URL first to {directory.name}")
                    actual_form_url = await browser.submit_url_first_step(
                        initial_url=directory.submission_url or directory.url,
                        website_url=saas_product.website_url,
                        url_field_selector=directory.url_field_selector,
                        url_submit_selector=directory.url_submit_selector,
                    )
                    logger.info(f"✅ URL submitted, form page: {actual_form_url}")

                # Step 2: Check cached form structure
                if directory.detected_form_structure:
                    form_structure = directory.detected_form_structure
                else:
                    # Analyze form
                    form_structure = await self._analyze_directory_form(
                        browser, directory, actual_form_url
                    )

                    # Cache it
                    directory.detected_form_structure = form_structure
                    directory.last_form_detection = datetime.now()
                    self.db.commit()

                # Step 3: Map SaaS data to form fields
                saas_data = self._saas_product_to_dict(saas_product)
                fields = form_structure.get("fields", [])
                field_mapping = self.ai_reader.map_saas_data_to_fields(saas_data, fields)

                if not field_mapping:
                    raise Exception("No fields could be mapped")

                submission.detected_fields = form_structure
                self.db.commit()

                # Step 4: Fill and submit form (with multi-step support)
                submission_result = await browser.fill_and_submit_form(
                    url=actual_form_url,
                    field_mapping=field_mapping,
                    submit_button_selector=form_structure.get("submit_button_selector"),
                    is_multi_step=directory.is_multi_step,
                    step_count=directory.step_count,
                )

                # Step 5: Update submission status
                if submission_result["success"]:
                    submission.status = SubmissionStatus.SUBMITTED
                    submission.submitted_at = datetime.now()
                    submission.listing_url = submission_result.get("listing_url")
                    submission.response_message = submission_result["message"]

                    directory.total_submissions += 1
                    directory.successful_submissions += 1

                    logger.info(f"✅ Submission {submission.id} to {directory.name} successful")
                else:
                    submission.status = SubmissionStatus.FAILED
                    submission.response_message = submission_result["message"]
                    directory.total_submissions += 1

                    logger.error(f"❌ Submission {submission.id} to {directory.name} failed")

                # Store data
                submission.submission_data = {
                    "field_mapping": {k: str(v) for k, v in field_mapping.items()},
                    "form_structure": form_structure,
                }

                if submission_result.get("screenshot_path"):
                    submission.form_screenshot_url = submission_result["screenshot_path"]

                self.db.commit()
                self.db.refresh(submission)

            return submission

        except Exception as e:
            logger.error(f"❌ Submission {submission.id} error: {str(e)}")

            submission.status = SubmissionStatus.FAILED
            submission.response_message = f"Error: {str(e)}"

            if not submission.error_log:
                submission.error_log = []

            submission.error_log.append({"timestamp": datetime.now().isoformat(), "error": str(e)})

            self.db.commit()
            self.db.refresh(submission)

            return submission

    async def bulk_submit(
        self, saas_product_id: int, directory_ids: List[int], user_id: int
    ) -> List[Submission]:
        """Submit to multiple directories concurrently with persistent browser sessions."""
        submissions = []
        semaphore = asyncio.Semaphore(self.settings.CONCURRENT_SUBMISSIONS)

        async def submit_with_semaphore(directory_id: int):
            async with semaphore:
                try:
                    return await self.submit_to_directory(saas_product_id, directory_id, user_id)
                except Exception as e:
                    logger.error(f"❌ Error submitting to directory {directory_id}: {e}")
                    return None

        tasks = [submit_with_semaphore(dir_id) for dir_id in directory_ids]
        results = await asyncio.gather(*tasks, return_exceptions=False)
        submissions = [s for s in results if isinstance(s, Submission)]

        logger.info(f"✅ Bulk submission completed: {len(submissions)}/{len(directory_ids)}")

        return submissions

    async def retry_failed_submissions(self):
        """Retry failed submissions"""
        failed = (
            self.db.query(Submission)
            .filter(
                Submission.status == SubmissionStatus.FAILED,
                Submission.retry_count < Submission.max_retries,
                (Submission.last_retry_at.is_(None))
                | (
                    Submission.last_retry_at
                    < datetime.now() - timedelta(seconds=self.settings.RETRY_DELAY)
                ),
            )
            .all()
        )

        for submission in failed:
            try:
                submission.retry_count += 1
                submission.last_retry_at = datetime.now()
                submission.status = SubmissionStatus.PENDING
                self.db.commit()

                await self.submit_to_directory(submission.saas_product_id, submission.directory_id)
            except Exception as e:
                logger.error(f"❌ Retry failed for submission {submission.id}: {e}")

    async def _analyze_directory_form(
        self, browser: BrowserAutomation, directory: Directory, form_url: str = None
    ) -> Dict:
        """Analyze directory form structure using existing browser context"""
        url = form_url or directory.submission_url or directory.url
        screenshot_path, html_content = await browser.navigate_and_screenshot(url)

        form_structure = await self.ai_reader.analyze_form_from_screenshot(
            screenshot_path=screenshot_path, html_content=html_content
        )

        return form_structure

    def _saas_product_to_dict(self, saas_product: SaasProduct) -> Dict:
        """Convert SaaS product to dict"""
        return {
            "name": saas_product.name,
            "website_url": str(saas_product.website_url),
            "description": saas_product.description,
            "short_description": saas_product.short_description,
            "category": saas_product.category,
            "logo_url": str(saas_product.logo_url) if saas_product.logo_url else None,
            "contact_email": saas_product.contact_email,
            "tagline": saas_product.tagline,
            "pricing_model": saas_product.pricing_model,
            "features": saas_product.features,
            "social_links": saas_product.social_links,
        }

    def start_scheduler(self):
        """Start background scheduler"""
        if self.is_running:
            return

        self.is_running = True

        self.scheduler.add_job(
            self.retry_failed_submissions, "interval", minutes=30, id="retry_failed"
        )

        self.scheduler.start()
        logger.info("✅ Scheduler started")

    def stop_scheduler(self):
        """Stop scheduler"""
        if self.scheduler.running:
            self.scheduler.shutdown()
        self.is_running = False
