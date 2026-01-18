import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from app.models import Submission, Directory, SaasProduct, SubmissionStatus
from app.services.ai_form_reader import AIFormReader
from app.services.browser_automation import BrowserAutomation
from app.config import get_settings
from app.utils.logger import get_logger
import schedule
import time
from threading import Thread

logger = get_logger(__name__)
settings = get_settings()

class WorkflowManager:
    """
    Orchestrates the entire submission workflow.
    Manages queue, retries, concurrent submissions, and scheduling.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.settings = settings
        self.ai_reader = AIFormReader(provider="openai")
        self.is_running = False
        self.scheduler_thread = None
    
    async def submit_to_directory(
        self,
        saas_product_id: int,
        directory_id: int
    ) -> Submission:
        """
        Execute single submission to a directory.
        This is the main workflow orchestration method.
        """
        # Get SaaS product and directory
        saas_product = self.db.query(SaasProduct).filter(
            SaasProduct.id == saas_product_id
        ).first()
        
        directory = self.db.query(Directory).filter(
            Directory.id == directory_id
        ).first()
        
        if not saas_product or not directory:
            raise ValueError("SaaS product or directory not found")
        
        # Create submission record
        submission = Submission(
            saas_product_id=saas_product_id,
            directory_id=directory_id,
            status=SubmissionStatus.PENDING
        )
        self.db.add(submission)
        self.db.commit()
        self.db.refresh(submission)
        
        logger.info(f"Starting submission {submission.id} to {directory.name}")
        
        try:
            # Step 1: Check if we have cached form structure
            if directory.detected_form_structure:
                logger.info(f"Using cached form structure for {directory.name}")
                form_structure = directory.detected_form_structure
            else:
                # Step 2: Navigate and analyze form
                logger.info(f"Analyzing form structure for {directory.name}")
                form_structure = await self._analyze_directory_form(directory)
                
                # Cache the form structure
                directory.detected_form_structure = form_structure
                directory.last_form_detection = datetime.utcnow()
                self.db.commit()
            
            # Step 3: Map SaaS data to form fields
            logger.info("Mapping SaaS data to form fields")
            saas_data = self._saas_product_to_dict(saas_product)
            field_mapping = self.ai_reader.map_saas_data_to_fields(
                saas_data,
                form_structure.get("fields", [])
            )
            
            # Store detected fields in submission
            submission.detected_fields = form_structure
            self.db.commit()
            
            # Step 4: Fill and submit form
            logger.info("Filling and submitting form")
            async with BrowserAutomation() as browser:
                submission_result = await browser.fill_and_submit_form(
                    url=directory.submission_url or directory.url,
                    field_mapping=field_mapping,
                    submit_button_selector=form_structure.get("submit_button_selector")
                )
            
            # Step 5: Update submission status
            if submission_result["success"]:
                submission.status = SubmissionStatus.SUBMITTED
                submission.submitted_at = datetime.utcnow()
                submission.listing_url = submission_result.get("listing_url")
                submission.response_message = submission_result["message"]
                
                # Update directory statistics
                directory.total_submissions += 1
                directory.successful_submissions += 1
                
                logger.info(f"✅ Submission {submission.id} successful")
            else:
                submission.status = SubmissionStatus.FAILED
                submission.response_message = submission_result["message"]
                
                # Update directory statistics
                directory.total_submissions += 1
                
                logger.error(f"❌ Submission {submission.id} failed: {submission_result['message']}")
            
            # Store submission data
            submission.submission_data = {
                "field_mapping": {k: str(v) for k, v in field_mapping.items()},
                "form_structure": form_structure
            }
            
            if submission_result.get("screenshot_path"):
                submission.form_screenshot_url = submission_result["screenshot_path"]
            
            self.db.commit()
            self.db.refresh(submission)
            
            return submission
            
        except Exception as e:
            logger.error(f"Error in submission {submission.id}: {str(e)}")
            
            # Update submission with error
            submission.status = SubmissionStatus.FAILED
            submission.response_message = f"Error: {str(e)}"
            
            # Add to error log
            if not submission.error_log:
                submission.error_log = []
            submission.error_log.append({
                "timestamp": datetime.utcnow().isoformat(),
                "error": str(e)
            })
            
            self.db.commit()
            self.db.refresh(submission)
            
            return submission
    
    async def bulk_submit(
        self,
        saas_product_id: int,
        directory_ids: List[int]
    ) -> List[Submission]:
        """
        Submit to multiple directories concurrently.
        Respects CONCURRENT_SUBMISSIONS setting.
        """
        logger.info(f"Starting bulk submission to {len(directory_ids)} directories")
        
        submissions = []
        semaphore = asyncio.Semaphore(self.settings.CONCURRENT_SUBMISSIONS)
        
        async def submit_with_semaphore(directory_id: int):
            async with semaphore:
                return await self.submit_to_directory(saas_product_id, directory_id)
        
        # Create tasks for all submissions
        tasks = [
            submit_with_semaphore(directory_id)
            for directory_id in directory_ids
        ]
        
        # Execute with concurrency limit
        submissions = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out exceptions
        successful_submissions = [
            s for s in submissions if isinstance(s, Submission)
        ]
        
        logger.info(f"Bulk submission completed: {len(successful_submissions)}/{len(directory_ids)} successful")
        
        return successful_submissions
    
    async def retry_failed_submissions(self):
        """
        Retry failed submissions that haven't exceeded max retries.
        Called periodically by scheduler.
        """
        logger.info("Checking for failed submissions to retry")
        
        # Find failed submissions eligible for retry
        failed_submissions = self.db.query(Submission).filter(
            Submission.status == SubmissionStatus.FAILED,
            Submission.retry_count < Submission.max_retries,
            (Submission.last_retry_at.is_(None)) | 
            (Submission.last_retry_at < datetime.utcnow() - timedelta(seconds=self.settings.RETRY_DELAY))
        ).all()
        
        logger.info(f"Found {len(failed_submissions)} submissions to retry")
        
        for submission in failed_submissions:
            try:
                logger.info(f"Retrying submission {submission.id} (attempt {submission.retry_count + 1}/{submission.max_retries})")
                
                # Update retry metadata
                submission.retry_count += 1
                submission.last_retry_at = datetime.utcnow()
                submission.status = SubmissionStatus.PENDING
                self.db.commit()
                
                # Retry submission
                await self.submit_to_directory(
                    submission.saas_product_id,
                    submission.directory_id
                )
                
            except Exception as e:
                logger.error(f"Error retrying submission {submission.id}: {str(e)}")
                continue
    
    async def _analyze_directory_form(self, directory: Directory) -> Dict:
        """
        Analyze directory form structure using AI.
        Returns detected form structure.
        """
        async with BrowserAutomation() as browser:
            # Navigate and capture screenshot
            screenshot_path, html_content = await browser.navigate_and_screenshot(
                directory.submission_url or directory.url
            )
            
            # Analyze form using AI
            form_structure = await self.ai_reader.analyze_form_from_screenshot(
                screenshot_path=screenshot_path,
                html_content=html_content
            )
            
            return form_structure
    
    def _saas_product_to_dict(self, saas_product: SaasProduct) -> Dict:
        """Convert SaaS product model to dictionary"""
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
            "social_links": saas_product.social_links
        }
    
    def start_scheduler(self):
        """
        Start background scheduler for automatic retries.
        Runs in separate thread.
        """
        if self.is_running:
            logger.warning("Scheduler already running")
            return
        
        self.is_running = True
        
        # Schedule retry check every 30 minutes
        schedule.every(30).minutes.do(self._run_retry_job)
        
        def run_scheduler():
            logger.info("Scheduler started")
            while self.is_running:
                schedule.run_pending()
                time.sleep(60)  # Check every minute
            logger.info("Scheduler stopped")
        
        self.scheduler_thread = Thread(target=run_scheduler, daemon=True)
        self.scheduler_thread.start()
    
    def stop_scheduler(self):
        """Stop background scheduler"""
        self.is_running = False
        if self.scheduler_thread:
            self.scheduler_thread.join(timeout=5)
        logger.info("Scheduler stopped")
    
    def _run_retry_job(self):
        """Wrapper to run async retry job in scheduler"""
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(self.retry_failed_submissions())
            loop.close()
        except Exception as e:
            logger.error(f"Error in retry job: {str(e)}")
    
    def get_queue_status(self) -> Dict:
        """Get current status of submission queue"""
        pending = self.db.query(Submission).filter(
            Submission.status == SubmissionStatus.PENDING
        ).count()
        
        failed = self.db.query(Submission).filter(
            Submission.status == SubmissionStatus.FAILED,
            Submission.retry_count < Submission.max_retries
        ).count()
        
        return {
            "pending_submissions": pending,
            "retryable_failed": failed,
            "scheduler_running": self.is_running
        }