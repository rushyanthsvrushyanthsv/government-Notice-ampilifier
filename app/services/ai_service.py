import json
import google.generativeai as genai
from google.cloud import translate_v2 as translate
from app.core.config import settings

class AIService:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
        self.translator = translate.Client()

    async def simplify_notice(self, raw_text: str) -> dict:
        prompt = f"""
        You are an expert at simplifying Indian government notices for common citizens.
        Given the following government notice text, extract and simplify:
        
        1. simplified_summary: Simple 200-word explanation a 5th grader would understand. No jargon.
        2. key_deadlines: List of {{title, date, description, urgency_level}} objects. date must be ISO format if possible.
        3. fees_required: List of {{fee_name, amount, currency, payment_method}} objects.
        4. eligibility_criteria: List of {{criterion, details}}.
        5. action_items: Ordered list of {{step_number, action, description, requires_document, requires_payment, amount, deadline}}.
        6. urgency_level: "low"|"medium"|"high"|"critical".
        7. notice_category: category of notice (e.g., Tax, Education, etc.).
        8. key_highlights: Important points to emphasize.

        Notice text: {raw_text}

        Return ONLY valid JSON. No markdown. No explanation.
        """
        
        try:
            response = self.model.generate_content(prompt)
            # Remove any markdown backticks if AI accidentally included them
            clean_text = response.text.strip().replace('```json', '').replace('```', '')
            return json.loads(clean_text)
        except Exception as e:
            print(f"Gemini API Error: {e}")
            raise

    async def translate_to_kannada(self, text: str) -> str:
        try:
            result = self.translator.translate(text, target_language="kn")
            return result["translatedText"]
        except Exception as e:
            print(f"Translation Error: {e}")
            return text

    async def get_word_meaning(self, word: str, context: str) -> str:
        prompt = f"Explain the government/legal term '{word}' in the context of: '{context}'. Keep it very simple for a common person."
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"Gemini meaning error: {e}")
            return "Definition unavailable"

ai_service = AIService()
