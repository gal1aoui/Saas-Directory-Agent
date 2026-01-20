import json
from typing import Dict, List, Optional

import ollama

from app.config import get_settings
from app.utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()


class AIFormReader:
    """
    AI-powered form detection using Ollama with Mistral (Local & Free).
    Analyzes HTML to detect form fields for SaaS directory submissions.
    """

    def __init__(self):
        self.client = ollama.Client(host=settings.OLLAMA_HOST)
        self.model = settings.OLLAMA_MODEL

        # Verify Ollama is running and model is available
        try:
            models_response = self.client.list()

            # Handle the response structure properly
            if isinstance(models_response, dict) and "models" in models_response:
                models_list = models_response["models"]
            elif hasattr(models_response, "models"):
                models_list = models_response.models
            else:
                # If response structure is unexpected, log it and continue
                logger.warning(f"Unexpected Ollama response structure: {type(models_response)}")
                logger.info(f"⚠️ Proceeding with model: {self.model} (verify it's available)")
                return

            # Extract model names from the response (handle both dict and object formats)
            available_models = []
            for m in models_list:
                if isinstance(m, dict):
                    available_models.append(m.get("name") or m.get("model"))
                else:
                    # Try different attribute names that Ollama Model objects might have
                    model_name = getattr(m, "model", None) or getattr(m, "name", None) or str(m)
                    available_models.append(model_name)

            available_models = [name for name in available_models if name]

            if self.model not in available_models:
                logger.error(f"Model {self.model} not found. Available models: {available_models}")
                logger.error(f"Please run: ollama pull {self.model}")
                raise ValueError(f"Model {self.model} not available in Ollama")

            logger.info(f"✅ AI Form Reader initialized with Ollama model: {self.model}")
        except Exception as e:
            logger.error(f"❌ Failed to connect to Ollama at {settings.OLLAMA_HOST}")
            logger.error("Make sure Ollama is running: ollama serve")
            logger.error(f"Details: {str(e)}")
            raise

    async def analyze_form_from_screenshot(
        self, screenshot_path: str, html_content: Optional[str] = None
    ) -> Dict:
        """
        Analyze a form from HTML content (screenshot analysis not needed with Mistral).
        For screenshot analysis, use OCR or convert to HTML first.
        Returns detected fields with their properties.
        """
        if not html_content:
            logger.warning(
                "⚠️ Screenshot analysis requires HTML content. Use analyze_form_from_html instead."
            )
            return {"fields": [], "submit_button_selector": None}

        return await self.analyze_form_from_html(html_content, "unknown")

    async def analyze_form_from_html(self, html_content: str, url: str) -> Dict:
        """
        Analyze form structure from HTML content only.
        Faster than image analysis.
        """
        try:
            prompt = f"""Analyze this HTML from {url} and identify form fields for SaaS submission.

HTML (truncated):
{html_content[:8000]}

Return ONLY valid JSON with this structure:
{{
    "fields": [
        {{
            "field_name": "company_name",
            "field_type": "text",
            "field_label": "Company Name",
            "selector": "#company-name",
            "is_required": true,
            "confidence_score": 90
        }}
    ],
    "submit_button_selector": "button[type='submit']"
}}

Field names to use: company_name, website_url, contact_email, description, short_description, category, logo, twitter_url, linkedin_url, pricing_model"""

            response = self.client.generate(
                model=self.model,
                prompt=prompt,
                options={"temperature": settings.AI_TEMPERATURE, "num_predict": settings.MAX_TOKENS},
            )

            result = response["response"]
            print(f"**************AI Response*************: {result}")
            return self._parse_ai_response(result)

        except Exception as e:
            logger.error(f"❌ Error analyzing HTML: {str(e)}")
            raise

    def _create_form_analysis_prompt(self, html_content: Optional[str] = None) -> str:
        """Create prompt for form analysis"""
        prompt = """Analyze this web form screenshot and identify ALL input fields for submitting a SaaS product.

Common fields to find:
- Company/Product Name
- Website URL
- Email
- Description (short/long)
- Category
- Logo upload
- Social media links
- Pricing

For EACH field provide:
1. Standardized field_name: company_name, website_url, contact_email, description, short_description, category, logo, twitter_url, linkedin_url, pricing_model
2. Field type: text, email, url, textarea, file, select
3. Is it required? (look for * or "required")
4. Visible label/placeholder
5. CSS selector to target it

Return ONLY valid JSON:
{
    "fields": [
        {
            "field_name": "company_name",
            "field_type": "text",
            "field_label": "Company Name",
            "selector": "#company-name",
            "is_required": true,
            "confidence_score": 95
        }
    ],
    "submit_button_selector": "button[type='submit']",
    "additional_notes": "any special requirements"
}"""

        if html_content:
            prompt += f"\n\nHTML context:\n{html_content[:5000]}"

        return prompt

    def _parse_ai_response(self, response: str) -> Dict:
        """Parse and validate AI response"""
        try:
            # Extract JSON
            if "```json" in response:
                json_str = response.split("```json")[1].split("```")[0]
            elif "```" in response:
                json_str = response.split("```")[1].split("```")[0]
            else:
                json_str = response

            data = json.loads(json_str.strip())

            if "fields" not in data:
                data = {"fields": [], "submit_button_selector": None}

            return data

        except json.JSONDecodeError:
            logger.error("❌ Failed to parse AI response")
            return {
                "fields": [],
                "submit_button_selector": None,
                "additional_notes": "Failed to parse AI response",
            }

    def map_saas_data_to_fields(self, saas_data: Dict, detected_fields: List[Dict]) -> Dict[str, any]:
        """Map SaaS product data to detected form fields."""
        field_mapping = {}

        for field in detected_fields:
            field_name = field.get("field_name", "")
            selector = field.get("selector", "")

            if not selector:
                continue

            value = None

            if field_name == "company_name":
                value = saas_data.get("name")
            elif field_name == "website_url":
                value = saas_data.get("website_url")
            elif field_name == "contact_email":
                value = saas_data.get("contact_email")
            elif field_name == "description":
                value = saas_data.get("description")
            elif field_name == "short_description":
                value = saas_data.get("short_description") or saas_data.get("tagline")
            elif field_name == "category":
                value = saas_data.get("category")
            elif field_name == "logo":
                value = saas_data.get("logo_url")
            elif field_name == "twitter_url":
                social = saas_data.get("social_links", {})
                value = social.get("twitter") if isinstance(social, dict) else None
            elif field_name == "linkedin_url":
                social = saas_data.get("social_links", {})
                value = social.get("linkedin") if isinstance(social, dict) else None
            elif field_name == "pricing_model":
                value = saas_data.get("pricing_model")

            if value:
                field_mapping[selector] = value

        return field_mapping
