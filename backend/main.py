import os
import logging
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from the backend directory
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

from fastapi import FastAPI, File, UploadFile, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from schemas import AnalysisResponse, HealthResponse
from services.gemini_service import GeminiService

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("smartsort.backend")

app = FastAPI(
    title="SmartSort AI Backend",
    description="Multimodal waste analysis and recycling guidance.",
    version="1.0.0",
)

# Configure CORS
origins_str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
allowed_origins = [orig.strip() for orig in origins_str.split(",") if orig.strip()]
if not allowed_origins:
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini Service
gemini_service = GeminiService()

ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint to verify backend status and API configuration."""
    return HealthResponse(status="ok")


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_image(
    image: UploadFile = File(None, description="Image file to analyze (field 'image')"),
    file: UploadFile = File(None, description="Alternative field 'file'"),
):
    """
    Analyzes an uploaded waste image using AI vision.
    Detects individual objects, counts items, categorizes them,
    and returns recycling and disposal instructions.
    """
    # Accept either 'image' or 'file' field
    upload = image or file
    if not upload or not upload.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No image file provided. Please upload an image with field name 'image' or 'file'.",
        )

    # Validate file extension
    ext = Path(upload.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS and upload.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported image format: {upload.content_type or ext}. Allowed formats: JPG, PNG, WEBP.",
        )

    # Read and validate file size
    try:
        content = await upload.read()
    except Exception as e:
        logger.error(f"Failed to read upload: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not read uploaded image data.",
        )

    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes).",
        )

    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image size exceeds 10MB limit (size: {len(content) / (1024*1024):.1f}MB).",
        )

    # Perform AI analysis
    try:
        result_data = await gemini_service.analyze_image(
            image_bytes=content,
            mime_type=upload.content_type or "image/jpeg",
        )
        return AnalysisResponse(success=True, data=result_data)
    except ValueError as ve:
        logger.warning(f"Validation/Config error: {ve}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "success": False,
                "error": "Configuration or Input Error",
                "detail": str(ve),
            },
        )
    except Exception as e:
        logger.error(f"Analysis failure: {e}", exc_info=True)
        err_msg = str(e)
        if "503" in err_msg or "UNAVAILABLE" in err_msg or "high demand" in err_msg:
            return JSONResponse(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                content={
                    "success": False,
                    "error": "Model High Demand",
                    "detail": "The AI analysis model is experiencing temporary high demand. Please retry in a few seconds.",
                },
            )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": "AI Analysis Error",
                "detail": str(e),
            },
        )


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host=host, port=port, reload=True)
