"""
Form filling and submission logic.

Handles filling form fields, clicking buttons, and multi-step form navigation.
"""

import asyncio
import os
from datetime import datetime
from typing import Any, Dict, Optional

from playwright.async_api import BrowserContext, Page
from playwright.async_api import TimeoutError as PlaywrightTimeoutError

from app.config import get_settings
from app.utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()


class FormFiller:
    """Handles form filling and submission operations."""

    def __init__(self, context: BrowserContext, browser_timeout: int):
        self.context = context
        self.browser_timeout = browser_timeout

    async def fill_and_submit_form(
        self,
        url: str,
        field_mapping: Dict[str, Any],
        submit_button_selector: Optional[str] = None,
        is_multi_step: bool = False,
        step_count: int = 1,
    ) -> Dict:
        """
        Fill and submit form with support for multi-step forms.

        Args:
            url: Form URL
            field_mapping: Dict mapping selectors to values
            submit_button_selector: Optional submit button selector
            is_multi_step: Whether form has multiple steps
            step_count: Number of steps in multi-step form

        Returns:
            Dict with success status, message, listing_url, screenshot_path
        """
        page = await self.context.new_page()

        result = {
            "success": False,
            "message": "",
            "listing_url": None,
            "screenshot_path": None,
        }

        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=self.browser_timeout)
            await page.wait_for_load_state("networkidle", timeout=10000)

            if is_multi_step:
                # Handle multi-step form
                for step in range(1, step_count + 1):
                    logger.info(f"Processing step {step}/{step_count}")

                    # Fill fields for current step
                    for selector, value in field_mapping.items():
                        if value:
                            await self._fill_field(page, selector, value)
                            await asyncio.sleep(0.3)

                    # Click Next or Submit button
                    if step < step_count:
                        # Click "Next" button
                        await self._click_next_button(page)
                        await asyncio.sleep(2)
                    else:
                        # Final step - click "Submit"
                        if submit_button_selector:
                            await self._click_submit_button(page, submit_button_selector)
                        else:
                            await self._find_and_click_submit(page)
            else:
                # Single-step form
                for selector, value in field_mapping.items():
                    if value:
                        await self._fill_field(page, selector, value)
                        await asyncio.sleep(0.5)

                # Take screenshot before submit
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                screenshot_dir = os.path.join(settings.UPLOAD_DIR, "screenshots")
                os.makedirs(screenshot_dir, exist_ok=True)

                pre_submit_screenshot = os.path.join(screenshot_dir, f"pre_submit_{timestamp}.png")
                await page.screenshot(path=pre_submit_screenshot)
                result["screenshot_path"] = pre_submit_screenshot

                # Submit
                if submit_button_selector:
                    await self._click_submit_button(page, submit_button_selector)
                else:
                    await self._find_and_click_submit(page)

            # Wait for submission to complete
            await asyncio.sleep(3)

            # Check result
            current_url = page.url
            page_content = await page.content()

            success_indicators = [
                "success",
                "thank you",
                "submitted",
                "received",
                "confirmation",
                "pending review",
                "approved",
            ]

            page_text = page_content.lower()
            is_success = any(indicator in page_text for indicator in success_indicators)

            if is_success:
                result["success"] = True
                result["message"] = "Form submitted successfully"
                result["listing_url"] = current_url
                logger.info(f"✅ Successfully submitted to {url}")
            else:
                error_indicators = [
                    "error",
                    "invalid",
                    "failed",
                    "required field",
                    "please correct",
                    "try again",
                ]

                has_error = any(indicator in page_text for indicator in error_indicators)

                if has_error:
                    result["message"] = "Submission failed - validation errors"
                    logger.error(f"❌ Form validation errors at {url}")
                else:
                    result["success"] = True
                    result["message"] = "Form submitted"
                    result["listing_url"] = current_url

            return result

        except PlaywrightTimeoutError:
            result["message"] = f"Timeout submitting to {url}"
            logger.error(f"❌ {result['message']}")
            return result
        except Exception as e:
            result["message"] = f"Error: {str(e)}"
            logger.error(f"❌ {result['message']}")
            return result
        finally:
            await page.close()

    async def _fill_field(self, page: Page, selector: str, value: Any):
        """Fill a single form field."""
        try:
            await page.wait_for_selector(selector, timeout=5000, state="visible")
            element = page.locator(selector)

            tag_name = await element.evaluate("el => el.tagName.toLowerCase()")
            input_type = await element.get_attribute("type") if tag_name == "input" else None

            if tag_name == "input" and input_type == "file":
                if os.path.exists(str(value)):
                    await element.set_input_files(str(value))
            elif tag_name == "select":
                await element.select_option(value=str(value))
            elif tag_name == "textarea":
                await element.fill(str(value))
            else:
                await element.fill(str(value))
        except Exception:
            pass

    async def _click_next_button(self, page: Page):
        """Click Next button in multi-step forms."""
        next_selectors = [
            'button:has-text("Next")',
            'button:has-text("Continue")',
            'input[value="Next"]',
            'input[value="Continue"]',
            'a:has-text("Next")',
            ".next-button",
            "#next",
        ]

        for selector in next_selectors:
            try:
                if await page.locator(selector).count() > 0:
                    await page.locator(selector).first.scroll_into_view_if_needed()
                    await page.locator(selector).first.click()
                    return
            except Exception:
                continue

        raise Exception("Next button not found")

    async def _click_submit_button(self, page: Page, selector: str):
        """Click the submit button."""
        await page.wait_for_selector(selector, timeout=5000, state="visible")
        await page.locator(selector).scroll_into_view_if_needed()
        await page.locator(selector).click()

    async def _find_and_click_submit(self, page: Page):
        """Try to find and click submit button."""
        selectors = [
            'button[type="submit"]',
            'input[type="submit"]',
            'button:has-text("Submit")',
            'button:has-text("Send")',
            'button:has-text("Publish")',
            ".submit-button",
            "#submit",
        ]

        for selector in selectors:
            try:
                if await page.locator(selector).count() > 0:
                    await page.locator(selector).first.scroll_into_view_if_needed()
                    await page.locator(selector).first.click()
                    return
            except Exception:
                continue

        raise Exception("Submit button not found")
