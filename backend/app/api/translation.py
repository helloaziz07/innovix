"""
Innovix — Translation API

Endpoints for language detection, text translation, and supported languages.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.translation import (
    detect_language,
    translate_text,
    translate_batch,
    get_supported_languages,
)

router = APIRouter(prefix="/translation", tags=["Translation"])


class DetectRequest(BaseModel):
    text: str


class DetectResponse(BaseModel):
    language: str
    language_name: str


class TranslateRequest(BaseModel):
    text: str
    target_lang: str
    source_lang: str | None = None


class TranslateResponse(BaseModel):
    translated: str
    source_lang: str
    target_lang: str


class BatchTranslateRequest(BaseModel):
    texts: list[str]
    target_lang: str
    source_lang: str | None = None


class BatchTranslateResponse(BaseModel):
    translated: list[str]
    target_lang: str


@router.get("/languages")
async def list_languages():
    """Return all supported languages."""
    return get_supported_languages()


@router.post("/detect", response_model=DetectResponse)
async def detect(req: DetectRequest):
    """Detect language of input text."""
    code = await detect_language(req.text)
    languages = get_supported_languages()
    return DetectResponse(
        language=code,
        language_name=languages.get(code, "Unknown"),
    )


@router.post("/translate", response_model=TranslateResponse)
async def translate(req: TranslateRequest):
    """Translate text to the target language."""
    languages = get_supported_languages()
    if req.target_lang not in languages:
        raise HTTPException(400, f"Unsupported language: {req.target_lang}")

    source = req.source_lang or await detect_language(req.text)
    result = await translate_text(req.text, req.target_lang, source)
    return TranslateResponse(
        translated=result,
        source_lang=source,
        target_lang=req.target_lang,
    )


@router.post("/batch", response_model=BatchTranslateResponse)
async def batch_translate(req: BatchTranslateRequest):
    """Translate multiple texts in one call."""
    languages = get_supported_languages()
    if req.target_lang not in languages:
        raise HTTPException(400, f"Unsupported language: {req.target_lang}")

    results = await translate_batch(req.texts, req.target_lang, req.source_lang)
    return BatchTranslateResponse(
        translated=results,
        target_lang=req.target_lang,
    )
