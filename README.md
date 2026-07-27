# Innovix — AI-Powered Research & Innovation Copilot

> **Search Less. Solve More.** — An AI copilot that helps students move seamlessly from problem discovery to project execution, leveraging iNSIGHTS Layer 2 capabilities.

![License](https://img.shields.io/badge/license-MIT-blue)
![Python](https://img.shields.io/badge/python-3.12-blue)
![React](https://img.shields.io/badge/react-18-61dafb)
![FastAPI](https://img.shields.io/badge/fastapi-0.115-009688)

## 🚀 Features

- 🔍 **DeepSearch** — Multi-source AI research with arXiv, GitHub, Semantic Scholar, and web
- 🚀 **Project HUB** — Auto-generated project plans with architecture, tech stack, and timelines
- 🤖 **AI Agents** — Telegram + WhatsApp bots for progress tracking and Q&A
- 🌐 **Real-time Web Intelligence** — Trending topics, freshness scoring, news aggregation
- 📊 **Personalized Dashboard** — Interactive analytics with AI recommendations
- 🧠 **Knowledge Clustering** — Embedding-based thematic grouping of research
- 📚 **Research Workspaces** — Save, annotate, and export research findings

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Backend | FastAPI (Python 3.12) |
| Database | Supabase PostgreSQL + pgvector |
| AI/LLM | Google Gemini 2.0 Flash |
| Orchestration | LangChain + Google ADK |
| Messaging | Telegram Bot + WhatsApp (Twilio) |
| Deployment | Vercel + Render |

## 📁 Project Structure

```
Innovix/
├── frontend/       # React + Vite SPA
├── backend/        # FastAPI REST API
├── bots/           # Telegram + WhatsApp bots
├── supabase/       # Database migrations
└── docs/           # Documentation
```

## ⚡ Quick Start

### Prerequisites
- Python 3.12+
- Node.js 18+
- Supabase account

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
pip install -r requirements.txt
copy .env.example .env      # Fill in your API keys
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
