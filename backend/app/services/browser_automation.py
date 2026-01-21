"""
Browser automation facade using Playwright.

This is a simplified facade that delegates to specialized modules:
- BrowserManager: Browser lifecycle
- LoginHandler: Authentication
- FormFiller: Form operations
- URLSubmissionHandler: URL-first submission pattern
"""

from typing import Any, Dict, Optional

from app.config import get_settings
from app.services.browser_manager import BrowserManager
from app.services.form_filler import FormFiller
from app.services.login_handler import LoginHandler
from app.services.url_submission import URLSubmissionHandler
from app.utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()


class BrowserAutomation:
    """
    Facade for browser automation using specialized modules.

    Delegates to:
    - BrowserManager for lifecycle
    - LoginHandler for authentication
    - FormFiller for form operations
    - URLSubmissionHandler for URL-first pattern
    """

    def __init__(self):
        self.browser_manager = BrowserManager()
        self.settings = settings

    async def __aenter__(self):
        await self.browser_manager.initialize()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.browser_manager.close()

    async def initialize(self):
        """Initialize browser."""
        await self.browser_manager.initialize()

    async def close(self):
        """Close browser."""
        await self.browser_manager.close()

    async def login_if_required(
        self,
        login_url: Optional[str],
        username: Optional[str],
        password: Optional[str],
    ) -> bool:
        """Handle login if directory requires authentication."""
        login_handler = LoginHandler(self.browser_manager.context, self.settings.BROWSER_TIMEOUT)
        return await login_handler.login_if_required(login_url, username, password)

    async def navigate_and_screenshot(self, url: str) -> tuple[str, str]:
        """Navigate to URL and take screenshot."""
        return await self.browser_manager.navigate_and_screenshot(url)

    async def fill_and_submit_form(
        self,
        url: str,
        field_mapping: Dict[str, Any],
        submit_button_selector: Optional[str] = None,
        is_multi_step: bool = False,
        step_count: int = 1,
    ) -> Dict:
        """Fill and submit form with support for multi-step forms."""
        form_filler = FormFiller(self.browser_manager.context, self.settings.BROWSER_TIMEOUT)
        return await form_filler.fill_and_submit_form(
            url, field_mapping, submit_button_selector, is_multi_step, step_count
        )

    async def submit_url_first_step(
        self,
        initial_url: str,
        website_url: str,
        url_field_selector: Optional[str] = None,
        url_submit_selector: Optional[str] = None,
    ) -> str:
        """Handle two-step submission where URL is submitted first."""
        url_handler = URLSubmissionHandler(
            self.browser_manager.context, self.settings.BROWSER_TIMEOUT
        )
        return await url_handler.submit_url_first_step(
            initial_url, website_url, url_field_selector, url_submit_selector
        )
