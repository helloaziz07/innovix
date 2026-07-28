"""
Innovix — WhatsApp Bot

Webhook handler for WhatsApp messages via Twilio API.
Parses incoming messages, routes them through the Agent Orchestrator,
and responds via Twilio.

Integrated via FastAPI webhook endpoint.
"""

import logging
from typing import Optional

from twilio.twiml.messaging_response import MessagingResponse

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

logger = logging.getLogger(__name__)


class InnovixWhatsAppBot:
    """WhatsApp bot handler using Twilio webhook."""

    def __init__(self):
        self._orchestrator = None

    def _get_orchestrator(self):
        """Lazy-load orchestrator."""
        if self._orchestrator is None:
            from app.services.agents.agent_orchestrator import orchestrator
            self._orchestrator = orchestrator
        return self._orchestrator

    async def handle_incoming(
        self,
        from_number: str,
        body: str,
        profile_name: str = "",
    ) -> str:
        """
        Process an incoming WhatsApp message.
        Returns the response text to send back.
        """
        if not body or not body.strip():
            return "👋 Hi! I'm Innovix AI Assistant. Send me a message to get started!"

        orchestrator = self._get_orchestrator()

        # Store session
        try:
            from app.core.database import supabase_admin

            existing = (
                supabase_admin.table("agent_sessions")
                .select("id")
                .eq("platform", "whatsapp")
                .eq("chat_id", from_number)
                .execute()
            )

            if not existing.data:
                supabase_admin.table("agent_sessions").insert({
                    "platform": "whatsapp",
                    "chat_id": from_number,
                    "conversation_history": [],
                }).execute()
        except Exception as e:
            logger.warning(f"[WhatsAppBot] Session save failed: {e}")

        # Process message through orchestrator
        result = await orchestrator.process_message(
            user_id="whatsapp_user",
            message=body,
            platform="whatsapp",
            chat_id=from_number,
        )

        return result

    def create_twiml_response(self, message: str) -> str:
        """Create a TwiML response for Twilio webhook."""
        resp = MessagingResponse()
        resp.message(message)
        return str(resp)


# Singleton
whatsapp_bot = InnovixWhatsAppBot()
