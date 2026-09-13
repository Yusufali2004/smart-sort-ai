import io
import json
import logging
import os
import re
from typing import List, Literal, Optional
from PIL import Image
from pydantic import BaseModel, Field, field_validator

logger = logging.getLogger("smartsort.gemini")

ALLOWED_CATEGORIES = {
    "plastic",
    "paper",
    "cardboard",
    "glass",
    "metal",
    "biological",
    "battery",
    "shoes",
    "clothes",
    "trash",
}

CATEGORY_MAP = {
    "organic": "biological",
    "food": "biological",
    "food waste": "biological",
    "bio": "biological",
    "e-waste": "trash",
    "electronic": "trash",
    "electronics": "trash",
    "clothing": "clothes",
    "fabric": "clothes",
    "textile": "clothes",
    "footwear": "shoes",
    "shoe": "shoes",
    "can": "metal",
    "cans": "metal",
    "tin": "metal",
    "bottle": "plastic",
    "general trash": "trash",
    "garbage": "trash",
    "general waste": "trash",
    "landfill": "trash",
}


class DetectedItem(BaseModel):
    name: str = Field(description="Descriptive name of the object, e.g., 'plastic water bottle'")
    category: str = Field(description="One of: plastic, paper, cardboard, glass, metal, biological, battery, shoes, clothes, trash")
    quantity: int = Field(ge=1, default=1, description="Count of identical objects")
    confidence: float = Field(ge=0.0, le=1.0, description="Conservative confidence score between 0.0 and 1.0")
    recyclable: bool = Field(description="Whether this item is recyclable in standard municipal or specialized programs")
    disposal_method: str = Field(description="Actionable disposal guidance, e.g., 'Rinse thoroughly and place in blue bin'")

    @field_validator("category", mode="before")
    def normalize_category(cls, v: str) -> str:
        if not isinstance(v, str):
            return "trash"
        cat = v.strip().lower()
        if cat in ALLOWED_CATEGORIES:
            return cat
        if cat in CATEGORY_MAP:
            return CATEGORY_MAP[cat]
        for key in ALLOWED_CATEGORIES:
            if key in cat:
                return key
        return "trash"


class WasteAnalysisData(BaseModel):
    items: List[DetectedItem] = Field(default_factory=list)
    total_items: int = Field(default=0)
    summary: str = Field(default="")


SYSTEM_INSTRUCTION = """You are SmartSort AI, a waste analysis assistant.
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
      "quantity": 3,
      "confidence": 0.92,
      "recyclable": true,
      "disposal_method": "Recycle after emptying and rinsing."
    }
  ],
  "total_items": 3,
  "summary": "Detected 3 plastic bottles suitable for recycling."
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

    async def analyze_image(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> WasteAnalysisData:
        """
        Analyzes an image using the official Google GenAI SDK (google-genai).
        """
        api_key = self._get_api_key()

        # Use modern google-genai SDK
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=api_key)
            model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

            image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)

            response = client.models.generate_content(
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

        except ImportError:
            logger.warning("google-genai not found, trying fallback...")
            import google.generativeai as legacy_genai

            legacy_genai.configure(api_key=api_key)
            model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
            model = legacy_genai.GenerativeModel(
                model_name=model_name,
                system_instruction=SYSTEM_INSTRUCTION,
                generation_config={
                    "response_mime_type": "application/json",
                    "temperature": 0.2,
                },
            )

            pil_image = Image.open(io.BytesIO(image_bytes))
            if pil_image.mode not in ("RGB", "L"):
                pil_image = pil_image.convert("RGB")

            response = model.generate_content([pil_image, USER_PROMPT])
            raw_text = response.text or "{}"
            return self._parse_and_validate(raw_text)

        except Exception as exc:
            logger.error(f"Gemini API request failed: {exc}")
            raise RuntimeError(f"Gemini API processing failed: {str(exc)}")

    def _parse_and_validate(self, raw_json_str: str) -> WasteAnalysisData:
        clean_json = _extract_json_string(raw_json_str)
        try:
            data = json.loads(clean_json)
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON received from Gemini: {clean_json}")
            raise ValueError(f"Gemini returned non-JSON response: {e}")

        items_raw = data.get("items", [])
        parsed_items: List[DetectedItem] = []
        for it in items_raw:
            try:
                parsed_items.append(DetectedItem(**it))
            except Exception as item_err:
                logger.warning(f"Skipping malformed item {it}: {item_err}")

        total_items = sum(it.quantity for it in parsed_items)
        summary = data.get("summary", "").strip()
        if not summary:
            if total_items > 0:
                summary = f"Detected {total_items} waste item(s) across {len(parsed_items)} stream(s)."
            else:
                summary = "No recognizable waste was confidently identified in the image."

        return WasteAnalysisData(
            items=parsed_items,
            total_items=total_items,
            summary=summary,
        )


gemini_service = GeminiService()
