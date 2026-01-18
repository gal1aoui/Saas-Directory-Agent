import asyncio
import os
from datetime import datetime
from typing import Dict, List, Optional, Tuple

from playwright.async_api import Browser, Page, TimeoutError, async_playwright

from app.config import get_settings
from app.utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()


class BrowserAutomation:
    """
    Handles all browser automation tasks using Playwright.
    Responsible for navigation, form filling, and submission.
    """

    def __init__(self):
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.settings = settings

    async def __aenter__(self):
        """Context manager entry"""
        await self.initialize()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        await self.close()

    async def initialize(self):
        """Initialize Playwright and browser"""
        try:
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(
                headless=self.settings.HEADLESS_BROWSER,
                args=["--no-sandbox", "--disable-setuid-sandbox"],
            )
            logger.info("Browser initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize browser: {str(e)}")
            raise

    async def close(self):
        """Close browser and playwright"""
        try:
            if self.browser:
                await self.browser.close()
            if self.playwright:
                await self.playwright.stop()
            logger.info("Browser closed successfully")
        except Exception as e:
            logger.error(f"Error closing browser: {str(e)}")

    async def navigate_and_screenshot(self, url: str) -> Tuple[str, str]:
        """
        Navigate to URL and take screenshot.
        Returns: (screenshot_path, html_content)
        """
        page = await self.browser.new_page()

        try:
            # Navigate with timeout
            await page.goto(url, wait_until="networkidle", timeout=self.settings.BROWSER_TIMEOUT)

            # Wait for page to be fully loaded
            await page.wait_for_load_state("domcontentloaded")
            await asyncio.sleep(2)  # Additional wait for dynamic content

            # Take screenshot
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            screenshot_path = f"{self.settings.UPLOAD_DIR}/screenshots/form_{timestamp}.png"
            os.makedirs(os.path.dirname(screenshot_path), exist_ok=True)
            await page.screenshot(path=screenshot_path, full_page=True)

            # Get HTML content
            html_content = await page.content()

            logger.info(f"Successfully navigated to {url} and captured screenshot")
            return screenshot_path, html_content

        except TimeoutError:
            logger.error(f"Timeout navigating to {url}")
            raise
        except Exception as e:
            logger.error(f"Error navigating to {url}: {str(e)}")
            raise
        finally:
            await page.close()

    async def fill_and_submit_form(
        self,
        url: str,
        field_mapping: Dict[str, any],
        submit_button_selector: Optional[str] = None,
    ) -> Dict:
        """
        Fill form fields and submit.
        Returns submission result with status and any error messages.
        """
        page = await self.browser.new_page()
        result = {
            "success": False,
            "message": "",
            "listing_url": None,
            "screenshot_path": None,
        }

        try:
            # Navigate to submission page
            await page.goto(url, wait_until="networkidle", timeout=self.settings.BROWSER_TIMEOUT)
            logger.info(f"Navigated to {url}")

            # Fill each field
            for selector, value in field_mapping.items():
                if value:
                    await self._fill_field(page, selector, value)

            # Take screenshot before submission
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            pre_submit_screenshot = (
                f"{self.settings.UPLOAD_DIR}/screenshots/pre_submit_{timestamp}.png"
            )
            os.makedirs(os.path.dirname(pre_submit_screenshot), exist_ok=True)
            await page.screenshot(path=pre_submit_screenshot)
            result["screenshot_path"] = pre_submit_screenshot

            # Find and click submit button
            if submit_button_selector:
                await self._click_submit_button(page, submit_button_selector)
            else:
                # Try common submit button selectors
                await self._find_and_click_submit(page)

            # Wait for submission to complete
            await asyncio.sleep(3)

            # Check for success indicators
            current_url = page.url
            page_content = await page.content()

            # Take screenshot after submission
            post_submit_screenshot = (
                f"{self.settings.UPLOAD_DIR}/screenshots/post_submit_{timestamp}.png"
            )
            await page.screenshot(path=post_submit_screenshot)

            # Analyze result
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
                logger.info(f"Successfully submitted form to {url}")
            else:
                # Check for error messages
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
                    result["message"] = "Submission failed - form validation errors detected"
                    logger.warning(f"Form validation errors at {url}")
                else:
                    # Might be successful but unclear
                    result["success"] = True
                    result["message"] = "Form submitted - confirmation unclear"
                    result["listing_url"] = current_url
                    logger.info(f"Form submitted to {url} - confirmation unclear")

            return result

        except TimeoutError:
            result["message"] = f"Timeout while submitting to {url}"
            logger.error(result["message"])
            return result
        except Exception as e:
            result["message"] = f"Error during submission: {str(e)}"
            logger.error(result["message"])
            return result
        finally:
            await page.close()

    async def _fill_field(self, page: Page, selector: str, value: any):
        """Fill a single form field based on its type"""
        try:
            # Wait for element to be visible
            await page.wait_for_selector(selector, timeout=5000)

            # Get element
            element = page.locator(selector)

            # Check element type
            tag_name = await element.evaluate("el => el.tagName.toLowerCase()")
            input_type = await element.get_attribute("type") if tag_name == "input" else None

            if tag_name == "input" and input_type == "file":
                # File upload
                if os.path.exists(str(value)):
                    await element.set_input_files(str(value))
                    logger.info(f"Uploaded file to {selector}")
                else:
                    logger.warning(f"File not found: {value}")

            elif tag_name == "select":
                # Dropdown/select
                await element.select_option(value=str(value))
                logger.info(f"Selected option '{value}' in {selector}")

            elif tag_name == "textarea":
                # Textarea
                await element.fill(str(value))
                logger.info(f"Filled textarea {selector}")

            else:
                # Regular input (text, email, url, etc.)
                await element.fill(str(value))
                logger.info(f"Filled input {selector} with value")

            # Small delay between fields
            await asyncio.sleep(0.5)

        except TimeoutError:
            logger.warning(f"Element not found: {selector}")
        except Exception as e:
            logger.error(f"Error filling field {selector}: {str(e)}")

    async def _click_submit_button(self, page: Page, selector: str):
        """Click the submit button"""
        try:
            await page.wait_for_selector(selector, timeout=5000)

            # Scroll to button
            await page.locator(selector).scroll_into_view_if_needed()

            # Click button
            await page.locator(selector).click()
            logger.info(f"Clicked submit button: {selector}")

        except Exception as e:
            logger.error(f"Error clicking submit button: {str(e)}")
            raise

    async def _find_and_click_submit(self, page: Page):
        """Try to find and click submit button using common patterns"""
        common_selectors = [
            'button[type="submit"]',
            'input[type="submit"]',
            'button:has-text("Submit")',
            'button:has-text("Send")',
            'button:has-text("Continue")',
            'button:has-text("Next")',
            'a:has-text("Submit")',
            ".submit-button",
            "#submit-button",
            "button.btn-primary",
        ]

        for selector in common_selectors:
            try:
                element = page.locator(selector).first
                if await element.is_visible():
                    await element.scroll_into_view_if_needed()
                    await element.click()
                    logger.info(f"Clicked submit button using selector: {selector}")
                    return
            except Exception as exc:
                logger.debug(
                    "Failed to click selector %s: %s",
                    selector,
                    exc,
                )
                continue

        logger.warning("Could not find submit button with common selectors")
        raise Exception("Submit button not found")

    async def detect_captcha(self, page: Page) -> bool:
        """Check if page has CAPTCHA"""
        captcha_indicators = [
            'iframe[src*="recaptcha"]',
            'iframe[src*="hcaptcha"]',
            ".g-recaptcha",
            ".h-captcha",
            "#recaptcha",
            "#hcaptcha",
        ]

        for selector in captcha_indicators:
            try:
                if await page.locator(selector).count() > 0:
                    logger.warning(f"CAPTCHA detected: {selector}")
                    return True
            except Exception as exc:
                logger.debug(
                    "Failed to click selector %s: %s",
                    selector,
                    exc,
                )
                continue

        return False

    async def handle_multi_step_form(self, url: str, form_steps: List[Dict[str, Dict]]) -> Dict:
        """
        Handle multi-step forms.
        form_steps: List of dicts, each containing field_mapping for that step
        """
        page = await self.browser.new_page()
        result = {"success": False, "message": "", "listing_url": None}

        try:
            await page.goto(url, wait_until="networkidle")

            for step_num, step_data in enumerate(form_steps, 1):
                logger.info(f"Processing form step {step_num}/{len(form_steps)}")

                # Fill fields for this step
                for selector, value in step_data["field_mapping"].items():
                    if value:
                        await self._fill_field(page, selector, value)

                # Click next/submit button for this step
                next_button = step_data.get("next_button_selector")
                if next_button:
                    await self._click_submit_button(page, next_button)
                    await asyncio.sleep(2)  # Wait for next step to load

            # Final submission handled by last step
            result["success"] = True
            result["message"] = "Multi-step form completed"
            result["listing_url"] = page.url

            return result

        except Exception as e:
            result["message"] = f"Error in multi-step form: {str(e)}"
            logger.error(result["message"])
            return result
        finally:
            await page.close()
