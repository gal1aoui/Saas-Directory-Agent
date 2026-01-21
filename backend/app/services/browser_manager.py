"""
Browser lifecycle management for Playwright automation.

Handles browser initialization, context creation, and cleanup.
"""

import asyncio
import sys
from typing import Optional

from playwright.async_api import Browser, BrowserContext, async_playwright
from playwright.async_api import TimeoutError as PlaywrightTimeoutError

from app.config import get_settings
from app.utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()


class BrowserManager:
    """Manages Playwright browser lifecycle and persistent contexts."""

    def __init__(self):
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.settings = settings
        self._lock = asyncio.Lock()

    async def __aenter__(self):
        await self.initialize()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()

    async def initialize(self):
        """Initialize Playwright browser and create persistent context."""
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
                raise RuntimeError(f"Browser initialization failed: {str(e)}") from e

    async def close(self):
        """Close browser and playwright resources."""
        async with self._lock:
            try:
                if self.context:
                    await self.context.close()
                    self.context = None
                if self.browser:
                    await self.browser.close()
                    self.browser = None
                if self.playwright:
                    await self.playwright.stop()
                    self.playwright = None
            except Exception as e:
                logger.error(f"❌ Error closing browser: {str(e)}")

    async def new_page(self):
        """Create a new page in the persistent context."""
        if not self.context:
            await self.initialize()
        return await self.context.new_page()

    async def navigate_and_screenshot(self, url: str) -> tuple[str, str]:
        """
        Navigate to URL and take screenshot.

        Args:
            url: Target URL

        Returns:
            Tuple of (screenshot_path, html_content)
        """
        import os
        from datetime import datetime

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
