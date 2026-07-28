"""
Innovix — Telegram Bot

Conversational AI bot for Telegram using python-telegram-bot.
Supports commands: /start, /search, /projects, /status, /remind, /ask.

Run standalone:
    python -m bots.telegram_bot

Or integrated via FastAPI webhook in production.
"""

import logging
import asyncio
from typing import Optional

from telegram import Update, BotCommand
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    ContextTypes,
    filters,
)

# Add parent path for imports when running standalone
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

logger = logging.getLogger(__name__)


class InnovixTelegramBot:
    """Telegram bot that connects to the Innovix Agent Orchestrator."""

    def __init__(self, token: str):
        self.token = token
        self.app: Optional[Application] = None
        self._orchestrator = None

    def _get_orchestrator(self):
        """Lazy-load orchestrator to avoid import issues."""
        if self._orchestrator is None:
            from app.services.agents.agent_orchestrator import orchestrator
            self._orchestrator = orchestrator
        return self._orchestrator

    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /start command — link account and show welcome."""
        user = update.effective_user
        chat_id = str(update.effective_chat.id)

        # Store the chat_id for notifications
        try:
            from app.core.database import supabase_admin

            existing = (
                supabase_admin.table("agent_sessions")
                .select("id")
                .eq("platform", "telegram")
                .eq("chat_id", chat_id)
                .execute()
            )

            if not existing.data:
                supabase_admin.table("agent_sessions").insert({
                    "platform": "telegram",
                    "chat_id": chat_id,
                    "conversation_history": [],
                }).execute()
        except Exception as e:
            logger.warning(f"[TelegramBot] Session save failed: {e}")

        welcome = (
            f"👋 Welcome to *Innovix*, {user.first_name}!\n\n"
            "I'm your AI research copilot. Here's what I can do:\n\n"
            "🔍 `/search <query>` — Quick research\n"
            "📂 `/projects` — Your projects\n"
            "📊 `/status <project>` — Project details\n"
            "⏰ `/remind <message>` — Set reminder\n"
            "❓ `/ask <question>` — Ask anything\n\n"
            "You can also just type naturally! 🧠"
        )
        await update.message.reply_text(welcome, parse_mode="Markdown")

    async def search_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /search command."""
        query = " ".join(context.args) if context.args else ""
        if not query:
            await update.message.reply_text(
                "Please provide a query.\nExample: `/search AI in healthcare`",
                parse_mode="Markdown",
            )
            return

        await update.message.reply_text("🔍 Searching...", parse_mode="Markdown")

        orchestrator = self._get_orchestrator()
        result = await orchestrator.process_message(
            user_id="telegram_user",
            message=f"/search {query}",
            platform="telegram",
            chat_id=str(update.effective_chat.id),
        )
        await update.message.reply_text(result, parse_mode="Markdown")

    async def projects_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /projects command."""
        orchestrator = self._get_orchestrator()
        result = await orchestrator.process_message(
            user_id="telegram_user",
            message="/projects",
            platform="telegram",
            chat_id=str(update.effective_chat.id),
        )
        await update.message.reply_text(result, parse_mode="Markdown")

    async def status_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /status command."""
        query = " ".join(context.args) if context.args else ""
        orchestrator = self._get_orchestrator()
        result = await orchestrator.process_message(
            user_id="telegram_user",
            message=f"/status {query}",
            platform="telegram",
            chat_id=str(update.effective_chat.id),
        )
        await update.message.reply_text(result, parse_mode="Markdown")

    async def remind_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /remind command."""
        text = " ".join(context.args) if context.args else ""
        orchestrator = self._get_orchestrator()
        result = await orchestrator.process_message(
            user_id="telegram_user",
            message=f"/remind {text}",
            platform="telegram",
            chat_id=str(update.effective_chat.id),
        )
        await update.message.reply_text(result, parse_mode="Markdown")

    async def ask_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /ask command."""
        question = " ".join(context.args) if context.args else ""
        orchestrator = self._get_orchestrator()
        result = await orchestrator.process_message(
            user_id="telegram_user",
            message=f"/ask {question}",
            platform="telegram",
            chat_id=str(update.effective_chat.id),
        )
        await update.message.reply_text(result, parse_mode="Markdown")

    async def handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle free-form text messages."""
        text = update.message.text
        if not text:
            return

        orchestrator = self._get_orchestrator()
        result = await orchestrator.process_message(
            user_id="telegram_user",
            message=text,
            platform="telegram",
            chat_id=str(update.effective_chat.id),
        )
        await update.message.reply_text(result, parse_mode="Markdown")

    def build(self) -> Application:
        """Build the Telegram bot application with all handlers."""
        self.app = Application.builder().token(self.token).build()

        self.app.add_handler(CommandHandler("start", self.start_command))
        self.app.add_handler(CommandHandler("help", self.start_command))
        self.app.add_handler(CommandHandler("search", self.search_command))
        self.app.add_handler(CommandHandler("projects", self.projects_command))
        self.app.add_handler(CommandHandler("status", self.status_command))
        self.app.add_handler(CommandHandler("remind", self.remind_command))
        self.app.add_handler(CommandHandler("ask", self.ask_command))

        self.app.add_handler(
            MessageHandler(filters.TEXT & ~filters.COMMAND, self.handle_message)
        )

        return self.app

    async def setup_commands(self):
        """Register bot commands with Telegram for the menu."""
        if not self.app:
            return
        commands = [
            BotCommand("start", "Welcome & help"),
            BotCommand("search", "Quick research on a topic"),
            BotCommand("projects", "List your projects"),
            BotCommand("status", "Get project status"),
            BotCommand("remind", "Set a reminder"),
            BotCommand("ask", "Ask anything"),
        ]
        await self.app.bot.set_my_commands(commands)

    def run_polling(self):
        """Start the bot in polling mode (for development)."""
        app = self.build()
        logger.info("[TelegramBot] Starting polling...")
        app.run_polling(allowed_updates=Update.ALL_TYPES)


def main():
    """Entry point for standalone bot execution."""
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", "backend", ".env"))

    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token or token == "your-telegram-bot-token":
        print("❌ TELEGRAM_BOT_TOKEN not set in backend/.env")
        print("   Get one from @BotFather on Telegram")
        sys.exit(1)

    logging.basicConfig(level=logging.INFO)
    bot = InnovixTelegramBot(token)
    bot.run_polling()


if __name__ == "__main__":
    main()
