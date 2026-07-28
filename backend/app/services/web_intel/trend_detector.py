"""
Innovix — Trend Detector

Detects trending topics in a user's research domain using SerpAPI
and Gemini analysis. Falls back to Gemini-only analysis when SerpAPI
is unavailable.
"""

import asyncio
import json
import logging
from typing import List, Dict, Any, Optional

import httpx
from google import genai
from google.genai import types

from app.core.config import settings

logger = logging.getLogger(__name__)

gemini_client = genai.Client(api_key=settings.gemini_api_key)
GEMINI_MODEL = "gemini-2.0-flash"


async def detect_trends(
    domain: str,
    max_results: int = 10,
) -> List[Dict[str, Any]]:
    """
    Detect trending topics for a given research domain.

    Uses SerpAPI for real-time Google Trends data when available,
    then enriches results with Gemini analysis. Falls back to
    Gemini-only trend generation.

    Args:
        domain: The research domain or topic area.
        max_results: Maximum number of trends to return.

    Returns:
        List of trend dicts: {topic, description, relevance, momentum, sources}
    """
    trends = []

    # Try SerpAPI Google Trends
    if settings.serpapi_key:
        try:
            serp_trends = await _fetch_serpapi_trends(domain)
            trends.extend(serp_trends[:max_results])
        except Exception as e:
            logger.warning(f"[TrendDetector] SerpAPI failed: {e}")

    # Enrich/generate with Gemini
    try:
        ai_trends = await _generate_ai_trends(domain, trends, max_results)
        if ai_trends:
            trends = ai_trends
    except Exception as e:
        logger.error(f"[TrendDetector] Gemini trend generation failed: {e}")

    return trends[:max_results]


async def _fetch_serpapi_trends(domain: str) -> List[Dict[str, Any]]:
    """Fetch related trending searches from SerpAPI."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(
            "https://serpapi.com/search.json",
            params={
                "engine": "google_trends",
                "q": domain,
                "data_type": "RELATED_QUERIES",
                "api_key": settings.serpapi_key,
            },
        )
        response.raise_for_status()
        data = response.json()

    trends = []

    # Parse rising queries
    rising = data.get("related_queries", {}).get("rising", [])
    for item in rising[:10]:
        trends.append({
            "topic": item.get("query", ""),
            "description": f"Rising search query related to {domain}",
            "relevance": "high",
            "momentum": "rising",
            "growth": item.get("value", ""),
            "source": "google_trends",
        })

    # Parse top queries
    top = data.get("related_queries", {}).get("top", [])
    for item in top[:5]:
        trends.append({
            "topic": item.get("query", ""),
            "description": f"Top search query in {domain}",
            "relevance": "high",
            "momentum": "stable",
            "growth": item.get("value", ""),
            "source": "google_trends",
        })

    return trends


async def _generate_ai_trends(
    domain: str,
    existing_trends: List[Dict],
    max_results: int,
) -> List[Dict[str, Any]]:
    """Use Gemini to generate/enrich trending topics."""
    existing_context = ""
    if existing_trends:
        topics = [t.get("topic", "") for t in existing_trends[:5]]
        existing_context = f"\nAlready identified trends: {', '.join(topics)}\nExpand on these and add new emerging trends."

    prompt = f"""You are a research trend analyst. Identify the top {max_results} trending topics
and emerging research directions in the domain: "{domain}".
{existing_context}

For each trend, provide:
- topic: Short name (2-5 words)
- description: One sentence explaining the trend
- relevance: "high", "medium", or "low"
- momentum: "rising", "stable", "emerging", or "declining"
- why_important: Why this matters for researchers/students
- related_keywords: List of 3-5 related search terms

Return ONLY a JSON array of objects. No markdown fences, no explanation."""

    try:
        response = await asyncio.to_thread(
            gemini_client.models.generate_content,
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.5,
                max_output_tokens=2000,
            ),
        )
        text = response.text.strip()

        # Strip markdown fences
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        if text.startswith("json"):
            text = text[4:].strip()

        return json.loads(text)

    except (json.JSONDecodeError, Exception) as e:
        logger.error(f"[TrendDetector] AI trend parsing failed: {e}")
        return existing_trends
