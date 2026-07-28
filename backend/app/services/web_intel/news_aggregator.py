"""
Innovix — News Aggregator

Aggregates relevant tech news and articles from multiple sources
for a given research domain. Uses SerpAPI for web results and
Gemini for relevance filtering and summarization.
"""

import asyncio
import json
import logging
from typing import List, Dict, Any

import httpx
from google import genai
from google.genai import types

from app.core.config import settings

logger = logging.getLogger(__name__)

gemini_client = genai.Client(api_key=settings.gemini_api_key)
GEMINI_MODEL = "gemini-2.0-flash"


async def aggregate_news(
    domain: str,
    max_results: int = 15,
) -> List[Dict[str, Any]]:
    """
    Aggregate relevant news articles for a research domain.

    Combines results from SerpAPI news search with Gemini-generated
    insights about recent developments.

    Args:
        domain: The research domain or topic.
        max_results: Maximum news items to return.

    Returns:
        List of news items: {title, url, source, snippet, published_date, relevance, category}
    """
    news_items = []

    # Fetch from SerpAPI news
    if settings.serpapi_key:
        try:
            serp_news = await _fetch_serpapi_news(domain)
            news_items.extend(serp_news)
        except Exception as e:
            logger.warning(f"[NewsAggregator] SerpAPI news failed: {e}")

    # Fetch from Tavily if available
    if settings.tavily_api_key and len(news_items) < max_results:
        try:
            tavily_news = await _fetch_tavily_news(domain)
            news_items.extend(tavily_news)
        except Exception as e:
            logger.warning(f"[NewsAggregator] Tavily news failed: {e}")

    # If no API results, use Gemini to generate recent developments
    if not news_items:
        try:
            ai_news = await _generate_ai_news(domain, max_results)
            news_items.extend(ai_news)
        except Exception as e:
            logger.error(f"[NewsAggregator] AI news generation failed: {e}")

    # Deduplicate by title similarity
    seen_titles = set()
    unique = []
    for item in news_items:
        title_key = item.get("title", "").lower().strip()[:50]
        if title_key not in seen_titles:
            seen_titles.add(title_key)
            unique.append(item)

    return unique[:max_results]


async def _fetch_serpapi_news(domain: str) -> List[Dict[str, Any]]:
    """Fetch news from SerpAPI Google News engine."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(
            "https://serpapi.com/search.json",
            params={
                "engine": "google_news",
                "q": f"{domain} technology research",
                "gl": "us",
                "hl": "en",
                "api_key": settings.serpapi_key,
            },
        )
        response.raise_for_status()
        data = response.json()

    results = []
    for item in data.get("news_results", [])[:10]:
        results.append({
            "title": item.get("title", ""),
            "url": item.get("link", ""),
            "source": item.get("source", {}).get("name", "Unknown"),
            "snippet": item.get("snippet", ""),
            "published_date": item.get("date", ""),
            "thumbnail": item.get("thumbnail", ""),
            "relevance": "high",
            "category": "news",
        })

    return results


async def _fetch_tavily_news(domain: str) -> List[Dict[str, Any]]:
    """Fetch recent articles from Tavily search API."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            "https://api.tavily.com/search",
            json={
                "api_key": settings.tavily_api_key,
                "query": f"latest {domain} research news developments",
                "search_depth": "advanced",
                "include_answer": False,
                "max_results": 8,
                "topic": "news",
            },
        )
        response.raise_for_status()
        data = response.json()

    results = []
    for item in data.get("results", []):
        results.append({
            "title": item.get("title", ""),
            "url": item.get("url", ""),
            "source": _extract_domain(item.get("url", "")),
            "snippet": item.get("content", "")[:200],
            "published_date": item.get("published_date", ""),
            "relevance": "high" if item.get("score", 0) > 0.7 else "medium",
            "category": "article",
        })

    return results


async def _generate_ai_news(domain: str, max_results: int) -> List[Dict[str, Any]]:
    """Use Gemini to generate recent news/developments when APIs aren't available."""
    prompt = f"""You are a technology news analyst. List the {max_results} most recent and significant
developments, news, or breakthroughs in the domain: "{domain}".

Focus on developments from the last 1-3 months. For each item provide:
- title: News headline
- source: Publication name
- snippet: 1-2 sentence summary
- published_date: Approximate date (e.g., "July 2026")
- relevance: "high", "medium", or "low"
- category: "research", "industry", "product", "funding", or "regulatory"

Return ONLY a JSON array. No markdown fences."""

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
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        if text.startswith("json"):
            text = text[4:].strip()

        items = json.loads(text)
        # Add url placeholder for AI-generated items
        for item in items:
            item.setdefault("url", "")
            item.setdefault("category", "research")
        return items

    except Exception as e:
        logger.error(f"[NewsAggregator] AI news parsing failed: {e}")
        return []


def _extract_domain(url: str) -> str:
    """Extract domain name from URL for display."""
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        return parsed.netloc.replace("www.", "")
    except Exception:
        return "Unknown"
