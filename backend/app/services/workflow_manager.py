"""
Workflow orchestration for directory submissions.

Coordinates submission execution using different strategies (Browser Use AI or Playwright).
"""

import asyncio
from datetime import datetime, timedelta
from typing import List

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Directory, SaasProduct, Submission, SubmissionStatus
from app.services.ai_form_reader import AIFormReader
from app.services.strategies import BrowserUseStrategy, PlaywrightStrategy
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

        # Initialize strategies
        self.browser_use_strategy = BrowserUseStrategy()
        self.playwright_strategy = PlaywrightStrategy(self.ai_reader)

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
            # Choose strategy based on configuration
            if settings.USE_BROWSER_USE:
                return await self.browser_use_strategy.execute_submission(
                    submission, saas_product, directory, self.db
                )
            else:
                return await self.playwright_strategy.execute_submission(
                    submission, saas_product, directory, self.db
                )
        except Exception as e:
            logger.error(f"Submission failed: {str(e)}")
            submission.status = SubmissionStatus.FAILED
            submission.response_message = f"Error: {str(e)}"
            self.db.commit()
            raise

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
        """Retry failed submissions."""
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

                await self.submit_to_directory(
                    submission.saas_product_id, submission.directory_id, submission.user_id
                )
            except Exception as e:
                logger.error(f"❌ Retry failed for submission {submission.id}: {e}")

    def start_scheduler(self):
        """Start background scheduler."""
        if self.is_running:
            return

        self.is_running = True

        self.scheduler.add_job(
            self.retry_failed_submissions, "interval", minutes=30, id="retry_failed"
        )

        self.scheduler.start()
        logger.info("✅ Scheduler started")

    def stop_scheduler(self):
        """Stop scheduler."""
        if self.scheduler.running:
            self.scheduler.shutdown()
        self.is_running = False
