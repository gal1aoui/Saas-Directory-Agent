"""
Browser Use Integration Service

Provides AI-powered browser automation.
Supports both cloud API (default) and local Ollama modes.
- Cloud: Uses browser-use-sdk for Browser Use Cloud API
- Local: Uses browser-use library with Ollama LLM
"""

import logging
import os
from typing import Any, Dict, Optional

from browser_use_sdk import AsyncBrowserUse

from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


class BrowserUseService:
    """
    AI-powered browser automation service using Browser Use library.

    Supports two modes:
    - Cloud (default): Uses Browser Use Cloud API with built-in vision-language model
    - Local: Uses Ollama with Qwen2.5-VL vision model

    Both modes handle:
    - Automatic form detection
    - Intelligent field mapping
    - Multi-step form handling
    - Visual verification
    """

    def __init__(self):
        """Initialize Browser Use in Cloud or Local mode"""
        self.use_cloud = settings.USE_BROWSER_USE_CLOUD
        self.api_key = settings.BROWSER_USE_API_KEY
        self.llm = None
        self.cloud_client = None

        if self.use_cloud:
            if not self.api_key:
                raise ValueError("BROWSER_USE_API_KEY is not set in environment variables")
            # Set API key in environment for browser-use-sdk
            os.environ["BROWSER_USE_API_KEY"] = self.api_key

            try:
                self.cloud_client = AsyncBrowserUse(api_key=self.api_key)
                logger.info("🌐 BrowserUseService initialized with Browser Use Cloud API")
            except ImportError:
                logger.error(
                    "browser-use-sdk not installed. Install with: pip install browser-use-sdk"
                )
                raise
        else:
            from langchain_ollama import ChatOllama

            self.llm = ChatOllama(
                model=settings.OLLAMA_MODEL,
                base_url=settings.OLLAMA_HOST,
                temperature=settings.AI_TEMPERATURE,
            )
            logger.info(
                f"💻 BrowserUseService initialized with local Ollama: {settings.OLLAMA_MODEL}"
            )

    async def submit_to_directory(
        self,
        url: str,
        form_data: Dict[str, Any],
        login_credentials: Optional[Dict[str, str]] = None,
        requires_url_first: bool = False,
        url_first_selectors: Optional[Dict[str, str]] = None,
    ) -> Dict:
        """
        Submit form to directory using AI-powered browser automation.
        Login and submission are performed in a single continuous browser session.

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
            # Build a unified task prompt that handles login + submission in ONE session
            task_prompt = self._build_unified_task_prompt(
                url=url,
                form_data=form_data,
                login_credentials=login_credentials,
                requires_url_first=requires_url_first,
            )

            logger.info("AI Agent executing unified login + submission task...")

            # Create and run agent (cloud or local) - single session for entire workflow
            if self.use_cloud:
                # Cloud mode - use browser-use-sdk
                task = await self.cloud_client.tasks.create_task(task=task_prompt)
                result = await task.complete()
                return {
                    "success": True,
                    "message": "Form submitted successfully by Browser Use Cloud",
                    "screenshot_path": None,
                    "agent_result": result,
                }
            else:
                # Local mode - use browser-use library with Ollama
                from browser_use import Agent

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
            if self.use_cloud:
                result = await task.complete()
                return {
                    "success": False,
                    "message": f"AI submission failed: {str(e)}",
                    "screenshot_path": None,
                    "agent_result": result,
                }

            return {
                "success": False,
                "message": f"AI submission failed: {str(e)}",
                "screenshot_path": None,
                "agent_result": None,
            }

    def _build_unified_task_prompt(
        self,
        url: str,
        form_data: Dict[str, Any],
        login_credentials: Optional[Dict[str, str]] = None,
        requires_url_first: bool = False,
    ) -> str:
        """
        Build a unified task prompt that handles login and submission in one continuous session.

        Args:
            url: Target submission URL
            form_data: Form data to submit
            login_credentials: Optional login credentials
            requires_url_first: Whether URL-first pattern is needed

        Returns:
            Complete task prompt for the AI agent
        """
        steps = []
        step_num = 1

        # Step: Login if credentials provided
        if login_credentials:
            login_url = login_credentials.get("login_url", url)
            steps.append(f"""Step {step_num}: LOGIN
                Navigate to: {login_url}
                Find the login form and enter the following credentials:
                - Username/Email: {login_credentials.get("username", "")}
                - Password: {login_credentials.get("password", "")}
                Click the login/submit button and wait for the login to complete.
                Verify you are logged in before proceeding.""")
            step_num += 1

        # Step: Navigate to submission URL (after login)
        steps.append(f"""Step {step_num}: NAVIGATE TO SUBMISSION PAGE
            Navigate to: {url}
            Wait for the page to fully load.""")
        step_num += 1

        # Step: URL-first submission if required
        if requires_url_first:
            steps.append(f"""Step {step_num}: SUBMIT URL FIRST
                This directory uses a two-step submission pattern:
                1. Find the URL/website input field on the page
                2. Enter the website URL: {form_data.get("website_url", "")}
                3. Click the submit/continue/next button
                4. Wait for the full form page to load before proceeding""")
            step_num += 1

        # Step: Fill and submit the form
        form_fields = self._build_task_prompt(form_data)
        steps.append(f"""Step {step_num}: FILL AND SUBMIT FORM
{form_fields}""")

        # Combine all steps into one unified prompt
        steps_text = "\n\n".join(steps)

        unified_prompt = f"""You are performing a directory submission task. Complete ALL steps in order within this single browser session.

            {steps_text}

            IMPORTANT:
            - Complete all steps in sequence without closing the browser
            - If login is required, stay logged in for the submission
            - Wait for each page to fully load before proceeding
            - If a field cannot be found, skip it and continue
            - Submit the form and wait for confirmation"""

        return unified_prompt


    def _build_task_prompt(self, form_data: Dict[str, Any]) -> str:
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
            analysis_task = f"""Navigate to: {url}

            Analyze the form on this page and identify:
            1. All input fields (text, email, URL, textarea, etc.)
            2. Field labels and placeholders
            3. Required vs optional fields
            4. Any dropdowns or select menus
            5. Whether this is a multi-step form
            6. Submit button location

            Provide a detailed description of the form structure."""

            if self.use_cloud:
                task = await self.cloud_client.tasks.create_task(task=analysis_task)
                result = await task.complete()
            else:
                from browser_use import Agent

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
