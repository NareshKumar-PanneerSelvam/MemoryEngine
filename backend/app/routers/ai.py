from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.core.auth import get_current_user
from app.models.user import User
from app.schemas.ai import (
    AIEnhanceResponse,
    AIGenerateFlashcardsRequest,
    AIGenerateFlashcardsResponse,
    AIGenerateQuestionsRequest,
    AIGenerateQuestionsResponse,
    AIImageToMarkdownResponse,
    AIRephraseResponse,
    AISimplifyResponse,
    AITextRequest,
    GeneratedFlashcard,
)
from app.services.ai_service import AIServiceError, ai_service

router = APIRouter(prefix="/api/ai", tags=["ai"])

ALLOWED_IMAGE_MIME_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/heic",
    "image/heif",
}


def _raise_ai_http_error(exc: AIServiceError) -> None:
    headers = {}
    if exc.retry_after is not None:
        headers["Retry-After"] = str(exc.retry_after)
    raise HTTPException(
        status_code=exc.status_code,
        detail=exc.message,
        headers=headers or None,
    )


@router.post("/rephrase", response_model=AIRephraseResponse)
async def rephrase_endpoint(
    payload: AITextRequest,
    current_user: User = Depends(get_current_user),
) -> AIRephraseResponse:
    try:
        rephrased = await ai_service.rephrase_text(
            user_id=str(current_user.id),
            text=payload.text,
        )
        return AIRephraseResponse(original=payload.text, rephrased=rephrased)
    except AIServiceError as exc:
        _raise_ai_http_error(exc)


@router.post("/enhance", response_model=AIEnhanceResponse)
async def enhance_endpoint(
    payload: AITextRequest,
    current_user: User = Depends(get_current_user),
) -> AIEnhanceResponse:
    try:
        enhanced = await ai_service.enhance_text(
            user_id=str(current_user.id),
            text=payload.text,
        )
        return AIEnhanceResponse(original=payload.text, enhanced=enhanced)
    except AIServiceError as exc:
        _raise_ai_http_error(exc)


@router.post("/simplify", response_model=AISimplifyResponse)
async def simplify_endpoint(
    payload: AITextRequest,
    current_user: User = Depends(get_current_user),
) -> AISimplifyResponse:
    try:
        simplified = await ai_service.simplify_text(
            user_id=str(current_user.id),
            text=payload.text,
        )
        return AISimplifyResponse(original=payload.text, simplified=simplified)
    except AIServiceError as exc:
        _raise_ai_http_error(exc)


@router.post("/generate-questions", response_model=AIGenerateQuestionsResponse)
async def generate_questions_endpoint(
    payload: AIGenerateQuestionsRequest,
    current_user: User = Depends(get_current_user),
) -> AIGenerateQuestionsResponse:
    try:
        questions = await ai_service.generate_questions(
            user_id=str(current_user.id),
            text=payload.text,
            count=payload.count,
        )
        return AIGenerateQuestionsResponse(questions=questions)
    except AIServiceError as exc:
        _raise_ai_http_error(exc)


@router.post("/generate-flashcards", response_model=AIGenerateFlashcardsResponse)
async def generate_flashcards_endpoint(
    payload: AIGenerateFlashcardsRequest,
    current_user: User = Depends(get_current_user),
) -> AIGenerateFlashcardsResponse:
    try:
        flashcards = await ai_service.generate_flashcards(
            user_id=str(current_user.id),
            text=payload.text,
            count=payload.count,
        )
        return AIGenerateFlashcardsResponse(
            flashcards=[GeneratedFlashcard.model_validate(item) for item in flashcards]
        )
    except AIServiceError as exc:
        _raise_ai_http_error(exc)


@router.post("/image-to-markdown", response_model=AIImageToMarkdownResponse)
async def image_to_markdown_endpoint(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
) -> AIImageToMarkdownResponse:
    if image.content_type not in ALLOWED_IMAGE_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported image format. Use JPEG, PNG, or HEIC.",
        )
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded image is empty.")

    try:
        markdown, confidence = await ai_service.image_to_markdown(
            user_id=str(current_user.id),
            image_bytes=image_bytes,
            mime_type=image.content_type or "image/jpeg",
        )
        return AIImageToMarkdownResponse(markdown=markdown, confidence=confidence)
    except AIServiceError as exc:
        _raise_ai_http_error(exc)
