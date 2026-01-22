import json
from typing import Any, Dict, List, Optional

import ollama

from app.config import get_settings
from app.utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()


class AIFormReader:
    """
    AI-powered form detection.

    Modes:
    - Cloud: Uses Browser Use Cloud API (no Ollama needed)
    - Local: Uses Ollama with Qwen2.5-VL (requires local Ollama running)
    """

    def __init__(self):
        self.use_cloud = settings.USE_BROWSER_USE_CLOUD
        self.client = None
        self.model = settings.OLLAMA_MODEL

        # Only initialize Ollama if in local mode
        if not self.use_cloud:
            self.client = ollama.Client(host=settings.OLLAMA_HOST)

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
                    logger.error(
                        f"Model {self.model} not found. Available models: {available_models}"
                    )
                    logger.error(f"Please run: ollama pull {self.model}")
                    raise ValueError(f"Model {self.model} not available in Ollama")

                logger.info(f"✅ AI Form Reader initialized with Ollama model: {self.model}")
            except Exception as e:
                logger.error(f"❌ Failed to connect to Ollama at {settings.OLLAMA_HOST}")
                logger.error("Make sure Ollama is running: ollama serve")
                logger.error(f"Details: {str(e)}")
                raise
        else:
            logger.info("🌐 AI Form Reader initialized with Browser Use Cloud API (no Ollama needed)")

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
        Analyze form structure from HTML content.
        Works with both cloud (Browser Use) and local (Ollama) modes.
        """
        try:
            if self.use_cloud:
                # Cloud mode - use Browser Use for form analysis
                return await self._analyze_with_browser_use(html_content, url)
            else:
                # Local mode - use Ollama for form analysis
                return await self._analyze_with_ollama(html_content, url)

        except Exception as e:
            logger.error(f"❌ Error analyzing HTML: {str(e)}")
            raise

    async def _analyze_with_browser_use(self, html_content: str, url: str) -> Dict:
        """Analyze form structure using Browser Use Cloud"""
        # For cloud mode, we return a simplified analysis since Browser Use
        # will handle the actual form filling intelligently
        logger.info("📊 Using Browser Use Cloud for form analysis")

        # Browser Use will auto-detect and fill forms, so we return
        # a basic structure indicating cloud analysis is available
        return {
            "fields": [],  # Browser Use handles field detection automatically
            "submit_button_selector": None,
            "analysis_method": "browser_use_cloud",
            "confidence_score": 100,
            "note": "Browser Use Cloud will intelligently detect and fill form fields",
        }

    async def _analyze_with_ollama(self, html_content: str, url: str) -> Dict:
        """Analyze form structure using local Ollama"""
        prompt = f"""You are a form analysis expert. Your task is to analyze HTML and
            extract form field information for a SaaS product submission form.

            INSTRUCTIONS:
            1. Look for input, textarea, and select elements in the HTML
            2. Identify what type of information each field collects
            3. Create CSS selectors for each field (use id, name, or class attributes)
            4. Determine if fields are required (look for "required" attribute or asterisk *)
            5. Map fields to standardized names

            STANDARDIZED FIELD NAMES YOU MUST USE:
            - company_name: Product or company name
            - website_url: Website URL field
            - contact_email: Email address
            - description: Long description or details
            - short_description: Short description, tagline, or pitch
            - category: Category or industry selection
            - logo: Logo or image upload
            - twitter_url: Twitter link
            - linkedin_url: LinkedIn link
            - pricing_model: Pricing information

            HTML CONTENT FROM {url}:
            {html_content[:8000]}

            OUTPUT FORMAT:
            Return ONLY a valid JSON object (no markdown, no explanations) with this exact structure:
            {{
                "fields": [
                    {{
                        "field_name": "company_name",
                        "field_type": "text",
                        "field_label": "Company Name",
                        "selector": "input[name='company']",
                        "is_required": true,
                        "confidence_score": 95
                    }}
                ],
                "submit_button_selector": "button[type='submit']"
            }}

            IMPORTANT:
            - confidence_score should be 0-100 based on how sure you are about the mapping
            - field_type can be: text, email, url, textarea, file, select
            - selector must be a valid CSS selector
            - Return empty fields array if no form found
            - Do not include any text before or after the JSON"""

        response = self.client.generate(
            model=self.model,
            prompt=prompt,
            options={
                "temperature": settings.AI_TEMPERATURE,
                "num_predict": settings.MAX_TOKENS,
                "top_p": 0.9,
                "top_k": 40,
            },
        )

        result = response["response"]
        logger.info(f"AI Raw Response: {result[:500]}...")
        return self._parse_ai_response(result)

    def _create_form_analysis_prompt(self, html_content: Optional[str] = None) -> str:
        """Create prompt for form analysis"""
        prompt = """Analyze this web form screenshot and identify ALL input fields
            for submitting a SaaS product.

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
            1. Standardized field_name: company_name, website_url, contact_email,
            description, short_description, category, logo, twitter_url,
            linkedin_url, pricing_model
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
        """Parse and validate AI response with robust JSON extraction"""
        try:
            # Try multiple JSON extraction methods
            json_str = response.strip()

            # Method 1: Extract from markdown code blocks
            if "```json" in json_str:
                json_str = json_str.split("```json")[1].split("```")[0].strip()
            elif "```" in json_str:
                json_str = json_str.split("```")[1].split("```")[0].strip()

            # Method 2: Find JSON object boundaries
            if not json_str.startswith("{"):
                # Find first { and last }
                start = json_str.find("{")
                end = json_str.rfind("}") + 1
                if start != -1 and end > start:
                    json_str = json_str[start:end]

            # Method 3: Clean common AI response artifacts
            json_str = json_str.replace("\n", " ").replace("\r", "")

            # Try to parse
            data = json.loads(json_str)

            # Validate structure
            if "fields" not in data:
                logger.warning("⚠️ AI response missing 'fields' key, adding empty array")
                data["fields"] = []

            if "submit_button_selector" not in data:
                logger.warning("⚠️ AI response missing 'submit_button_selector', setting to None")
                data["submit_button_selector"] = None

            # Validate each field has required properties
            valid_fields = []
            for field in data.get("fields", []):
                if all(key in field for key in ["field_name", "selector"]):
                    valid_fields.append(field)
                else:
                    logger.warning(f"⚠️ Skipping invalid field: {field}")

            data["fields"] = valid_fields
            logger.info(f"✅ Successfully parsed {len(valid_fields)} form fields")

            return data

        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON parsing failed: {str(e)}")
            logger.error(f"Raw response: {response[:500]}...")
            return {
                "fields": [],
                "submit_button_selector": None,
                "additional_notes": f"Failed to parse AI response: {str(e)}",
            }
        except Exception as e:
            logger.error(f"❌ Unexpected error parsing response: {str(e)}")
            return {
                "fields": [],
                "submit_button_selector": None,
                "additional_notes": f"Error: {str(e)}",
            }

    def map_saas_data_to_fields(self, saas_data: Dict, detected_fields: List[Dict]) -> Dict[str, Any]:
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
