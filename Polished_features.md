# 🌟 Innovix — Polished Features & Next Steps

This document outlines the roadmap for the next phase of Innovix. These features are designed to elevate the platform from a highly functional application to a **premium, production-ready $1B SaaS product**.

---

## 🎨 1. Polish & UX Refinements (The "Premium Feel")

### 1.1 Granular AI Editing (The "Magic Wand")
**Goal:** Allow users to refine specific parts of their project plan without regenerating the entire section.
- **How it works:** When a user is in "Edit Mode" inside the `PlanViewer`, they can highlight a specific sentence or paragraph.
- **UI Element:** A floating "Magic Wand" tooltip appears above the highlighted text.
- **Actions:** 
  - *Expand this* (Make it longer/more detailed)
  - *Make it technical* (Add developer jargon and specifics)
  - *Summarize* (Make it punchy and brief)
- **Technical Implementation:** A new backend endpoint `POST /api/projects/{id}/magic-edit` that takes the highlighted text, the surrounding context, and a system prompt to return the modified string.

### 1.2 Streaming UI Polish
**Goal:** Eliminate layout shifts and provide a visually stunning loading experience during AI generation.
- **How it works:** When DeepSearch or the Plan Generator is running, instead of showing raw text slowly appearing or a simple spinner, the UI will display "Skeleton Loaders" or glowing placeholder blocks.
- **UI Element:** Animated, pulsing gradient blocks (using Framer Motion) that roughly match the shape of the expected content. As the WebSocket stream delivers chunks, the glowing blocks dissolve into the actual text.
- **Technical Implementation:** Enhance the existing `ResultStream.tsx` and `GenerationPipeline.tsx` to include `framer-motion` layout animations and skeleton placeholders.

### 1.3 Mobile Responsiveness Audit
**Goal:** Ensure complex data structures (like Mermaid diagrams and citation panels) look perfect on mobile and tablet devices.
- **How it works:** Audit and adjust Tailwind CSS classes across the application.
- **Key Areas of Focus:**
  - `ArchitectureDiagram`: Wrap the Mermaid SVG in a scrollable, touch-friendly container with pinch-to-zoom capabilities.
  - `DeepSearchPage`: Convert the side-by-side citation panel into a swipeable bottom sheet or collapsible accordion on mobile.
  - `ProjectHub`: Ensure the 3-tab layout scales down to horizontal scrolling or a dropdown menu on smaller screens.

---

## 🚀 2. New SaaS Features (Commercial Readiness)

### 2.1 Stripe Billing & Token Limits
**Goal:** Protect API costs (Gemini, Sarvam TTS) and monetize the platform by introducing a credit-based subscription system.
- **How it works:** Every AI action costs a specific amount of "Credits" (e.g., DeepSearch = 2 credits, Generate Plan = 5 credits, TTS = 1 credit).
- **Tiers:**
  - *Free Tier:* 50 credits/month.
  - *Pro Tier:* 1000 credits/month ($15/mo).
- **Technical Implementation:** 
  - Integrate Stripe Checkout and Stripe Webhooks.
  - Add a `credits` column to the `users` table in Supabase.
  - Create a backend dependency/middleware that checks and deducts credits before executing any AI route.

### 2.2 "Chat with Project" Sidekick
**Goal:** Allow users to converse directly with their project data to brainstorm or solve specific problems.
- **How it works:** A floating chat widget (or a collapsible side panel) on the `ProjectDetail` page. 
- **User Flow:** The user asks, *"What is the best database schema for the user table?"* The AI reads the *entire* current project plan (Overview, Tech Stack, Architecture) as its context and provides a tailored answer.
- **Technical Implementation:** 
  - New frontend component: `ProjectSidekick.tsx`.
  - New backend endpoint: `POST /api/projects/{id}/chat`.
  - The endpoint pulls the current project JSON, formats it into the system prompt, and streams a chat response back to the user via WebSockets or Server-Sent Events (SSE).

### 2.3 User Onboarding Tour
**Goal:** Reduce time-to-value for new signups by guiding them through their first "Aha!" moment.
- **How it works:** When a user logs in for the very first time, a step-by-step interactive tour begins, darkening the background and highlighting specific UI elements.
- **Tour Steps:**
  1. *Welcome to Innovix! Let's build your first project.*
  2. *Start by searching the web and academic papers using DeepSearch.*
  3. *Save your research to a Project.*
  4. *Click "Generate Plan" to watch the AI build your architecture and timeline.*
- **Technical Implementation:** Integrate a library like `driver.js` or `react-joyride`. Track a `has_seen_tour` boolean in the Supabase user profile to ensure it only runs once.
