import base64
import json
from typing import Dict, List, Optional
from openai import OpenAI
from anthropic import Anthropic
from app.config import get_settings
from app.utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()

class AIFormReader:
    """
    AI-powered form field detection using vision models.
    Analyzes screenshots and HTML to detect form fields.
    """
    
    def __init__(self, provider: str = "openai"):
        self.provider = provider
        self.settings = settings
        
        if provider == "openai":
            self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
            self.model = "gpt-4-vision-preview"
        elif provider == "anthropic":
            self.client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
            self.model = "claude-3-opus-20240229"
        else:
            raise ValueError(f"Unsupported provider: {provider}")
    
    async def analyze_form_from_screenshot(
        self, 
        screenshot_path: str,
        html_content: Optional[str] = None
    ) -> Dict:
        """
        Analyze a form from a screenshot and optionally HTML.
        Returns detected fields with their properties.
        """
        try:
            # Read and encode screenshot
            with open(screenshot_path, "rb") as image_file:
                image_data = base64.b64encode(image_file.read()).decode("utf-8")
            
            # Prepare prompt
            prompt = self._create_form_analysis_prompt(html_content)
            
            # Call AI based on provider
            if self.provider == "openai":
                result = await self._analyze_with_openai(image_data, prompt)
            else:
                result = await self._analyze_with_anthropic(image_data, prompt)
            
            return self._parse_ai_response(result)
            
        except Exception as e:
            logger.error(f"Error analyzing form: {str(e)}")
            raise
    
    async def analyze_form_from_html(self, html_content: str, url: str) -> Dict:
        """
        Analyze form structure from HTML content.
        Useful when screenshot analysis is not needed.
        """
        try:
            prompt = f"""
            Analyze this HTML content from {url} and identify all form fields for a SaaS submission.
            
            HTML Content:
            {html_content[:10000]}  # Limit to first 10k chars
            
            Identify:
            1. All input fields (text, email, url, file, textarea)
            2. Field labels and placeholders
            3. Required vs optional fields
            4. Submit button
            5. CSS selectors for each field
            
            Return as JSON with this structure:
            {{
                "form_action": "form action URL or null",
                "fields": [
                    {{
                        "field_name": "standardized name (e.g., company_name, website, email)",
                        "field_type": "text|email|url|textarea|file|select",
                        "field_label": "visible label text",
                        "selector": "CSS selector",
                        "placeholder": "placeholder text if any",
                        "is_required": true|false,
                        "options": ["option1", "option2"] (for select fields)
                    }}
                ],
                "submit_button_selector": "CSS selector for submit button"
            }}
            """
            
            if self.provider == "openai":
                response = self.client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.1,
                    response_format={"type": "json_object"}
                )
                result = response.choices[0].message.content
            else:
                response = self.client.messages.create(
                    model="claude-3-opus-20240229",
                    max_tokens=4096,
                    messages=[{"role": "user", "content": prompt}]
                )
                result = response.content[0].text
            
            return json.loads(result)
            
        except Exception as e:
            logger.error(f"Error analyzing HTML: {str(e)}")
            raise
    
    def _create_form_analysis_prompt(self, html_content: Optional[str] = None) -> str:
        """Create detailed prompt for form analysis"""
        base_prompt = """
        Analyze this web form screenshot and identify all input fields for submitting a SaaS product.
        
        Look for these common fields:
        - Company/Product Name
        - Website URL
        - Email
        - Description (short and long)
        - Category/Tags
        - Logo upload
        - Social media links
        - Pricing model
        
        For each field identified, provide:
        1. Field purpose (what data it expects)
        2. Field type (text, email, url, textarea, file, select)
        3. Whether it's required (look for asterisks or "required" labels)
        4. The visible label or placeholder text
        
        Return as structured JSON:
        {
            "fields": [
                {
                    "field_name": "standardized_name",
                    "field_type": "input_type",
                    "field_label": "visible label",
                    "is_required": boolean,
                    "confidence_score": 0-100
                }
            ],
            "submit_button_text": "text on submit button",
            "additional_notes": "any special requirements or captchas"
        }
        """
        
        if html_content:
            base_prompt += f"\n\nAdditional HTML context:\n{html_content[:5000]}"
        
        return base_prompt
    
    async def _analyze_with_openai(self, image_data: str, prompt: str) -> str:
        """Analyze using OpenAI GPT-4 Vision"""
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{image_data}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=4096,
            temperature=0.1
        )
        return response.choices[0].message.content
    
    async def _analyze_with_anthropic(self, image_data: str, prompt: str) -> str:
        """Analyze using Anthropic Claude Vision"""
        response = self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/png",
                                "data": image_data
                            }
                        },
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ]
        )
        return response.content[0].text
    
    def _parse_ai_response(self, response: str) -> Dict:
        """Parse and validate AI response"""
        try:
            # Try to extract JSON from response
            if "```json" in response:
                json_str = response.split("```json")[1].split("```")[0]
            elif "```" in response:
                json_str = response.split("```")[1].split("```")[0]
            else:
                json_str = response
            
            data = json.loads(json_str.strip())
            
            # Validate structure
            if "fields" not in data:
                raise ValueError("Invalid response: missing 'fields' key")
            
            # Standardize field names
            for field in data["fields"]:
                field["field_name"] = self._standardize_field_name(
                    field.get("field_name", ""),
                    field.get("field_label", "")
                )
            
            return data
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {str(e)}")
            logger.error(f"Response: {response}")
            raise
    
    def _standardize_field_name(self, field_name: str, field_label: str) -> str:
        """
        Map various field names/labels to standardized names.
        This helps with consistent data mapping.
        """
        field_text = (field_name + " " + field_label).lower()
        
        # Mapping rules
        if any(term in field_text for term in ["company", "product name", "app name", "startup"]):
            return "company_name"
        elif any(term in field_text for term in ["website", "url", "link", "site"]):
            return "website_url"
        elif any(term in field_text for term in ["email", "contact email"]):
            return "contact_email"
        elif any(term in field_text for term in ["short description", "tagline", "pitch"]):
            return "short_description"
        elif any(term in field_text for term in ["description", "about", "details"]):
            return "description"
        elif any(term in field_text for term in ["category", "industry", "sector"]):
            return "category"
        elif any(term in field_text for term in ["logo", "image", "icon"]):
            return "logo"
        elif any(term in field_text for term in ["twitter", "x.com"]):
            return "twitter_url"
        elif any(term in field_text for term in ["linkedin"]):
            return "linkedin_url"
        elif any(term in field_text for term in ["pricing", "price"]):
            return "pricing_model"
        else:
            # Return sanitized version of original
            return field_name.lower().replace(" ", "_")
    
    def map_saas_data_to_fields(
        self, 
        saas_data: Dict, 
        detected_fields: List[Dict]
    ) -> Dict[str, any]:
        """
        Map SaaS product data to detected form fields.
        Returns a dictionary ready for form filling.
        """
        field_mapping = {}
        
        for field in detected_fields:
            field_name = field["field_name"]
            
            # Map data based on standardized field name
            if field_name == "company_name":
                field_mapping[field["selector"]] = saas_data.get("name")
            elif field_name == "website_url":
                field_mapping[field["selector"]] = saas_data.get("website_url")
            elif field_name == "contact_email":
                field_mapping[field["selector"]] = saas_data.get("contact_email")
            elif field_name == "description":
                field_mapping[field["selector"]] = saas_data.get("description")
            elif field_name == "short_description":
                field_mapping[field["selector"]] = saas_data.get("short_description") or saas_data.get("tagline")
            elif field_name == "category":
                field_mapping[field["selector"]] = saas_data.get("category")
            elif field_name == "logo":
                field_mapping[field["selector"]] = saas_data.get("logo_url")
            elif field_name == "twitter_url":
                social = saas_data.get("social_links", {})
                field_mapping[field["selector"]] = social.get("twitter")
            elif field_name == "linkedin_url":
                social = saas_data.get("social_links", {})
                field_mapping[field["selector"]] = social.get("linkedin")
            elif field_name == "pricing_model":
                field_mapping[field["selector"]] = saas_data.get("pricing_model")
        
        return field_mapping