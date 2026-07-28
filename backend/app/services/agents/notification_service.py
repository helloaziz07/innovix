"""
Innovix — Notification Service

Sends proactive notifications to users via Telegram and WhatsApp.
Used by the Reminder Agent and for push-style updates.
"""

import logging
from typing import Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class NotificationService:
    """Send notifications to users on Telegram and WhatsApp."""

    def __init__(self):
        self.telegram_token = settings.telegram_bot_token
        self.twilio_sid = settings.twilio_account_sid
        self.twilio_token = settings.twilio_auth_token
        self.twilio_from = settings.twilio_whatsapp_number

    async def send_telegram(self, chat_id: str, message: str) -> bool:
        """Send a message via Telegram Bot API."""
        if not self.telegram_token:
            logger.warning("[Notification] Telegram token not configured")
            return False

        try:
            url = f"https://api.telegram.org/bot{self.telegram_token}/sendMessage"
            async with httpx.AsyncClient() as client:
                resp = await client.post(url, json={
                    "chat_id": chat_id,
                    "text": message,
                    "parse_mode": "Markdown",
                })
                if resp.status_code == 200:
                    logger.info(f"[Notification] Telegram message sent to {chat_id}")
                    return True
                else:
                    logger.error(f"[Notification] Telegram error: {resp.text}")
                    return False
        except Exception as e:
            logger.error(f"[Notification] Telegram send failed: {e}")
            return False

    async def send_whatsapp(self, to_number: str, message: str) -> bool:
        """Send a WhatsApp message via Twilio API."""
        if not self.twilio_sid or not self.twilio_token:
            logger.warning("[Notification] Twilio credentials not configured")
            return False

        try:
            url = f"https://api.twilio.com/2010-04-01/Accounts/{self.twilio_sid}/Messages.json"
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    url,
                    auth=(self.twilio_sid, self.twilio_token),
                    data={
                        "From": self.twilio_from,
                        "To": f"whatsapp:{to_number}" if not to_number.startswith("whatsapp:") else to_number,
                        "Body": message,
                    },
                )
                if resp.status_code in (200, 201):
                    logger.info(f"[Notification] WhatsApp message sent to {to_number}")
                    return True
                else:
                    logger.error(f"[Notification] Twilio error: {resp.text}")
                    return False
        except Exception as e:
            logger.error(f"[Notification] WhatsApp send failed: {e}")
            return False

    async def notify_user(
        self,
        user_id: str,
        message: str,
        platform: Optional[str] = None,
    ) -> dict:
        """
        Send a notification to a user. If platform is specified, use that.
        Otherwise, try all linked platforms.
        """
        results = {"telegram": False, "whatsapp": False}

        # Look up user's linked chat IDs from agent_sessions
        try:
            from app.core.database import supabase_admin

            sessions = (
                supabase_admin.table("agent_sessions")
                .select("platform, chat_id")
                .eq("user_id", user_id)
                .execute()
            )

            for session in (sessions.data or []):
                p = session.get("platform")
                cid = session.get("chat_id")
                if not cid:
                    continue

                if platform and p != platform:
                    continue

                if p == "telegram":
                    results["telegram"] = await self.send_telegram(cid, message)
                elif p == "whatsapp":
                    results["whatsapp"] = await self.send_whatsapp(cid, message)

        except Exception as e:
            logger.error(f"[Notification] User lookup failed: {e}")

        return results


# Singleton
notification_service = NotificationService()
