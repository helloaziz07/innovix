# 📋 Innovix — Project Features

> A comprehensive breakdown of every feature implemented in Innovix, organized by module.
> Features are marked as **✅ Implemented**, **🔧 In Progress**, or **📋 Planned**.

---

## Table of Contents

- [1. Authentication & User Management](#1-authentication--user-management)
- [2. DeepSearch Engine](#2-deepsearch-engine)
- [3. Project HUB (AI Plan Generator)](#3-project-hub-ai-plan-generator)
- [4. Real-Time Generation Pipeline Tracker](#4-real-time-generation-pipeline-tracker)
- [5. Knowledge Clustering](#5-knowledge-clustering)
- [6. Web Intelligence](#6-web-intelligence)
- [7. Research Workspaces](#7-research-workspaces)
- [8. Personalized Dashboard](#8-personalized-dashboard)
- [9. AI Messaging Agents](#9-ai-messaging-agents)
- [10. Text-to-Speech (TTS)](#10-text-to-speech-tts)
- [11. Export & Document Generation](#11-export--document-generation)
- [12. Security & Production Hardening](#12-security--production-hardening)
- [13. UI/UX Design System](#13-uiux-design-system)
- [14. Planned / Upcoming Features](#14-planned--upcoming-features)

---

## 1. Authentication & User Management

**Status:** ✅ Implemented

| Feature | Description | Files |
|---------|-------------|-------|
| Supabase Auth Integration | Full authentication via Supabase — supports email/password, Google OAuth, and GitHub OAuth | `authStore.ts`, `Login.tsx`, `security.py` |
| JWT Middleware | Every protected backend route validates the Supabase JWT token from the `Authorization` header using a shared Supabase singleton | `security.py`, `database.py` |
| Protected Routes | React Router guards that redirect unauthenticated users to the login page | `App.tsx`, `Layout.tsx` |
| Auth State Management | Zustand store tracks session, user, and loading state. Listens to Supabase `onAuthStateChange` for real-time session sync | `authStore.ts` |
| Auth Interceptor | Axios request interceptor attaches the Supabase JWT to every API call automatically | `api.ts` |
| 401 Auto-Redirect | Axios response interceptor catches 401 errors and redirects to `/login` | `api.ts` |
| Email Verification | Signup returns a `needsVerification` flag instead of auto-signing the user in — enforces email verification flow | `authStore.ts` |
| Password Reset | Dedicated password reset page via Supabase's `resetPasswordForEmail` | `ResetPassword.tsx` |
| Sign Out Redirect | Users are cleanly redirected to the Landing page instead of Login upon signing out | `Layout.tsx`, `Dashboard.tsx` |
| User Profile API | `GET /api/auth/me` and `PATCH /api/auth/me` endpoints for reading and updating user profiles | `auth.py` |

---

## 2. DeepSearch Engine

**Status:** ✅ Implemented

The core AI research engine that queries multiple academic and web sources simultaneously, fuses results, and generates cited summaries.

| Feature | Description | Files |
|---------|-------------|-------|
| Multi-Source Parallel Search | Queries arXiv, GitHub, Semantic Scholar, and web (SerpAPI/Tavily) simultaneously using `asyncio.gather` | `deep_search.py` |
| Gemini Query Understanding | Before searching, Gemini breaks the user's idea into optimized sub-queries per source (e.g., an arXiv-specific query vs. a GitHub-specific query) | `deep_search.py` |
| arXiv Source Adapter | Searches arXiv academic papers — returns title, abstract, authors, PDF links. Uses XML parsing | `arxiv_source.py` |
| GitHub Source Adapter | Searches GitHub repositories via REST API — returns repo name, stars, language, description, README excerpt | `github_source.py` |
| Semantic Scholar Adapter | Searches academic papers via the Semantic Scholar API — returns papers with citation counts and author lists | `scholar_source.py` |
| Web Source Adapter | Searches the open web via SerpAPI or Tavily — returns articles, blogs, documentation | `web_source.py` |
| Result Deduplication | Results from all sources are deduplicated by URL to eliminate overlapping entries | `deep_search.py` |
| Relevance Scoring | Each result is assigned a relevance score based on keyword overlap, source authority, and recency | `deep_search.py` |
| AI Summarization | Gemini generates a structured research summary with inline citations referencing specific sources | `deep_search.py` |
| Gap Analysis | Gemini identifies what existing solutions lack and highlights innovation areas based on the research | `deep_search.py` |
| WebSocket Streaming | Search progress events (searching, found results, generating summary) are streamed to the frontend in real-time via WebSocket | `deepsearch.py` (API), `api.ts` |
| Search History | All search results are persisted to Supabase. Users can browse past searches via `GET /api/deepsearch/history` | `deepsearch.py` |
| Project-Linked Searches | Search results can be associated with a specific project by passing `project_id`, feeding into plan generation | `deep_search.py` |
| Standalone Searches | Users can run searches without a project — standalone results appear in search history and can be linked later | `deepsearch.py`, `projects.py` |
| Search Link Suggestions | `GET /api/projects/{id}/suggest-links` finds standalone searches related to a project using keyword overlap | `projects.py` |
| Gemini Timeout Protection | All Gemini API calls are wrapped with `asyncio.wait_for()` (30s/45s/60s limits) to prevent hangs | `deep_search.py` |
| Retry Utilities | Utility module for retrying failed external API calls | `retry_utils.py` |

### Frontend Components

| Component | Description |
|-----------|-------------|
| `DeepSearchPage.tsx` | Main search interface — input, streaming results, citations, and gap analysis in a single view |
| `SearchInput.tsx` | Rich input with example prompts and source selection toggles |
| `ResultStream.tsx` | Real-time streaming display with typing animation as results arrive |
| `SourceCard.tsx` | Individual card for each source (paper, repo, article) with metadata badges |
| `CitationPanel.tsx` | Side panel listing all citations with clickable links |
| `GapAnalysis.tsx` | Visual display of identified research gaps and innovation opportunities |

---

## 3. Project HUB (AI Plan Generator)

**Status:** ✅ Implemented

Takes a project idea (optionally enriched with DeepSearch results) and generates a fully structured, actionable project plan through a 3-stage Gemini pipeline.

| Feature | Description | Files |
|---------|-------------|-------|
| Project CRUD | Full create, read, update, delete operations for projects with status tracking | `projects.py`, `ProjectHubPage.tsx` |
| Pinned Projects | Users can pin projects to the sidebar for quick access. Pin button available on project cards in My Projects and Dashboard. | `Layout.tsx`, `Dashboard.tsx`, `ProjectHubPage.tsx` |
| Stage 1 — Main Plan | Gemini generates: problem validation, existing solution comparison, innovation opportunities, recommended tech stack, API/dataset recommendations, relevant GitHub repos, documentation links | `generator.py`, `project_plan_prompt.py` |
| Stage 2 — Architecture | Gemini generates: a complete Mermaid system architecture diagram, component breakdown with responsibilities, and design patterns | `generator.py`, `architecture_prompt.py` |
| Stage 3 — Roadmap | Gemini generates: phased development milestones, weekly timeline, MVP readiness estimate, and a risk registry | `generator.py`, `roadmap_prompt.py` |
| JSONB Persistence | The full plan is stored in Supabase JSONB columns (`project_plan`, `tech_stack`, `architecture`, `timeline`) for structured frontend rendering | `generator.py` |
| Status Progression | Project status automatically progresses: `ideation` → `researching` → `planning` as the pipeline advances | `generator.py` |
| Auto-Trigger on Create | When a user creates a new project and navigates to its detail page, plan generation is automatically triggered | `ProjectDetail.tsx` |
| Re-generation | Users can click "Regenerate" on an existing project to get a fresh plan | `ProjectDetail.tsx` |
| Project Status Filters | Project list page supports filtering by status (all, ideation, researching, planning, building, completed) | `ProjectHubPage.tsx` |
| Project Search | Client-side search across project titles and idea text | `ProjectHubPage.tsx` |

### Frontend Components

| Component | Description |
|-----------|-------------|
| `ProjectHubPage.tsx` | Grid view of all user projects with status cards, search, filters, dynamic status hover borders, and pin/trash buttons |
| `ProjectDetail.tsx` | Full project view with tabs (Overview, Architecture, Tech Stack, Timeline) and Audio Narrator Listen/Stop toggle |
| `PlanViewer.tsx` | Rendered plan content with sections and integrated Audio Narrator Listen/Stop control |
| `ArchitectureDiagram.tsx` | Mermaid.js diagram renderer with dual panning/scrolling, grab cursor, and hoverable enhanced controls |
| `TechStackCards.tsx` | Visual tech stack display with layer grouping and justification text |
| `TimelineView.tsx` | Interactive timeline/roadmap component with milestone cards |
| `ComparisonTable.tsx` | Side-by-side comparison table for existing solutions |
| `ExportButton.tsx` | Multi-format export dropdown (Markdown, PDF, PPTX) |

---

## 4. Real-Time Generation Pipeline Tracker

**Status:** ✅ Implemented (newly added)

A premium visual stepper overlay that shows exactly which stage the AI is working on during plan generation. Replaces the previous static spinner.

| Feature | Description | Files |
|---------|-------------|-------|
| SSE Streaming Endpoint | `POST /api/projects/{id}/generate-plan-stream` returns a `text/event-stream` response. Each pipeline stage emits a JSON event with `stage`, `message`, and `progress` (0–100%) | `projects.py` |
| Pre-Generation Config | A modal popup intercepts the "Generate Plan" action, allowing users to choose between a "Full Plan" or a "Scoped Plan" (stop early at Main Plan or Architecture) | `GenerationConfigModal.tsx` |
| Scoped Generation | The backend `generate_project_plan` accepts a `target_phase` and halts generation early, instantly saving and returning the partial plan to save API tokens | `generator.py` |
| Dynamic UI Pipeline | The frontend pipeline stepper dynamically filters out skipped stages based on the `targetPhase` so the UI remains clean | `GenerationPipeline.tsx` |
| 5-Stage Visual Pipeline | The overlay displays a vertical stepper with up to 5 stages: **Fetching Research** → **Generating Plan** → **Designing Architecture** → **Building Roadmap** → **Finalizing** | `GenerationPipeline.tsx` |
| Live Progress Bar | A gradient progress bar at the top animates smoothly as `progress` events arrive from the backend | `GenerationPipeline.tsx` |
| Animated Stage Icons | Each step transitions between icons: ○ (pending) → ⟳ spinner (active) → ✓ checkmark (completed) → ✗ (error/cancelled), all with spring animations | `GenerationPipeline.tsx` |
| Real-Time Messages | Each SSE event includes a human-readable `message` (e.g., "Analyzing idea and generating plan structure...") displayed below the progress bar | `GenerationPipeline.tsx` |
| Cancel Generation | A "Cancel Generation" button aborts the `fetch()` request. The backend detects the client disconnect and stops between stages via an `asyncio.Event` | `ProjectDetail.tsx`, `generator.py` |
| Graceful Cancellation | The `GenerationCancelled` exception is raised between Gemini calls (not mid-call), ensuring no partial corrupt data is saved | `generator.py` |
| Terminal State Handling | On completion: "View Your Plan →" button. On error: error message + "Dismiss" button. On cancel: "Dismiss" button. All handled in the same overlay | `GenerationPipeline.tsx` |
| Keep-Alive | SSE endpoint sends `: keep-alive` comments every 1 second to prevent connection timeout during long Gemini calls | `projects.py` |
| Backward Compatibility | The original REST endpoint `POST /generate-plan` is preserved unchanged — the SSE endpoint is a new addition | `projects.py` |
| Pipeline State in Zustand | `pipelineStage`, `pipelineProgress`, and `pipelineMessage` fields in the project store track the current state across components | `projectStore.ts` |

---

## 5. Knowledge Clustering

**Status:** ✅ Implemented

Groups search results into thematic clusters using a TF-IDF + K-Means pipeline, labeled by Gemini.

| Feature | Description | Files |
|---------|-------------|-------|
| TF-IDF Embedding | Converts result titles and snippets into TF-IDF vectors using Scikit-learn | `embedder.py` |
| K-Means Clustering | Runs K-Means (K=4 by default, configurable) over the TF-IDF vectors with cosine similarity | `clusterer.py` |
| Gemini Cluster Labeling | Sends grouped results to Gemini to generate a concise, human-readable label for each cluster | `labeler.py` |
| Cluster Visualization Data | Generates 2D coordinates (for scatter plots) from high-dimensional embeddings | `visualizer.py` |
| Cluster API | `POST /api/clusters/{project_id}/generate` to create clusters; `GET /api/clusters/{project_id}` to retrieve | `clusters.py` |
| Supabase Persistence | Cluster data (labels, keywords, member result IDs) stored in the `clusters` table | `clusters.py` |

### Frontend Components

| Component | Description |
|-----------|-------------|
| `ClustersPage.tsx` | Main clustering page with generation trigger and results display |
| `ClusterMap.tsx` | Interactive 2D scatter plot of knowledge clusters |
| `ClusterDetail.tsx` | Drill-down view showing all results within a selected cluster |
| `ClusterLabels.tsx` | Display of AI-generated thematic labels for each cluster |

---

## 6. Web Intelligence

**Status:** ✅ Implemented

Live web monitoring, trend detection, competitive tracking, and source freshness scoring.

| Feature | Description | Files |
|---------|-------------|-------|
| Trend Detection | Uses SerpAPI + Gemini to identify trending searches and topics in the user's domain | `trend_detector.py` |
| News Aggregation | Collects domain-relevant tech news from HackerNews, ProductHunt, and TechCrunch-style APIs | `news_aggregator.py` |
| Competitive Tracking | Monitors and analyzes similar projects/solutions appearing online for a given project | `competitive_tracker.py` |
| Freshness Scoring | Scores and ranks results by publication date and recency, enabling users to see how current their research is | `freshness_scorer.py` |
| Intelligence API | `GET /api/intelligence/trending`, `GET /api/intelligence/news`, `GET /api/intelligence/freshness/{project_id}`, `GET /api/intelligence/competitors/{project_id}` | `intelligence.py` |

### Frontend Components

| Component | Description |
|-----------|-------------|
| `IntelligencePage.tsx` | Main web intelligence view with tabs for trends, news, and freshness |
| `TrendingTopics.tsx` | Carousel/grid of trending topics with relevance indicators |
| `NewsDigest.tsx` | Aggregated relevant news feed with source and date metadata |
| `FreshnessTimeline.tsx` | Timeline visualization showing when sources were published |

---

## 7. Research Workspaces

**Status:** ✅ Implemented

Per-project collaborative workspaces for organizing research with notes, annotations, and saved results.

| Feature | Description | Files |
|---------|-------------|-------|
| Workspace CRUD | Create, read, update, delete workspaces linked to a project | `workspaces.py` |
| Notes System | Structured notes with content, tags, and timestamps. Full CRUD via API | `workspaces.py` |
| Save Search Results | Save any DeepSearch result to a workspace for later reference | `workspaces.py` |
| Annotations | Highlight and annotate saved research content | `workspaces.py` |
| Workspace Export | Export the entire workspace (notes + saved results) to PDF/Markdown/DOCX | `export_service.py`, `workspaces.py` |
| Workspace Sharing | Toggle workspaces between public and private — shared via public link | `workspaces.py` |

### Frontend Components

| Component | Description |
|-----------|-------------|
| `WorkspacePage.tsx` | Main workspace view with notes, saved results, and export controls |
| `NoteEditor.tsx` | Rich text note editor with tag support |
| `SavedResults.tsx` | Grid/list of saved search results with tags and metadata |
| `AnnotationOverlay.tsx` | Overlay for highlighting and annotating content |
| `ExportDialog.tsx` | Export format selection dialog with preview |

---

## 8. Personalized Dashboard

**Status:** ✅ Implemented

The main landing page for authenticated users — aggregates data from all modules into a single overview.

| Feature | Description | Files |
|---------|-------------|-------|
| Dashboard API | `GET /api/dashboard` returns aggregated data: project counts by status, recent searches, research metrics | `dashboard.py` |
| Activity Feed API | `GET /api/dashboard/activity` returns recent user actions and AI-generated recommendations | `dashboard.py` |
| Project Overview Cards | Status cards showing active projects with progress indicators | `Dashboard.tsx` |
| Recent Projects | Display recent projects with "View All" link and dynamic status-based full card hover effects | `Dashboard.tsx` |
| Progress Charts | Radial/bar charts showing research completion and project status breakdown | `Dashboard.tsx` |
| AI Insights Widget | AI-generated insights and suggestions based on the user's projects, prominently positioned at the top right | `Dashboard.tsx` |
| Quick Actions | One-click shortcuts: new search, continue project, create workspace | `Dashboard.tsx` |

---

## 9. AI Messaging Agents

**Status:** ✅ Implemented

Conversational AI bots on Telegram and WhatsApp for interacting with Innovix from messaging platforms.

| Feature | Description | Files |
|---------|-------------|-------|
| **Telegram Bot** | | |
| `/start` | Links the Telegram account to the Innovix user profile | `telegram_bot.py` |
| `/search <query>` | Runs a quick DeepSearch and returns summarized results | `telegram_bot.py` |
| `/projects` | Lists all active projects with their current status | `telegram_bot.py` |
| `/status <project>` | Returns a detailed progress summary for a specific project | `telegram_bot.py` |
| `/remind <time> <msg>` | Schedules a reminder notification | `telegram_bot.py` |
| `/ask <question>` | Answers any project-related question using Gemini + project context (RAG) | `telegram_bot.py` |
| Proactive Notifications | Sends milestone reminders and trending result alerts without user prompting | `notification_service.py` |
| **WhatsApp Bot** | | |
| Meta Cloud API Webhook | Direct integration with Meta Developer Dashboard for WhatsApp messages | `agents.py` |
| Secure Payload Verification | Verifies the `hub.challenge` from Meta during webhook setup | `agents.py` |
| Natural Language Parsing | Regex + Gemini intent extraction to understand free-text WhatsApp messages | `agents.py` |
| User Identity Resolution | Proactively looks up WhatsApp phone numbers in `agent_sessions` to resolve Innovix `user_id` | `agents.py` |
| **Agent Orchestrator** | | |
| Intent Classification | Routes incoming messages to the correct agent based on keyword and Gemini-based intent analysis | `agent_orchestrator.py` |
| Research Agent | Handles `/search` queries from messaging platforms — runs DeepSearch and returns results | `agent_orchestrator.py` |
| Planning Agent | Handles `/projects` and `/status` — fetches project list and status summaries | `agent_orchestrator.py` |
| Reminder Agent | Handles `/remind` — schedules push notifications via the notification service | `agent_orchestrator.py` |
| Q&A Agent | Default handler — answers free-text questions using project context + RAG from Supabase | `agent_orchestrator.py` |
| **Notification Service** | | |
| Telegram Push | Sends messages via the Telegram Bot API | `notification_service.py` |
| WhatsApp Push | Sends messages via Twilio REST API | `notification_service.py` |
| **Frontend** | | |
| In-App Chat UI | Chat interface within the web app for sending messages to the bot agents | `AgentsPage.tsx` |
| Quick Commands | Preset command buttons (search, projects, status, remind, ask) | `AgentsPage.tsx` |
| Bot Setup Instructions | Step-by-step guide for linking Telegram and WhatsApp accounts | `AgentsPage.tsx` |
| Session Management | API endpoints for viewing conversation history and linking accounts | `agents.py` |

---

## 10. Text-to-Speech (TTS)

**Status:** ✅ Implemented

Provides audio narration capabilities via the Sarvam AI TTS API.

| Feature | Description | Files |
|---------|-------------|-------|
| Text-to-Speech (TTS) | `tts_service.py` synthesizes speech from text via Sarvam AI | `tts_service.py` |
| Plan Narration | `POST /api/projects/{id}/narrate` generates a spoken narration of the project plan as WAV audio | `projects.py` |
| Audio Narrator UI | Integrated single Listen/Stop toggle button in the Plan Viewer and Project Detail header for seamless playback control | `PlanViewer.tsx`, `ProjectDetail.tsx` |

---

## 11. Export & Document Generation

**Status:** ✅ Implemented

Multiple export formats for project plans and workspace content.

| Feature | Description | Files |
|---------|-------------|-------|
| Markdown Export | Generates a clean, structured Markdown document from the project plan | `export_service.py` |
| PDF Export (Server-Side) | Converts the plan to PDF using `xhtml2pdf` with proper formatting | `export_service.py` |
| PPTX Export | Generates a PowerPoint presentation from the plan using `python-pptx` with structured slides | `export_service.py` |
| PDF Export (Client-Side) | `html2pdf.js` used for quick client-side PDF generation | `ExportButton.tsx` |
| Narration Text Extraction | Extracts a human-readable narration script from the plan for TTS | `export_service.py` |
| Export API | `GET /api/projects/{id}/export?format=md|pdf|pptx` with Content-Disposition headers for file download | `projects.py` |
| Workspace Export | Workspaces can be exported with all notes, saved results, and annotations | `workspaces.py` |

---

## 12. Security & Production Hardening

**Status:** ✅ Implemented

| Feature | Description | Files |
|---------|-------------|-------|
| Supabase Client Singleton | Shared singleton replaces per-request client creation — eliminates memory leaks | `security.py`, `database.py` |
| WebSocket JWT Auth | WebSocket connections pass the JWT via `?token=` query parameter, validated server-side | `deepsearch.py`, `api.ts` |
| SECRET_KEY Enforcement | Application crashes on startup in production if `SECRET_KEY` is the default value | `main.py` |
| CORS Hardening | Environment-aware CORS — strict origin allowlist in production, permissive only in dev | `main.py` |
| Error Sanitization | Generic error messages returned to clients; full error details logged server-side only | `security.py`, `deepsearch.py` |
| Rate Limiting | 100 requests/minute per IP via `slowapi` middleware | `main.py` |
| Cloudflare Turnstile CAPTCHA | Login and signup forms protected by Cloudflare Turnstile CAPTCHA | `Login.tsx` |
| Row Level Security (RLS) | Enforced at the Supabase database level — users can only access their own data | `001_create_tables.sql` |
| Database Migrations | Complete SQL schema with RLS policies, indexes, and triggers | `001_create_tables.sql`, `002_agent_sessions.sql` |
| Gemini Timeout Protection | All Gemini API calls wrapped with `asyncio.wait_for()` (30s/45s/60s timeouts) | `deep_search.py` |
| Gemini JSON Parsing | Uses `response_mime_type="application/json"` for structured output instead of fragile markdown stripping | `deep_search.py` |
| Webhook Validation | Telegram and WhatsApp webhook endpoints validate payload structure | `agents.py` |
| Bot Identity Resolution | Bots resolve real `user_id` from the `agent_sessions` table instead of trusting raw phone numbers | `agents.py` |
| `.env.example` | Comprehensive example with all required and optional keys documented | `.env.example` |

---

## 13. UI/UX Design System

**Status:** ✅ Implemented

| Feature | Description | Files |
|---------|-------------|-------|
| Dark Mode / Light Mode | System preference detection + manual toggle | `ThemeToggle.tsx` |
| Framer Motion Animations | Smooth page transitions, card animations, and micro-interactions throughout | All feature components |
| Glassmorphism Effects | Glass-style cards with backdrop blur on dashboard and overlays | `Dashboard.tsx`, `GenerationPipeline.tsx` |
| Loading Skeletons | Skeleton placeholder components displayed while data is loading | `skeleton.tsx` |
| Error Boundaries | Catches render errors (especially Mermaid diagram conflicts) with graceful fallback UI | `ErrorBoundary.tsx`, `ProjectDetail.tsx` |
| Responsive Design | Full mobile, tablet, and desktop responsive layouts | All pages |
| Radix UI Primitives | Accessible UI primitives (Dialog, Tabs, Dropdown, Tooltip) from Radix | `ui/` components |
| Lucide Icons | Consistent icon library across all components | All components |
| Gradient Accents | Gradient buttons, progress bars, and accent elements | Throughout UI |
| Landing Page | Premium public landing page with animated hero, feature cards, and interactive `framer-motion` Docs Modal | `Landing.tsx` |
| Authenticated Layout | App shell with sidebar navigation, top-level professional collapse toggle (`PanelLeftClose`), and always-visible Pinned Projects | `Layout.tsx` |

---

## 14. Planned / Upcoming Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Rate Limiting Tuning | Fine-grained rate limits per endpoint category (search heavier than reads) | Medium |
| Prompt Injection Sanitization | Sanitize user inputs before they reach Gemini prompts to prevent manipulation | High |
| Retry Logic on External APIs | Use `tenacity` for automatic retries with exponential backoff on arXiv, GitHub, etc. | Medium |
| Pagination on List Endpoints | Server-side cursor-based pagination for projects, searches, and workspaces | Medium |
| Sarvam AI TTS in Frontend UI | Integrated audio player component in the dashboard and plan viewer for TTS playback | Low |
| Meta WhatsApp Cloud API Webhook | Complete the Meta direct webhook (infrastructure is in place, needs production testing) | Medium |
| Production Deployment | Deploy frontend on Vercel, backend on Render, bots as background workers | High |
| Email Notifications | Email-based notification support alongside Telegram/WhatsApp | Low |
| Collaborative Workspaces | Multi-user workspace support — invite team members, concurrent editing | Medium |
| GitHub Repo Auto-Scaffold | Auto-generate a GitHub repository from the generated project plan with README, folder structure, and CI | Low |
| Demo Video Recording | Record a full walkthrough demo video for documentation | Medium |
| Lighthouse Performance Audit | Optimize frontend for Lighthouse score > 90 (performance, accessibility, SEO) | Medium |

---

> **Last Updated:** August 9, 2026
