from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class WasteCategory(str, Enum):
    PLASTIC = "plastic"
    PAPER = "paper"
    CARDBOARD = "cardboard"
    GLASS = "glass"
    METAL = "metal"
    BIOLOGICAL = "biological"
    BATTERY = "battery"
    SHOES = "shoes"
    CLOTHES = "clothes"
    TRASH = "trash"


class WasteItem(BaseModel):
    name: str = Field(..., description="Descriptive name of the detected object (e.g. plastic bottle, soda can)")
    category: WasteCategory = Field(..., description="One of the 10 SmartSort standard categories")
    quantity: int = Field(default=1, ge=1, description="Number of identical items in this group")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Conservative confidence score between 0.0 and 1.0")
    recyclable: bool = Field(..., description="Whether this item is generally recyclable")
    disposal_method: str = Field(..., description="Actionable disposal and sorting guidance")

    @field_validator("confidence", mode="before")
    @classmethod
    def clamp_confidence(cls, v):
        try:
            val = float(v)
            if val > 1.0 and val <= 100.0:
                val = val / 100.0
            return max(0.0, min(1.0, round(val, 2)))
        except (ValueError, TypeError):
            return 0.5


class AnalysisData(BaseModel):
    items: List[WasteItem] = Field(default_factory=list, description="List of detected waste items")
    total_items: int = Field(default=0, ge=0, description="Sum of quantities of all detected items")
    summary: str = Field(..., description="Concise overall summary of the detected waste")


class AnalysisResponse(BaseModel):
    success: bool = True
    data: AnalysisData


class HealthResponse(BaseModel):
    status: str = "ok"
