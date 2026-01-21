"""
Browser Use Integration Service

Provides AI-powered browser automation using the browser-use library with Qwen2.5-VL.
This service replaces manual Playwright automation with intelligent AI agents.
"""

import logging
from typing import Dict, Optional

from langchain_ollama import ChatOllama

from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


class BrowserUseService:
    """
    AI-powered browser automation service using Browser Use library.

    Uses Qwen2.5-VL (vision-language model) for:
    - Automatic form detection
    - Intelligent field mapping
    - Multi-step form handling
    - Visual verification
    """

    def __init__(self):
        """Initialize Browser Use with Ollama LLM"""
        self.llm = ChatOllama(
            model=settings.OLLAMA_MODEL,
            base_url=settings.OLLAMA_HOST,
            temperature=settings.AI_TEMPERATURE,
        )
        logger.info(f"BrowserUseService initialized with model: {settings.OLLAMA_MODEL}")

    async def submit_to_directory(
        self,
        url: str,
        form_data: Dict[str, any],
        login_credentials: Optional[Dict[str, str]] = None,
        requires_url_first: bool = False,
        url_first_selectors: Optional[Dict[str, str]] = None,
    ) -> Dict:
        """
        Submit form to directory using AI-powered browser automation.

        Args:
            url: Target directory URL
            form_data: Data to fill in the form
            login_credentials: Optional login credentials {username, password, login_url}
            requires_url_first: Whether to submit URL on initial page before form
            url_first_selectors: Selectors for URL-first submission pattern

        Returns:
            Dict with submission result {success, message, screenshot_path}
        """
        logger.info(f"Starting AI-powered submission to {url}")

        try:
            # Dynamic import to avoid loading if not used
            from browser_use import Agent

            # Step 1: Handle login if required
            if login_credentials:
                logger.info("Performing login...")
                login_result = await self._perform_login(login_credentials)
                if not login_result["success"]:
                    return login_result

            # Step 2 & 3: AI Agent handles navigation, URL-first submission, and form filling
            logger.info("AI Agent analyzing and filling form...")

            # Build comprehensive task prompt with URL navigation
            if requires_url_first and url_first_selectors:
                task_prompt = f"""Navigate to: {url}

{self._build_task_prompt(form_data)}

NOTE: This is a two-step submission form:
1. First, find and fill the URL field with: {form_data.get("website_url", "")}
2. Click the submit/continue button
3. Then fill and submit the remaining form fields"""
            else:
                task_prompt = f"""Navigate to: {url}

{self._build_task_prompt(form_data)}"""

            # Create and run agent
            # Browser Use v0.1.19 handles browser internally
            agent = Agent(
                task=task_prompt,
                llm=self.llm,
            )

            result = await agent.run()

            return {
                "success": True,
                "message": "Form submitted successfully by AI agent",
                "screenshot_path": None,
                "agent_result": result,
            }

        except Exception as e:
            logger.error(f"Browser Use submission failed: {str(e)}")
            return {
                "success": False,
                "message": f"AI submission failed: {str(e)}",
                "screenshot_path": None,
            }

    async def _perform_login(self, credentials: Dict[str, str]) -> Dict:
        """
        AI agent performs login.

        Args:
            credentials: {username, password, login_url}

        Returns:
            Dict with login result
        """
        try:
            from browser_use import Agent

            # AI agent handles login
            login_task = f"""Navigate to: {credentials["login_url"]}

Log in using the following credentials:
- Username/Email: {credentials["username"]}
- Password: {credentials["password"]}

Find the login form, fill in the credentials, and submit. Wait for successful login."""

            agent = Agent(task=login_task, llm=self.llm)
            result = await agent.run()

            return {"success": True, "message": "Login successful", "result": result}

        except Exception as e:
            logger.error(f"Login failed: {str(e)}")
            return {"success": False, "message": f"Login failed: {str(e)}"}

    async def _submit_url_first(
        self,
        url: str,
        form_data: Dict[str, any],
        selectors: Dict[str, str],
    ) -> Dict:
        """
        Handle two-step submission pattern (submit URL first, then fill form).
        Note: This is now handled by the main agent with task instructions.

        Args:
            url: Target URL
            form_data: Form data containing website_url
            selectors: {url_field_selector, url_submit_selector} (legacy, not used)

        Returns:
            Dict with submission result
        """
        # This method is kept for backward compatibility but logic is integrated
        # into the main submit_to_directory method
        logger.warning("⚠️ _submit_url_first is deprecated. URL-first logic is handled by main agent.")
        return {"success": True, "message": "URL-first submission handled by main agent"}

    def _build_task_prompt(self, form_data: Dict[str, any]) -> str:
        """
        Build AI agent task prompt from form data.

        Args:
            form_data: Form fields and values

        Returns:
            Detailed task prompt for AI agent
        """
        # Format form data for prompt
        fields_description = []
        for key, value in form_data.items():
            if value:  # Only include non-empty values
                # Convert key from snake_case to Title Case
                field_name = key.replace("_", " ").title()
                fields_description.append(f"- {field_name}: {value}")

        fields_text = "\n".join(fields_description)

        prompt = f"""
You are filling out a directory submission form.

Please find the form on this page and fill in the following information:

{fields_text}

Instructions:
1. Identify all form fields on the page
2. Match the provided data to the appropriate form fields
3. Fill in each field with the corresponding value
4. Handle any dropdowns, checkboxes, or special input types
5. If there are multiple steps, complete each step in order
6. Submit the form when all fields are filled
7. Wait for confirmation or success message

Be thorough and accurate. If a field is not found, skip it and continue with others.
"""
        return prompt

    async def analyze_form_structure(self, url: str) -> Dict:
        """
        AI agent analyzes form structure without submitting.

        Args:
            url: Directory submission URL

        Returns:
            Dict with detected form fields and structure
        """
        logger.info(f"AI analyzing form structure at {url}")

        try:
            from browser_use import Agent

            analysis_task = f"""Navigate to: {url}

Analyze the form on this page and identify:
1. All input fields (text, email, URL, textarea, etc.)
2. Field labels and placeholders
3. Required vs optional fields
4. Any dropdowns or select menus
5. Whether this is a multi-step form
6. Submit button location

Provide a detailed description of the form structure."""

            agent = Agent(task=analysis_task, llm=self.llm)
            result = await agent.run()

            return {
                "success": True,
                "analysis": result,
                "screenshot_path": None,
                "is_multi_step": "multi-step" in str(result).lower()
                or "multiple steps" in str(result).lower(),
            }

        except Exception as e:
            logger.error(f"Form analysis failed: {str(e)}")
            return {
                "success": False,
                "message": f"Form analysis failed: {str(e)}",
                "is_multi_step": False,
            }
