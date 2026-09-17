import asyncio
import json
import logging
import os
import re
from pathlib import Path
from typing import List, Optional
from dotenv import load_dotenv

# Ensure environment variables from backend/.env are loaded
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from schemas import AnalysisData, WasteItem

logger = logging.getLogger("smartsort.gemini")

SYSTEM_INSTRUCTION = """You are SmartSort AI, an intelligent waste analysis assistant.
Analyze the provided image carefully.
Identify all clearly visible waste objects.
Distinguish separate visible objects whenever possible.
Group only genuinely identical objects when appropriate and provide their quantity.
Do not invent objects.
Assign each object to exactly one SmartSort category from the following list:
- plastic
- paper
- cardboard
- glass
- metal
- biological
- battery
- shoes
- clothes
- trash

Return only valid JSON matching the requested schema.
For each detected item provide name, category, quantity, confidence, recyclability, and disposal guidance.
If objects overlap or are unclear, lower confidence rather than pretending certainty.
If the image contains no recognizable waste, return an empty items array and explain that no waste was confidently identified in the summary."""

USER_PROMPT = """Analyze this image for waste sorting. Identify every distinct waste item or group of identical items.
Return strict JSON matching this schema:
{
  "items": [
    {
      "name": "plastic bottle",
      "category": "plastic",
      "quantity": 1,
      "confidence": 0.95,
      "recyclable": true,
      "disposal_method": "Rinse and place in recycling bin."
    }
  ],
  "total_items": 1,
  "summary": "Detected 1 plastic bottle suitable for recycling."
}
"""


def _extract_json_string(text: str) -> str:
    """Extract raw JSON from possible markdown wrappers."""
    text = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        return match.group(1).strip()
    return text


class GeminiService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "").strip()

    def _get_api_key(self) -> str:
        key = self.api_key or os.getenv("GEMINI_API_KEY", "").strip()
        if not key or key == "your_key_here":
            raise ValueError(
                "GEMINI_API_KEY is not configured in backend/.env. "
                "Please add a valid Gemini API key from Google AI Studio."
            )
        return key

    def _get_model_name(self) -> str:
        model_name = os.getenv("GEMINI_MODEL", "").strip()
        if not model_name:
            raise ValueError(
                "GEMINI_MODEL is not configured in backend/.env. "
                "Please set GEMINI_MODEL (e.g. gemini-3.6-flash)."
            )
        return model_name

    async def analyze_image(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> AnalysisData:
        """
        Analyzes an image using the official Google GenAI SDK (google-genai).
        Returns a validated AnalysisData instance.
        """
        api_key = self._get_api_key()
        model_name = self._get_model_name()

        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)

        logger.info(f"Initiating image analysis with model: {model_name}")

        max_retries = 4
        delays = [1.5, 3.0, 5.0, 8.0]
        last_exc = None

        for attempt in range(max_retries):
            try:
                response = await asyncio.to_thread(
                    client.models.generate_content,
                    model=model_name,
                    contents=[
                        image_part,
                        types.Part.from_text(text=USER_PROMPT),
                    ],
                    config=types.GenerateContentConfig(
                        system_instruction=SYSTEM_INSTRUCTION,
                        response_mime_type="application/json",
                        temperature=0.2,
                    ),
                )
                raw_text = response.text or "{}"
                return self._parse_and_validate(raw_text)

            except Exception as exc:
                last_exc = exc
                err_str = str(exc)
                if ("503" in err_str or "UNAVAILABLE" in err_str or "high demand" in err_str) and attempt < max_retries - 1:
                    wait_time = delays[attempt]
                    logger.warning(
                        f"AI API temporary high demand (attempt {attempt + 1}/{max_retries}), retrying in {wait_time}s..."
                    )
                    await asyncio.sleep(wait_time)
                    continue
                logger.error(f"AI API request failed: {exc}", exc_info=True)
                raise RuntimeError(f"AI analysis processing failed: {str(exc)}")

        logger.error(f"AI API request failed after {max_retries} attempts: {last_exc}")
        raise RuntimeError(f"AI analysis processing failed: {str(last_exc)}")

    def _parse_and_validate(self, raw_json_str: str) -> AnalysisData:
        clean_json = _extract_json_string(raw_json_str)
        try:
            data = json.loads(clean_json)
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON received from AI model: {clean_json}")
            raise ValueError(f"AI model returned non-JSON response: {e}")

        items_raw = data.get("items", [])
        parsed_items: List[WasteItem] = []
        for it in items_raw:
            try:
                parsed_items.append(WasteItem(**it))
            except Exception as item_err:
                logger.warning(f"Skipping malformed item {it}: {item_err}")

        total_items = sum(it.quantity for it in parsed_items)
        summary = data.get("summary", "").strip()
        if not summary:
            if total_items > 0:
                summary = f"Detected {total_items} waste item(s) across {len(parsed_items)} stream(s)."
            else:
                summary = "No recognizable waste was confidently identified in the image."

        return AnalysisData(
            items=parsed_items,
            total_items=total_items,
            summary=summary,
        )


gemini_service = GeminiService()
