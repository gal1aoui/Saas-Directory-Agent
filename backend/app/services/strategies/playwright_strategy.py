"""
Traditional Playwright submission strategy.

Uses manual form detection and filling with Playwright automation.
"""

from datetime import datetime
from typing import Dict

from app.models import Directory, SaasProduct, Submission, SubmissionStatus
from app.services.ai_form_reader import AIFormReader
from app.services.browser_automation import BrowserAutomation
from app.utils.logger import get_logger

logger = get_logger(__name__)


class PlaywrightStrategy:
    """Traditional Playwright automation strategy."""

    def __init__(self, ai_reader: AIFormReader):
        self.ai_reader = ai_reader

    @staticmethod
    def _saas_product_to_dict(saas_product: SaasProduct) -> Dict:
        """Convert SaaS product to dict."""
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

    async def execute_submission(
        self, submission: Submission, saas_product: SaasProduct, directory: Directory, db
    ) -> Submission:
        """
        Execute submission using traditional Playwright automation.

        Args:
            submission: Submission record
            saas_product: SaaS product data
            directory: Target directory
            db: Database session

        Returns:
            Updated submission record
        """
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

                # Step 1.5: Handle URL-first submission pattern
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
                    db.commit()

                # Step 3: Map SaaS data to form fields
                saas_data = self._saas_product_to_dict(saas_product)
                fields = form_structure.get("fields", [])
                field_mapping = self.ai_reader.map_saas_data_to_fields(saas_data, fields)

                if not field_mapping:
                    raise Exception("No fields could be mapped")

                submission.detected_fields = form_structure
                db.commit()

                # Step 4: Fill and submit form
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

                db.commit()
                db.refresh(submission)

            return submission

        except Exception as e:
            logger.error(f"❌ Submission {submission.id} error: {str(e)}")

            submission.status = SubmissionStatus.FAILED
            submission.response_message = f"Error: {str(e)}"

            if not submission.error_log:
                submission.error_log = []

            submission.error_log.append({"timestamp": datetime.now().isoformat(), "error": str(e)})

            db.commit()
            db.refresh(submission)

            return submission

    async def _analyze_directory_form(
        self, browser: BrowserAutomation, directory: Directory, form_url: str = None
    ) -> Dict:
        """Analyze directory form structure using existing browser context."""
        url = form_url or directory.submission_url or directory.url
        screenshot_path, html_content = await browser.navigate_and_screenshot(url)

        form_structure = await self.ai_reader.analyze_form_from_screenshot(
            screenshot_path=screenshot_path, html_content=html_content
        )

        return form_structure
