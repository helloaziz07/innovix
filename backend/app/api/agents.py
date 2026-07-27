"""
Innovix API — AI Agent Routes

Webhooks for Telegram and WhatsApp bots.
Full implementation in Phase 6.
"""

from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.models.schemas import MessageResponse

router = APIRouter(prefix="/agents", tags=["AI Agents"])


@router.post("/telegram/webhook")
async def telegram_webhook():
    """Telegram bot webhook. [Phase 6]"""
    return {"message": "Telegram webhook ready — Phase 6"}


@router.post("/whatsapp/webhook")
async def whatsapp_webhook():
    """WhatsApp bot webhook. [Phase 6]"""
    return {"message": "WhatsApp webhook ready — Phase 6"}


@router.get("/sessions/{user_id}")
async def get_agent_sessions(
    user_id: str,
    user: dict = Depends(get_current_user),
):
    """Get conversation history for a user. [Phase 6]"""
    return {"user_id": user_id, "sessions": [], "message": "Phase 6"}


@router.post("/link", response_model=MessageResponse)
async def link_messaging_account(user: dict = Depends(get_current_user)):
    """Link messaging account to profile. [Phase 6]"""
    return MessageResponse(message="Agent linking ready — Phase 6")
