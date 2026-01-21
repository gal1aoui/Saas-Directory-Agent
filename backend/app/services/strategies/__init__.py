"""Submission strategy modules."""

from app.services.strategies.browser_use_strategy import BrowserUseStrategy
from app.services.strategies.playwright_strategy import PlaywrightStrategy

__all__ = ["BrowserUseStrategy", "PlaywrightStrategy"]
