import asyncio
import os
import sys
from datetime import datetime
from typing import Dict, Optional, Tuple

from playwright.async_api import Browser, Page, BrowserContext, async_playwright
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
        self.context: Optional[BrowserContext] = None
        self.settings = settings
        self._lock = asyncio.Lock()

    async def __aenter__(self):
        await self.initialize()
        return self

    async def __aexit__(self):
        await self.close()

    async def initialize(self):
        """Initialize Playwright and browser"""
        async with self._lock:
            if self.browser and self.context:
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
                    ],
                }

                if sys.platform == "win32":
                    launch_options["channel"] = "chrome"

                try:
                    self.browser = await self.playwright.chromium.launch(**launch_options)
                except Exception:
                    launch_options.pop("channel", None)
                    self.browser = await self.playwright.chromium.launch(**launch_options)
                
                # Create persistent context (maintains cookies and sessions)
                self.context = await self.browser.new_context(
                    viewport={"width": 1920, "height": 1080},
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    accept_downloads=True,
                )
                
                logger.info("✅ Browser initialized with persistent context")
                
            except Exception as e:
                logger.error(f"❌ Browser initialization failed: {str(e)}")
                raise RuntimeError(f"Browser initialization failed: {str(e)}")

    async def login_if_required(
        self, 
        login_url: Optional[str],
        username: Optional[str],
        password: Optional[str]
    ) -> bool:
        """Handle login if directory requires authentication"""
        if not login_url or not username or not password:
            return True  # No login required
        
        page = await self.context.new_page()
        
        try:
            logger.info(f"Logging in to {login_url}")
            
            await page.goto(login_url, wait_until="domcontentloaded", timeout=self.settings.BROWSER_TIMEOUT)
            await page.wait_for_load_state("networkidle", timeout=10000)
            
            # Try common login field selectors
            username_selectors = [
                'input[type="email"]',
                'input[name="email"]',
                'input[name="username"]',
                'input[id="email"]',
                'input[id="username"]',
                '#email', '#username'
            ]
            
            password_selectors = [
                'input[type="password"]',
                'input[name="password"]',
                '#password'
            ]
            
            # Fill username
            for selector in username_selectors:
                try:
                    if await page.locator(selector).count() > 0:
                        await page.locator(selector).first.fill(username)
                        break
                except:
                    continue
            
            # Fill password
            for selector in password_selectors:
                try:
                    if await page.locator(selector).count() > 0:
                        await page.locator(selector).first.fill(password)
                        break
                except:
                    continue
            
            # Click login button
            login_button_selectors = [
                'button[type="submit"]',
                'input[type="submit"]',
                'button:has-text("Log in")',
                'button:has-text("Login")',
                'button:has-text("Sign in")',
            ]
            
            for selector in login_button_selectors:
                try:
                    if await page.locator(selector).count() > 0:
                        await page.locator(selector).first.click()
                        break
                except:
                    continue
            
            # Wait for navigation after login
            await asyncio.sleep(3)
            
            logger.info("✅ Login successful")
            return True
            
        except Exception as e:
            logger.error(f"❌ Login failed: {str(e)}")
            return False
        finally:
            await page.close()
    
    async def close(self):
        """Close browser and playwright"""
        async with self._lock:
            try:
                if self.browser:
                    await self.browser.close()
                    self.browser = None
                if self.browser:
                    await self.browser.close()
                    self.browser = None
                if self.playwright:
                    await self.playwright.stop()
                    self.playwright = None
            except Exception as e:
                logger.error(f"❌ Error closing browser: {str(e)}")

    async def navigate_and_screenshot(self, url: str) -> Tuple[str, str]:
        """Navigate to URL and take screenshot using persistent context"""
        if not self.context:
            await self.initialize()
        
        page = await self.context.new_page()
        
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
        self, 
        url: str, 
        field_mapping: Dict[str, any], 
        submit_button_selector: Optional[str] = None,
        is_multi_step: bool = False,
        step_count: int = 1
    ) -> Dict:
        """
        Fill and submit form with support for multi-step forms.
        Uses persistent context to maintain login session.
        """
        if not self.context:
            await self.initialize()
        
        page = await self.context.new_page()
        
        result = {
            "success": False,
            "message": "",
            "listing_url": None,
            "screenshot_path": None
        }
        
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=self.settings.BROWSER_TIMEOUT)
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
            
            # Wait for submission to complete
            await asyncio.sleep(3)
            
            # Check result
            current_url = page.url
            page_content = await page.content()
            
            success_indicators = [
                "success", "thank you", "submitted", "received",
                "confirmation", "pending review", "approved"
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
                    "error", "invalid", "failed", "required field",
                    "please correct", "try again"
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
            pass
    
    async def _click_next_button(self, page: Page):
        """Click Next button in multi-step forms"""
        next_selectors = [
            'button:has-text("Next")',
            'button:has-text("Continue")',
            'input[value="Next"]',
            'input[value="Continue"]',
            'a:has-text("Next")',
            '.next-button',
            '#next',
        ]
        
        for selector in next_selectors:
            try:
                if await page.locator(selector).count() > 0:
                    await page.locator(selector).first.scroll_into_view_if_needed()
                    await page.locator(selector).first.click()
                    return
            except:
                continue
        
        raise Exception("Next button not found")
    
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
            'button:has-text("Publish")',
            '.submit-button',
            '#submit',
        ]
        
        for selector in selectors:
            try:
                if await page.locator(selector).count() > 0:
                    await page.locator(selector).first.scroll_into_view_if_needed()
                    await page.locator(selector).first.click()
                    return
            except:
                continue
        
        raise Exception("Submit button not found")
