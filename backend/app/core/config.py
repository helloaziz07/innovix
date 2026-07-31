"""
Innovix Backend — Application Configuration

Loads environment variables using Pydantic Settings.
All config is validated at startup — missing required keys will crash fast.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- App ---
    app_name: str = "Innovix"
    app_env: str = "development"
    frontend_url: str = "http://localhost:5173"
    backend_url: str = "http://localhost:8000"
    secret_key: str = "change-this-to-a-random-secret-key"

    # --- Supabase ---
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str

    # --- Google Gemini ---
    gemini_api_key: str

    # --- GitHub ---
    github_token: Optional[str] = None

    # --- Search APIs ---
    serpapi_key: Optional[str] = None
    tavily_api_key: Optional[str] = None

    # --- Semantic Scholar ---
    semantic_scholar_api_key: Optional[str] = None

    # --- Telegram ---
    telegram_bot_token: Optional[str] = None

    # --- Twilio (WhatsApp) ---
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_whatsapp_number: Optional[str] = None

    # --- Sarvam AI (Multilingual TTS/STT) ---
    sarvam_api_key: Optional[str] = None

    # --- Meta WhatsApp ---
    meta_access_token: Optional[str] = None
    meta_phone_number_id: Optional[str] = None

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


# Singleton instance — import this everywhere
settings = Settings()
