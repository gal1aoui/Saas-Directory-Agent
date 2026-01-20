import asyncio
import os
import sys
from datetime import datetime
from typing import Dict, Optional, Tuple

from playwright.async_api import Browser, Page, async_playwright
from playwright.async_api import TimeoutError as PlaywrightTimeoutError

from app.config import get_settings
from app.utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()


class BrowserAutomation:
    """Windows-compatible browser automation using Playwright."""

    def __init__(self):
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.settings = settings
        self._lock = asyncio.Lock()

    async def __aenter__(self):
        await self.initialize()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()

    async def initialize(self):
        """Initialize Playwright and browser"""
        async with self._lock:
            if self.browser:
                return

            try:
                self.playwright = await async_playwright().start()

                launch_options = {
                    "headless": self.settings.HEADLESS_BROWSER,
                    "args": [
                        "--no-sandbox",
                        "--disable-setuid-sandbox",
                        "--disable-dev-shm-usage",
                        "--disable-blink-features=AutomationControlled",
                        "--disable-web-security",
                    ],
                }

                if sys.platform == "win32":
                    launch_options["channel"] = "chrome"

                try:
                    self.browser = await self.playwright.chromium.launch(**launch_options)
                except Exception:
                    launch_options.pop("channel", None)
                    self.browser = await self.playwright.chromium.launch(**launch_options)

                logger.info("✅ Browser initialized")

            except Exception as e:
                logger.error(f"❌ Browser initialization failed: {str(e)}")
                raise RuntimeError(f"Browser initialization failed: {str(e)}")

    async def close(self):
        """Close browser and playwright"""
        async with self._lock:
            try:
                if self.browser:
                    await self.browser.close()
                    self.browser = None
                if self.playwright:
                    await self.playwright.stop()
                    self.playwright = None
            except Exception as e:
                logger.error(f"❌ Error closing browser: {str(e)}")

    async def navigate_and_screenshot(self, url: str) -> Tuple[str, str]:
        """Navigate to URL and take screenshot."""
        if not self.browser:
            await self.initialize()

        page = await self.browser.new_page(
            viewport={"width": 1920, "height": 1080},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        )

        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=self.settings.BROWSER_TIMEOUT)
            await page.wait_for_load_state("networkidle", timeout=10000)
            await asyncio.sleep(2)

            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            screenshot_dir = os.path.join(self.settings.UPLOAD_DIR, "screenshots")
            os.makedirs(screenshot_dir, exist_ok=True)

            screenshot_path = os.path.join(screenshot_dir, f"form_{timestamp}.png")
            await page.screenshot(path=screenshot_path, full_page=True)

            html_content = await page.content()

            return screenshot_path, html_content

        except PlaywrightTimeoutError:
            logger.error(f"❌ Timeout navigating to {url}")
            raise
        except Exception as e:
            logger.error(f"❌ Error navigating to {url}: {str(e)}")
            raise
        finally:
            await page.close()

    async def fill_and_submit_form(
        self, url: str, field_mapping: Dict[str, any], submit_button_selector: Optional[str] = None
    ) -> Dict:
        """Fill form fields and submit."""
        if not self.browser:
            await self.initialize()

        page = await self.browser.new_page(
            viewport={"width": 1920, "height": 1080},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        )

        result = {"success": False, "message": "", "listing_url": None, "screenshot_path": None}

        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=self.settings.BROWSER_TIMEOUT)
            await page.wait_for_load_state("networkidle", timeout=10000)

            # Fill fields
            for selector, value in field_mapping.items():
                if value:
                    await self._fill_field(page, selector, value)
                    await asyncio.sleep(0.5)

            # Screenshot before submit
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            screenshot_dir = os.path.join(self.settings.UPLOAD_DIR, "screenshots")
            os.makedirs(screenshot_dir, exist_ok=True)

            pre_submit_screenshot = os.path.join(screenshot_dir, f"pre_submit_{timestamp}.png")
            await page.screenshot(path=pre_submit_screenshot)
            result["screenshot_path"] = pre_submit_screenshot

            # Submit
            if submit_button_selector:
                await self._click_submit_button(page, submit_button_selector)
            else:
                await self._find_and_click_submit(page)

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

    async def _fill_field(self, page: Page, selector: str, value: any):
        """Fill a single form field"""
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
            pass  # Silently skip fields that can't be filled

    async def _click_submit_button(self, page: Page, selector: str):
        """Click the submit button"""
        await page.wait_for_selector(selector, timeout=5000, state="visible")
        await page.locator(selector).scroll_into_view_if_needed()
        await page.locator(selector).click()

    async def _find_and_click_submit(self, page: Page):
        """Try to find and click submit button"""
        selectors = [
            'button[type="submit"]',
            'input[type="submit"]',
            'button:has-text("Submit")',
            'button:has-text("Send")',
            'button:has-text("Continue")',
            ".submit-button",
            "#submit",
        ]

        for selector in selectors:
            try:
                element = page.locator(selector).first
                if await element.is_visible():
                    await element.scroll_into_view_if_needed()
                    await element.click()
                    return
            except:
                continue

        raise Exception("Submit button not found")
