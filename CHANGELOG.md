# Changelog

All notable changes to the Innovix project will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [0.2.0] — 2026-07-29

### 🔒 Security & Production Hardening

#### Critical Fixes
- **Fixed:** Supabase client memory leak — was creating a new client per auth request, now uses a shared singleton (`security.py`)
- **Fixed:** WebSocket DeepSearch had zero authentication — now validates JWT via `?token=` query param (`deepsearch.py` + `api.ts`)
- **Fixed:** SECRET_KEY default value accepted silently — app now crashes on startup in production if key is unchanged (`main.py`)
- **Fixed:** Telegram/WhatsApp bots shared a single hardcoded `user_id` — now resolves real user from `agent_sessions` table (`telegram_bot.py`, `whatsapp_bot.py`)
- **Added:** Database migration file with all 6 tables, RLS policies, indexes, and triggers (`migrations/001_create_tables.sql`)

#### High Fixes
- **Fixed:** CORS was fully open (`*`) — now environment-aware, strict in production (`main.py`)
- **Fixed:** Error messages leaked internal Python exceptions to clients — now returns generic messages (`security.py`, `deepsearch.py`)
- **Updated:** `.env.example` with both search APIs, Sarvam as required, and SECRET_KEY generation command

#### Medium Fixes
- **Fixed:** Gemini API calls had no timeout — now wrapped with `asyncio.wait_for()` (30s/45s/60s) (`deep_search.py`)
- **Fixed:** Gemini JSON parsing used fragile markdown stripping — now uses `response_mime_type="application/json"` (`deep_search.py`)
- **Fixed:** Frontend WebSocket didn't pass auth token — now async with token query param (`api.ts`)
- **Fixed:** Signup auto-signed users in, bypassing email verification — now returns `needsVerification` flag (`authStore.ts`)

### 🤖 Phase 6 — AI Agents (Complete)
- **Added:** Full Telegram bot with 6 commands: `/start`, `/search`, `/projects`, `/status`, `/remind`, `/ask` (`bots/telegram_bot.py`)
- **Added:** WhatsApp bot with Twilio webhook handler (`bots/whatsapp_bot.py`)
- **Added:** Agent Orchestrator with 5 specialized agents: Research, Planning, Reminder, Q&A, Help (`agent_orchestrator.py`)
- **Added:** Notification service for push messages via Telegram API and Twilio (`notification_service.py`)
- **Added:** Full agents REST API: webhooks, in-app chat, session management, account linking (`api/agents.py`)
- **Added:** Frontend AgentsPage with in-app chat UI, quick commands, and bot setup instructions (`AgentsPage.tsx`)

### Known Remaining Items
- Rate limiting not yet implemented (needs `slowapi` dependency)
- Prompt injection sanitization not yet added
- No retry logic on external API calls (needs `tenacity`)
- List endpoints lack pagination

---

## [0.1.0] — 2026-07-27

### 🎉 Initial Implementation (Phases 1–5)

#### Phase 1 — Auth & Foundation
- Supabase OAuth (Google + GitHub) + email/password auth
- FastAPI backend with Pydantic config, JWT middleware
- React + Vite frontend with Zustand state management
- Protected routes, auth store, API client with interceptors

#### Phase 2 — DeepSearch Engine
- Multi-source parallel search: arXiv, GitHub, Semantic Scholar, Web (Tavily/SerpAPI)
- Gemini-powered query understanding, sub-query generation
- Result fusion, deduplication, and relevance scoring
- AI summarization with inline citations + gap analysis
- WebSocket streaming for real-time search progress

#### Phase 3 — Project HUB
- AI project plan generation (3-chain Gemini pipeline)
- Architecture diagrams, tech stack recommendations, timelines
- Export to Markdown and PDF
- TTS narration via Sarvam AI

#### Phase 4 — Web Intelligence & Knowledge Clustering
- Trending topics detection and news aggregation
- Competitor tracking and research freshness scoring
- pgvector embeddings + K-means clustering
- Visual knowledge map with cluster labels

#### Phase 5 — Workspaces & Dashboard
- Research workspaces with notes, annotations, saved results
- Dashboard with stats, activity feed, AI recommendations
- Workspace sharing via public links
