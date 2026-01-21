"""
URL-first submission pattern handler.

Handles two-step submission where URL is submitted first,
then redirects to the full form (e.g., SaaSHub pattern).
"""

import asyncio
from typing import Optional

from playwright.async_api import BrowserContext

from app.utils.logger import get_logger

logger = get_logger(__name__)


class URLSubmissionHandler:
    """Handles URL-first submission pattern."""

    def __init__(self, context: BrowserContext, browser_timeout: int):
        self.context = context
        self.browser_timeout = browser_timeout

    async def submit_url_first_step(
        self,
        initial_url: str,
        website_url: str,
        url_field_selector: Optional[str] = None,
        url_submit_selector: Optional[str] = None,
    ) -> str:
        """
        Handle two-step submission where URL is submitted first.

        Args:
            initial_url: Initial submission page URL
            website_url: Website URL to submit
            url_field_selector: Optional CSS selector for URL input
            url_submit_selector: Optional CSS selector for submit button

        Returns:
            URL of the form page after URL submission

        Example:
            SaaSHub requires submitting URL on /services/submit,
            then redirects to /services/new?url=... for the full form.
        """
        page = await self.context.new_page()

        try:
            await page.goto(initial_url, wait_until="domcontentloaded", timeout=self.browser_timeout)
            await page.wait_for_load_state("networkidle", timeout=10000)
            await asyncio.sleep(2)

            # Find and fill URL field
            url_field_selectors = (
                [
                    url_field_selector,
                    'input[name="url"]',
                    'input[id="url"]',
                    'input[type="url"]',
                    'input[placeholder*="website"]',
                    'input[placeholder*="URL"]',
                    "#service_url",
                    'input[name="website"]',
                ]
                if url_field_selector
                else [
                    'input[name="url"]',
                    'input[id="url"]',
                    'input[type="url"]',
                    'input[placeholder*="website"]',
                    'input[placeholder*="URL"]',
                    "#service_url",
                    'input[name="website"]',
                ]
            )

            url_filled = False
            for selector in url_field_selectors:
                if not selector:
                    continue
                try:
                    if await page.locator(selector).count() > 0:
                        await page.locator(selector).first.fill(website_url)
                        url_filled = True
                        logger.info(f"✅ Filled URL field using selector: {selector}")
                        break
                except Exception:
                    continue

            if not url_filled:
                raise Exception("Could not find URL input field")

            await asyncio.sleep(0.5)

            # Find and click Continue/Submit button
            submit_selectors = (
                [
                    url_submit_selector,
                    'button:has-text("Continue")',
                    'input[value="Continue"]',
                    'button[type="submit"]',
                    'input[type="submit"]',
                    'button:has-text("Next")',
                    'button:has-text("Submit")',
                ]
                if url_submit_selector
                else [
                    'button:has-text("Continue")',
                    'input[value="Continue"]',
                    'button[type="submit"]',
                    'input[type="submit"]',
                    'button:has-text("Next")',
                    'button:has-text("Submit")',
                ]
            )

            button_clicked = False
            for selector in submit_selectors:
                if not selector:
                    continue
                try:
                    if await page.locator(selector).count() > 0:
                        await page.locator(selector).first.scroll_into_view_if_needed()
                        await page.locator(selector).first.click()
                        button_clicked = True
                        logger.info(f"✅ Clicked submit button using selector: {selector}")
                        break
                except Exception:
                    continue

            if not button_clicked:
                raise Exception("Could not find Continue/Submit button")

            # Wait for navigation to form page
            await asyncio.sleep(3)
            await page.wait_for_load_state("networkidle", timeout=10000)

            form_url = page.url
            logger.info(f"✅ Navigated to form page: {form_url}")

            return form_url

        except Exception as e:
            logger.error(f"❌ Error in URL submission step: {str(e)}")
            raise
        finally:
            await page.close()
