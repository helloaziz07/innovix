"""
Innovix — Competitive Tracker

Monitors similar projects and solutions appearing online for a given
research domain. Identifies competitors, alternatives, and new entrants.
"""

import asyncio
import json
import logging
from typing import List, Dict, Any

from google import genai
from google.genai import types

from app.core.config import settings
from app.core.database import supabase_admin

logger = logging.getLogger(__name__)

gemini_client = genai.Client(api_key=settings.gemini_api_key)
GEMINI_MODEL = "gemini-2.0-flash"


async def track_competitors(
    project_id: str,
    domain: str,
    idea_text: str,
) -> List[Dict[str, Any]]:
    """
    Identify competing projects, solutions, and alternatives for
    a given project idea.

    Uses existing DeepSearch results (if available) plus Gemini analysis
    to build a competitive landscape.

    Args:
        project_id: UUID of the project to analyze.
        domain: Research domain.
        idea_text: The user's project idea description.

    Returns:
        List of competitors: {name, type, description, url, strengths, weaknesses, threat_level}
    """
    # Fetch any existing search results for context
    existing_context = await _get_search_context(project_id)

    prompt = f"""You are a competitive intelligence analyst. Analyze the competitive landscape
for this project idea:

**Idea:** {idea_text}
**Domain:** {domain}

{f"**Existing Research Context:**{chr(10)}{existing_context}" if existing_context else ""}

Identify 6-10 competing or related solutions. For each competitor provide:
- name: Product/project name
- type: "direct_competitor", "indirect_competitor", "alternative", "open_source", or "research_project"
- description: What it does (1-2 sentences)
- url: Website URL if known (leave empty if unsure)
- strengths: List of 2-3 key strengths
- weaknesses: List of 2-3 key weaknesses
- threat_level: "high", "medium", or "low"
- differentiation: How the user's idea could differentiate from this

Return ONLY a JSON array. No markdown fences."""

    try:
        response = await asyncio.to_thread(
            gemini_client.models.generate_content,
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.4,
                max_output_tokens=3000,
            ),
        )
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        if text.startswith("json"):
            text = text[4:].strip()

        competitors = json.loads(text)

        # Ensure all required fields exist
        for comp in competitors:
            comp.setdefault("name", "Unknown")
            comp.setdefault("type", "indirect_competitor")
            comp.setdefault("description", "")
            comp.setdefault("url", "")
            comp.setdefault("strengths", [])
            comp.setdefault("weaknesses", [])
            comp.setdefault("threat_level", "medium")
            comp.setdefault("differentiation", "")

        return competitors

    except Exception as e:
        logger.error(f"[CompetitiveTracker] Analysis failed: {e}")
        return []


async def _get_search_context(project_id: str) -> str:
    """Fetch existing search results to provide context for competitive analysis."""
    try:
        result = (
            supabase_admin.table("search_results")
            .select("query, summary")
            .eq("project_id", project_id)
            .order("created_at", desc=True)
            .limit(3)
            .execute()
        )
        if result.data:
            parts = []
            for r in result.data:
                parts.append(f"- Search: \"{r.get('query', '')}\" → {(r.get('summary', '') or '')[:200]}")
            return "\n".join(parts)
    except Exception:
        pass
    return ""
