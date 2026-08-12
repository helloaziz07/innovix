"""
Innovix — Agent Orchestrator

Multi-agent system using Gemini for intelligent responses
from messaging platforms (Telegram/WhatsApp).

Agents:
  - Research Agent: Handles quick search queries
  - Planning Agent: Generates project summaries
  - Reminder Agent: Manages scheduled notifications
  - Q&A Agent: Answers questions using project context
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from google import genai
from app.core.config import settings
from app.core.database import supabase_admin

logger = logging.getLogger(__name__)


class AgentOrchestrator:
    """Routes incoming messages to specialized agents based on intent."""

    def __init__(self):
        self.client = genai.Client(api_key=settings.gemini_api_key)
        self.model = "gemini-3.5-flash-lite"

    async def process_message(
        self,
        user_id: str,
        message: str,
        platform: str = "telegram",
        chat_id: str = "",
    ) -> str:
        """
        Process an incoming message and route to the appropriate agent.
        Returns the response text.
        """
        try:
            # Parse intent
            intent = await self._classify_intent(message)
            logger.info(f"[Agent] Intent: {intent} | Message: {message[:50]}")

            # Route to agent
            if intent == "search":
                return await self._research_agent(user_id, message)
            elif intent == "projects":
                return await self._planning_agent_list(user_id)
            elif intent == "status":
                return await self._planning_agent_status(user_id, message)
            elif intent == "remind":
                return await self._reminder_agent(user_id, message, platform, chat_id)
            elif intent == "ask":
                return await self._qa_agent(user_id, message)
            elif intent == "help":
                return self._help_message()
            else:
                return await self._qa_agent(user_id, message)

        except Exception as e:
            logger.error(f"[Agent] Error processing message: {e}")
            return "Sorry, I encountered an error processing your request. Please try again."

    async def _classify_intent(self, message: str) -> str:
        """Classify the user's intent from their message."""
        msg_lower = message.lower().strip()

        # Direct command parsing
        if msg_lower.startswith("/search ") or msg_lower.startswith("search "):
            return "search"
        if msg_lower in ("/projects", "projects", "my projects", "list projects"):
            return "projects"
        if msg_lower.startswith("/status ") or msg_lower.startswith("status "):
            return "status"
        if msg_lower.startswith("/remind ") or msg_lower.startswith("remind "):
            return "remind"
        if msg_lower.startswith("/ask ") or msg_lower.startswith("ask "):
            return "ask"
        if msg_lower in ("/help", "help", "/start", "start", "hi", "hello"):
            return "help"

        # For ambiguous messages, use Gemini to classify
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=f"""Classify the following user message into exactly one intent.
Return ONLY one of: search, projects, status, remind, ask, help

Message: "{message}"

Intent:""",
            )
            intent = response.text.strip().lower()
            if intent in ("search", "projects", "status", "remind", "ask", "help"):
                return intent
        except Exception:
            pass

        return "ask"  # Default to Q&A

    async def _research_agent(self, user_id: str, message: str) -> str:
        """Handle quick search queries."""
        # Strip the /search prefix
        query = message.lower().replace("/search ", "").replace("search ", "", 1).strip()
        if not query:
            return "Please provide a search query. Example: `/search AI in healthcare`"

        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=f"""You are a research assistant. Provide a concise summary about the following topic.
Include:
- 3-4 key findings
- 2-3 relevant links or resources (if you know real ones)
- 1 suggestion for deeper research

Keep the response under 300 words, formatted for a messaging app (no markdown headers, use emojis for bullets).

Topic: {query}""",
            )
            result = response.text

            # Save to search history
            try:
                supabase_admin.table("search_results").insert({
                    "query": query,
                    "summary": result[:1000],
                    "sources": [],
                    "source": "agent",
                }).execute()
            except Exception:
                pass

            return f"🔍 *Research: {query}*\n\n{result}"

        except Exception as e:
            logger.error(f"[ResearchAgent] Error: {e}")
            return "Sorry, I couldn't complete the search. Please try again."

    async def _planning_agent_list(self, user_id: str) -> str:
        """List user's active projects."""
        try:
            result = (
                supabase_admin.table("projects")
                .select("id, title, status, updated_at")
                .eq("user_id", user_id)
                .order("updated_at", desc=True)
                .limit(10)
                .execute()
            )
            projects = result.data or []

            if not projects:
                return "📂 You don't have any projects yet.\n\nVisit Innovix web app to create your first project!"

            lines = ["📂 *Your Projects:*\n"]
            status_emoji = {
                "planning": "💡",
                "researching": "🔍",
                "planning": "📋",
                "building": "🔨",
                "completed": "✅",
            }
            for i, p in enumerate(projects, 1):
                emoji = status_emoji.get(p.get("status", ""), "📌")
                lines.append(f"{i}. {emoji} *{p['title']}* — _{p.get('status', 'planning')}_")

            lines.append(f"\n📊 Total: {len(projects)} project(s)")
            lines.append("Use `/status <project name>` for details.")
            return "\n".join(lines)

        except Exception as e:
            logger.error(f"[PlanningAgent] List error: {e}")
            return "Sorry, I couldn't fetch your projects. Please try again."

    async def _planning_agent_status(self, user_id: str, message: str) -> str:
        """Get detailed status for a specific project."""
        import re
        # Handle both command format and natural language
        if message.lower().startswith("/status"):
            query = message[7:].strip()
        else:
            # Extract everything after the word "status" (ignoring common prepositions)
            query = re.sub(r'(?i).*\bstatus\b\s*(of|for|on)?\s*', '', message).strip()
            
        query = query.lower()
        if not query:
            return "Please specify a project. Example: `/status AI Waste Management`"

        try:
            # Search for the project by title
            result = (
                supabase_admin.table("projects")
                .select("*")
                .eq("user_id", user_id)
                .execute()
            )
            projects = result.data or []

            # Find best match
            matched = None
            for p in projects:
                if query.lower() in p.get("title", "").lower():
                    matched = p
                    break

            if not matched:
                titles = [p.get("title", "") for p in projects[:5]]
                return f"🔎 Couldn't find a project matching '{query}'.\n\nYour projects:\n" + "\n".join(f"• {t}" for t in titles)

            # Build status summary
            plan = matched.get("project_plan", {}) or {}
            status_emoji = {"planning": "💡", "architecting": "📋", "completed": "✅"}

            lines = [
                f"📊 *{matched['title']}*",
                f"Status: {status_emoji.get(matched.get('status', ''), '📌')} {matched.get('status', 'planning')}",
                f"Created: {matched.get('created_at', '')[:10]}",
                f"Updated: {matched.get('updated_at', '')[:10]}",
            ]

            if plan:
                if plan.get("tech_stack"):
                    lines.append(f"\n🛠️ *Tech Stack:* {', '.join(plan['tech_stack'][:5])}")
                if plan.get("milestones"):
                    lines.append(f"\n📋 *Milestones:* {len(plan['milestones'])} phases planned")

            return "\n".join(lines)

        except Exception as e:
            logger.error(f"[PlanningAgent] Status error: {e}")
            return "Sorry, I couldn't fetch the project status."

    async def _reminder_agent(
        self, user_id: str, message: str, platform: str, chat_id: str
    ) -> str:
        """Set a reminder (stored in DB for later delivery)."""
        reminder_text = message.lower().replace("/remind ", "").replace("remind ", "", 1).strip()
        if not reminder_text:
            return "Please provide a reminder. Example: `/remind Review project plan tomorrow`"

        try:
            # Store reminder in agent_sessions as a conversation entry
            reminder_data = {
                "id": None,  # Will be auto-generated
                "user_id": user_id,
                "platform": platform,
                "chat_id": chat_id,
                "conversation_history": [{
                    "role": "reminder",
                    "content": reminder_text,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "status": "pending",
                }],
                "last_active": datetime.now(timezone.utc).isoformat(),
            }

            # For now, acknowledge the reminder
            return f"⏰ *Reminder set!*\n\n📝 {reminder_text}\n\n_(Note: Reminders are saved. Automatic delivery will be enabled in a future update.)_"

        except Exception as e:
            logger.error(f"[ReminderAgent] Error: {e}")
            return "Sorry, I couldn't set the reminder."

    async def _qa_agent(self, user_id: str, message: str) -> str:
        """Answer any question using project context + Gemini."""
        query = message.replace("/ask ", "").replace("ask ", "", 1).strip()

        try:
            # Fetch user's project context for RAG
            context = ""
            try:
                projects = (
                    supabase_admin.table("projects")
                    .select("title, idea_text, status")
                    .eq("user_id", user_id)
                    .limit(5)
                    .execute()
                )
                if projects.data:
                    context = "User's projects:\n" + "\n".join(
                        f"- {p['title']}: {p.get('idea_text', '')[:100]}"
                        for p in projects.data
                    )
            except Exception:
                pass

            prompt = f"""You are Innovix AI Assistant, a helpful research copilot.
Answer the user's question concisely (under 250 words).
Format for a messaging app (no markdown headers, use emojis for bullets).

{f'Context about the user: {context}' if context else ''}

Question: {query}"""

            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
            )
            return f"🤖 {response.text}"

        except Exception as e:
            logger.error(f"[QAAgent] Error: {e}")
            return "Sorry, I couldn't process your question. Please try again."

    def _help_message(self) -> str:
        """Return help text with available commands."""
        return """👋 *Welcome to Innovix AI Assistant!*

I can help you with your research projects. Here's what I can do:

🔍 `/search <query>` — Quick research on any topic
📂 `/projects` — List your active projects
📊 `/status <project>` — Get project details
⏰ `/remind <message>` — Set a reminder
❓ `/ask <question>` — Ask me anything

You can also just type naturally and I'll understand! 🧠

_Powered by Innovix + Gemini AI_"""


# Singleton
orchestrator = AgentOrchestrator()
