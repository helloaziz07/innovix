"""
Innovix — Sarvam AI Translation Service

Translates text between supported languages using Sarvam AI Translate API.
Supports Indian languages + English. Falls back gracefully when API key is missing.

API Docs: https://docs.sarvam.ai/
"""

import logging
from typing import Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

SARVAM_TRANSLATE_URL = "https://api.sarvam.ai/translate"

# Sarvam-supported languages (ISO 639-1 → Sarvam language code)
SUPPORTED_LANGUAGES = {
    "en": {"code": "en-IN", "name": "English"},
    "hi": {"code": "hi-IN", "name": "Hindi"},
    "ta": {"code": "ta-IN", "name": "Tamil"},
    "te": {"code": "te-IN", "name": "Telugu"},
    "bn": {"code": "bn-IN", "name": "Bengali"},
    "mr": {"code": "mr-IN", "name": "Marathi"},
    "kn": {"code": "kn-IN", "name": "Kannada"},
    "gu": {"code": "gu-IN", "name": "Gujarati"},
    "ml": {"code": "ml-IN", "name": "Malayalam"},
    "pa": {"code": "pa-IN", "name": "Punjabi"},
}


def is_available() -> bool:
    """Check if Sarvam AI Translation is configured."""
    return bool(settings.sarvam_api_key)


async def translate_text(
    text: str,
    target_lang: str,
    source_lang: str = "en",
) -> str:
    """
    Translate text using Sarvam AI Translate API.

    Args:
        text: The text to translate (max ~1000 chars per call recommended).
        target_lang: Target language ISO code (e.g., "hi", "ta").
        source_lang: Source language ISO code (default: "en").

    Returns:
        Translated text, or original text if translation fails/unavailable.
    """
    if not is_available():
        logger.info("[Sarvam] Translation not available — SARVAM_API_KEY not configured")
        return text

    if target_lang == source_lang:
        return text

    src = SUPPORTED_LANGUAGES.get(source_lang)
    tgt = SUPPORTED_LANGUAGES.get(target_lang)
    if not src or not tgt:
        logger.warning(f"[Sarvam] Unsupported language pair: {source_lang} → {target_lang}")
        return text

    try:
        logger.info(f"[Sarvam] Translating: {src['code']} → {tgt['code']}, len={len(text)}")

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                SARVAM_TRANSLATE_URL,
                headers={
                    "API-Subscription-Key": settings.sarvam_api_key,
                    "Content-Type": "application/json",
                },
                json={
                    "input": text[:1000],
                    "source_language_code": src["code"],
                    "target_language_code": tgt["code"],
                    "mode": "formal",
                    "model": "mayura:v1",
                    "enable_preprocessing": True,
                },
            )
            response.raise_for_status()

            data = response.json()
            translated = data.get("translated_text", text)
            logger.info(f"[Sarvam] Translation complete: {len(translated)} chars")
            return translated

    except httpx.HTTPStatusError as e:
        logger.error(f"[Sarvam] HTTP error {e.response.status_code}: {e.response.text[:200]}")
        return text
    except Exception as e:
        logger.error(f"[Sarvam] Translation failed: {e}")
        return text


async def translate_batch(
    texts: list[str],
    target_lang: str,
    source_lang: str = "en",
) -> list[str]:
    """Translate multiple texts by calling Sarvam API for each."""
    if not is_available() or target_lang == source_lang:
        return texts

    results = []
    for text in texts:
        translated = await translate_text(text, target_lang, source_lang)
        results.append(translated)
    return results


async def detect_language(text: str) -> str:
    """
    Detect language using Sarvam AI.
    Falls back to 'en' if detection is unavailable.
    
    Note: Sarvam doesn't have a dedicated detection endpoint,
    so we use a simple heuristic based on Unicode script ranges.
    """
    if not text.strip():
        return "en"

    # Heuristic: check dominant script in text
    script_ranges = {
        "hi": ("\u0900", "\u097F"),   # Devanagari
        "ta": ("\u0B80", "\u0BFF"),   # Tamil
        "te": ("\u0C00", "\u0C7F"),   # Telugu
        "bn": ("\u0980", "\u09FF"),   # Bengali
        "kn": ("\u0C80", "\u0CFF"),   # Kannada
        "gu": ("\u0A80", "\u0AFF"),   # Gujarati
        "ml": ("\u0D00", "\u0D7F"),   # Malayalam
        "pa": ("\u0A00", "\u0A7F"),   # Gurmukhi (Punjabi)
        "mr": ("\u0900", "\u097F"),   # Marathi uses Devanagari too
    }

    for lang, (start, end) in script_ranges.items():
        count = sum(1 for c in text if start <= c <= end)
        if count > len(text) * 0.3:
            return lang

    return "en"


def get_supported_languages() -> dict[str, str]:
    """Return map of supported language codes to display names."""
    return {code: info["name"] for code, info in SUPPORTED_LANGUAGES.items()}
