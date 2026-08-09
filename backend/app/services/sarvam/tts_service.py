"""
Innovix — Sarvam AI TTS Service

Thin wrapper around the Sarvam AI Text-to-Speech API for multilingual
speech synthesis. Supports Indian languages (Hindi, Tamil, Telugu,
Bengali, Marathi, Kannada, etc.) plus English.

Used by:
  - Project HUB "Listen to Plan" feature (Phase 3)
  - WhatsApp/Telegram voice responses (Phase 6)
  - Multilingual voice interface (Phase 7)

Gracefully disabled when SARVAM_API_KEY is not configured.

API Docs: https://docs.sarvam.ai/
"""

import logging
from typing import Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech"

# Supported languages and default voices
SARVAM_LANGUAGES = {
    "en": {"code": "en-IN", "voice": "ritu"},
    "hi": {"code": "hi-IN", "voice": "ritu"},
    "ta": {"code": "ta-IN", "voice": "ritu"},
    "te": {"code": "te-IN", "voice": "ritu"},
    "bn": {"code": "bn-IN", "voice": "ritu"},
    "mr": {"code": "mr-IN", "voice": "ritu"},
    "kn": {"code": "kn-IN", "voice": "ritu"},
    "gu": {"code": "gu-IN", "voice": "ritu"},
    "ml": {"code": "ml-IN", "voice": "ritu"},
    "pa": {"code": "pa-IN", "voice": "ritu"},
}


def is_available() -> bool:
    """Check if Sarvam AI TTS is configured and available."""
    return bool(settings.sarvam_api_key)


async def synthesize_speech(
    text: str,
    language: str = "en",
    voice: Optional[str] = None,
) -> Optional[bytes]:
    """
    Convert text to speech using Sarvam AI TTS API.

    Args:
        text: The text to synthesize (max ~2000 chars recommended).
        language: Language code (e.g., "en", "hi", "ta").
        voice: Optional voice name override.

    Returns:
        Audio bytes (WAV format) or None if synthesis fails or is unavailable.
    """
    if not is_available():
        logger.info("[Sarvam] TTS not available — SARVAM_API_KEY not configured")
        return None

    # Resolve language config
    lang_config = SARVAM_LANGUAGES.get(language, SARVAM_LANGUAGES["en"])
    target_language_code = lang_config["code"]
    target_voice = voice or lang_config["voice"]

    # Truncate very long text (TTS APIs have limits)
    if len(text) > 2000:
        text = text[:1997] + "..."
        logger.info("[Sarvam] Text truncated to 2000 characters for TTS")

    try:
        logger.info(f"[Sarvam] Synthesizing speech: lang={target_language_code}, voice={target_voice}, len={len(text)}")

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                SARVAM_TTS_URL,
                headers={
                    "API-Subscription-Key": settings.sarvam_api_key,
                    "Content-Type": "application/json",
                },
                json={
                    "inputs": [text],
                    "target_language_code": target_language_code,
                    "speaker": target_voice,
                    "model": "bulbul:v3",
                    "enable_preprocessing": True,
                },
            )
            response.raise_for_status()

            data = response.json()
            # Sarvam returns base64-encoded audio in "audios" array
            audios = data.get("audios", [])
            if audios:
                import base64
                audio_bytes = base64.b64decode(audios[0])
                logger.info(f"[Sarvam] Speech synthesized: {len(audio_bytes)} bytes")
                return audio_bytes

            logger.warning("[Sarvam] No audio in response")
            return None

    except httpx.HTTPStatusError as e:
        logger.error(f"[Sarvam] HTTP error {e.response.status_code}: {e.response.text[:200]}")
        return None
    except Exception as e:
        logger.error(f"[Sarvam] TTS synthesis failed: {e}")
        return None


def get_supported_languages() -> dict:
    """Return the dict of supported language codes and their config."""
    return SARVAM_LANGUAGES.copy()
