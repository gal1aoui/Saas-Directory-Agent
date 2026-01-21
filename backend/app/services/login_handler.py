"""
Login and authentication handling for directory submissions.

Handles login to directories that require authentication before submission.
"""

import asyncio
from typing import Optional

from playwright.async_api import BrowserContext

from app.utils.logger import get_logger

logger = get_logger(__name__)


class LoginHandler:
    """Handles directory login operations."""

    def __init__(self, context: BrowserContext, browser_timeout: int):
        self.context = context
        self.browser_timeout = browser_timeout

    async def login_if_required(
        self,
        login_url: Optional[str],
        username: Optional[str],
        password: Optional[str],
    ) -> bool:
        """
        Handle login if directory requires authentication.

        Args:
            login_url: URL of the login page
            username: Username or email
            password: Password

        Returns:
            True if login successful or not required
        """
        if not login_url or not username or not password:
            return True  # No login required

        page = await self.context.new_page()

        try:
            logger.info(f"Logging in to {login_url}")

            await page.goto(
                login_url,
                wait_until="domcontentloaded",
                timeout=self.browser_timeout,
            )
            await page.wait_for_load_state("networkidle", timeout=10000)

            # Try common login field selectors
            username_selectors = [
                'input[type="email"]',
                'input[name="email"]',
                'input[name="username"]',
                'input[id="email"]',
                'input[id="username"]',
                "#email",
                "#username",
            ]

            password_selectors = [
                'input[type="password"]',
                'input[name="password"]',
                "#password",
            ]

            # Fill username
            for selector in username_selectors:
                try:
                    if await page.locator(selector).count() > 0:
                        await page.locator(selector).first.fill(username)
                        break
                except Exception:
                    continue

            # Fill password
            for selector in password_selectors:
                try:
                    if await page.locator(selector).count() > 0:
                        await page.locator(selector).first.fill(password)
                        break
                except Exception:
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
                except Exception:
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
