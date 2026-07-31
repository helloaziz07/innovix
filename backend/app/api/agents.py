"""
Innovix API — AI Agent Routes

Full implementation of webhook endpoints for Telegram and WhatsApp bots,
agent session management, and the in-app chat interface.
"""

import logging
from datetime import datetime, timezone
from uuid import uuid4
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Form
from fastapi.responses import PlainTextResponse

from app.core.security import get_current_user
from app.core.database import supabase_admin
from app.core.config import settings
from app.models.schemas import MessageResponse
from app.services.agents.agent_orchestrator import orchestrator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agents", tags=["AI Agents"])


# ============================================
# Telegram Webhook
# ============================================

@router.post("/telegram/webhook")
async def telegram_webhook(request: Request):
    """
    Handle incoming Telegram webhook updates.
    Telegram sends a JSON payload with the update data.
    """
    try:
        import json
        body = await request.json()

        # Extract message data
        message = body.get("message", {})
        text = message.get("text", "")
        chat = message.get("chat", {})
        chat_id = str(chat.get("id", ""))
        user_info = message.get("from", {})

        if not text or not chat_id:
            return {"ok": True}

        # Resolve the real user_id from agent_sessions
        resolved_user_id = f"telegram_{chat_id}"
        try:
            session = (
                supabase_admin.table("agent_sessions")
                .select("user_id")
                .eq("platform", "telegram")
                .eq("chat_id", chat_id)
                .limit(1)
                .execute()
            )
            if session.data and session.data[0].get("user_id"):
                resolved_user_id = session.data[0]["user_id"]
        except Exception:
            pass

        # Process through orchestrator
        result = await orchestrator.process_message(
            user_id=resolved_user_id,
            message=text,
            platform="telegram",
            chat_id=chat_id,
        )

        # Send response back via Telegram API
        if settings.telegram_bot_token:
            import httpx
            url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage"
            # Escape special chars to prevent Telegram Markdown parse errors
            safe_result = _escape_telegram_markdown(result)
            async with httpx.AsyncClient() as client:
                await client.post(url, json={
                    "chat_id": chat_id,
                    "text": safe_result,
                    "parse_mode": "Markdown",
                })

        # Save to conversation history
        try:
            _save_conversation(
                platform="telegram",
                chat_id=chat_id,
                user_message=text,
                bot_response=result,
            )
        except Exception:
            pass

        return {"ok": True}

    except Exception as e:
        logger.error(f"[Agents] Telegram webhook error: {e}")
        return {"ok": True}  # Always return 200 to Telegram


# ============================================
# WhatsApp Webhook (Twilio)
# ============================================

@router.post("/whatsapp/webhook")
async def whatsapp_webhook(
    Body: str = Form(""),
    From: str = Form(""),
    ProfileName: str = Form(""),
):
    """
    Handle incoming WhatsApp messages via Twilio webhook.
    Twilio sends form-encoded data.
    """
    try:
        from bots.whatsapp_bot import whatsapp_bot

        result = await whatsapp_bot.handle_incoming(
            from_number=From,
            body=Body,
            profile_name=ProfileName,
        )

        # Save to conversation history
        try:
            _save_conversation(
                platform="whatsapp",
                chat_id=From,
                user_message=Body,
                bot_response=result,
            )
        except Exception:
            pass

        # Return TwiML response
        twiml = whatsapp_bot.create_twiml_response(result)
        return PlainTextResponse(content=twiml, media_type="application/xml")

    except Exception as e:
        logger.error(f"[Agents] WhatsApp webhook error: {e}")
        return PlainTextResponse(
            content="<Response><Message>Sorry, something went wrong.</Message></Response>",
            media_type="application/xml",
        )


# ============================================
# In-App Chat (Web Interface)
# ============================================

@router.post("/chat")
async def agent_chat(
    body: dict,
    user: dict = Depends(get_current_user),
):
    """
    In-app chat endpoint. Users can interact with the AI agent
    directly from the Innovix web interface.
    """
    message = body.get("message", "").strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message is required")

    try:
        result = await orchestrator.process_message(
            user_id=user["id"],
            message=message,
            platform="web",
            chat_id=f"web_{user['id']}",
        )

        # Save to conversation history
        try:
            _save_conversation(
                platform="web",
                chat_id=f"web_{user['id']}",
                user_message=message,
                bot_response=result,
                user_id=user["id"],
            )
        except Exception:
            pass

        return {
            "response": result,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    except Exception as e:
        logger.error(f"[Agents] Chat error: {e}")
        raise HTTPException(status_code=500, detail="Agent processing failed")


# ============================================
# Session Management
# ============================================

@router.get("/sessions")
async def get_my_sessions(user: dict = Depends(get_current_user)):
    """Get conversation history for the current user."""
    try:
        # Fetch web sessions
        result = (
            supabase_admin.table("agent_sessions")
            .select("*")
            .eq("user_id", user["id"])
            .order("last_active", desc=True)
            .limit(20)
            .execute()
        )
        return {"sessions": result.data or []}

    except Exception as e:
        logger.error(f"[Agents] Sessions fetch error: {e}")
        return {"sessions": []}


@router.get("/sessions/{user_id}")
async def get_agent_sessions(
    user_id: str,
    user: dict = Depends(get_current_user),
):
    """Get conversation history for a specific user. Admin-level."""
    try:
        result = (
            supabase_admin.table("agent_sessions")
            .select("*")
            .eq("user_id", user_id)
            .order("last_active", desc=True)
            .execute()
        )
        return {"user_id": user_id, "sessions": result.data or []}

    except Exception as e:
        logger.error(f"[Agents] Sessions error: {e}")
        return {"user_id": user_id, "sessions": []}


@router.get("/chat/history")
async def get_chat_history(user: dict = Depends(get_current_user)):
    """Get in-app chat history for the current user."""
    try:
        result = (
            supabase_admin.table("agent_sessions")
            .select("conversation_history, last_active")
            .eq("platform", "web")
            .eq("chat_id", f"web_{user['id']}")
            .single()
            .execute()
        )

        if result.data:
            history = result.data.get("conversation_history", [])
            # Return last 50 messages
            return {"messages": history[-50:]}

        return {"messages": []}

    except Exception:
        return {"messages": []}


@router.post("/link", response_model=MessageResponse)
async def link_messaging_account(
    body: dict,
    user: dict = Depends(get_current_user),
):
    """Link a messaging account (Telegram/WhatsApp) to the user's profile."""
    platform = body.get("platform", "")
    chat_id = body.get("chat_id", "")

    if platform not in ("telegram", "whatsapp"):
        raise HTTPException(status_code=400, detail="Platform must be 'telegram' or 'whatsapp'")
    if not chat_id:
        raise HTTPException(status_code=400, detail="chat_id is required")

    try:
        # Check if already linked
        existing = (
            supabase_admin.table("agent_sessions")
            .select("id")
            .eq("platform", platform)
            .eq("chat_id", chat_id)
            .execute()
        )

        if existing.data:
            # Update existing
            supabase_admin.table("agent_sessions").update({
                "user_id": user["id"],
                "last_active": datetime.now(timezone.utc).isoformat(),
            }).eq("platform", platform).eq("chat_id", chat_id).execute()
        else:
            # Create new
            supabase_admin.table("agent_sessions").insert({
                "user_id": user["id"],
                "platform": platform,
                "chat_id": chat_id,
                "conversation_history": [],
                "last_active": datetime.now(timezone.utc).isoformat(),
            }).execute()

        return MessageResponse(message=f"{platform.capitalize()} account linked successfully")

    except Exception as e:
        logger.error(f"[Agents] Link error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# Helpers
# ============================================

def _save_conversation(
    platform: str,
    chat_id: str,
    user_message: str,
    bot_response: str,
    user_id: Optional[str] = None,
):
    """Save a conversation exchange to the agent_sessions table."""
    try:
        # Find or create session
        existing = (
            supabase_admin.table("agent_sessions")
            .select("id, conversation_history")
            .eq("platform", platform)
            .eq("chat_id", chat_id)
            .execute()
        )

        now = datetime.now(timezone.utc).isoformat()
        new_entries = [
            {"role": "user", "content": user_message, "timestamp": now},
            {"role": "assistant", "content": bot_response, "timestamp": now},
        ]

        if existing.data:
            session = existing.data[0]
            history = session.get("conversation_history", []) or []
            history.extend(new_entries)
            # Keep last 100 messages
            history = history[-100:]

            update_data = {
                "conversation_history": history,
                "last_active": now,
            }
            if user_id:
                update_data["user_id"] = user_id

            supabase_admin.table("agent_sessions").update(
                update_data
            ).eq("id", session["id"]).execute()
        else:
            insert_data = {
                "platform": platform,
                "chat_id": chat_id,
                "conversation_history": new_entries,
                "last_active": now,
            }
            if user_id:
                insert_data["user_id"] = user_id

            supabase_admin.table("agent_sessions").insert(insert_data).execute()

    except Exception as e:
        logger.warning(f"[Agents] Save conversation failed: {e}")


def _escape_telegram_markdown(text: str) -> str:
    """
    Escape special characters that break Telegram's Markdown parser.
    Preserves intentional formatting like *bold* and _italic_ but
    escapes stray underscores, brackets, etc. from AI responses.
    """
    import re
    # Count underscores — if odd number, escape the last one
    if text.count('_') % 2 != 0:
        # Find the last _ and escape it
        idx = text.rfind('_')
        text = text[:idx] + '\\_' + text[idx + 1:]
    # Same for asterisks
    if text.count('*') % 2 != 0:
        idx = text.rfind('*')
        text = text[:idx] + '\\*' + text[idx + 1:]
    # Escape unmatched square brackets
    if text.count('[') != text.count(']'):
        text = text.replace('[', '\\[').replace(']', '\\]')
    return text
