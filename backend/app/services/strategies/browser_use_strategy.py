"""
Browser Use AI-powered submission strategy.

Uses Qwen2.5-VL vision model to intelligently handle form submissions.
"""

from typing import Dict

from app.models import Directory, SaasProduct, Submission, SubmissionStatus
from app.services.browser_use_service import BrowserUseService
from app.utils.logger import get_logger

logger = get_logger(__name__)


class BrowserUseStrategy:
    """AI-powered submission using Browser Use library."""

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

    @staticmethod
    async def execute_submission(
        submission: Submission, saas_product: SaasProduct, directory: Directory, db
    ) -> Submission:
        """
        Execute submission using Browser Use AI.

        Args:
            submission: Submission record
            saas_product: SaaS product data
            directory: Target directory
            db: Database session

        Returns:
            Updated submission record
        """
        logger.info(f"🤖 Using Browser Use AI for {directory.name}")

        browser_use = BrowserUseService()

        # Prepare form data from SaaS product
        form_data = BrowserUseStrategy._saas_product_to_dict(saas_product)

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
            from datetime import datetime

            submission.status = SubmissionStatus.SUBMITTED
            submission.submitted_at = datetime.now()
            submission.response_message = result["message"]
            submission.form_screenshot_url = result.get("screenshot_path")
            submission.agent_result = result.get("agent_result")

            directory.total_submissions += 1
            directory.successful_submissions += 1

            logger.info(f"✅ AI submission {submission.id} to {directory.name} successful")
        else:
            submission.status = SubmissionStatus.FAILED
            submission.response_message = result["message"]
            submission.form_screenshot_url = result.get("screenshot_path")
            submission.agent_result = result.get("agent_result")

            directory.total_submissions += 1

            logger.error(f"❌ AI submission {submission.id} failed: {result['message']}")

        db.commit()
        return submission
