"""
Innovix — Web Search Source Adapter

Searches the web using Tavily (primary) or SerpAPI (fallback).
Returns standardized SearchSource results with title, URL, and snippet.

Tavily is preferred for AI-agent workflows; SerpAPI provides Google-quality results.
"""

import logging
from typing import List

import httpx

from app.core.config import settings
from app.models.schemas import SearchSource
from app.services.search.sources.retry_utils import retry_on_http_error

logger = logging.getLogger(__name__)

MAX_RESULTS = 10


async def search_web(query: str, max_results: int = MAX_RESULTS) -> List[SearchSource]:
    """
    Search the web using Tavily or SerpAPI.

    Tries Tavily first (if TAVILY_API_KEY is set), then falls back to SerpAPI.
    Returns empty list if neither is configured.

    Args:
        query: Search query string.
        max_results: Maximum number of results to return.

    Returns:
        List of SearchSource objects with source_type="web".
    """
    if settings.tavily_api_key:
        return await _search_tavily(query, max_results)
    elif settings.serpapi_key:
        return await _search_serpapi(query, max_results)
    else:
        logger.warning("[Web] No TAVILY_API_KEY or SERPAPI_KEY configured — skipping web search")
        return []


@retry_on_http_error
async def _search_tavily(query: str, max_results: int) -> List[SearchSource]:
    """Search using Tavily API."""
    try:
        logger.info(f"[Tavily] Searching for: {query}")

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.tavily.com/search",
                json={
                    "api_key": settings.tavily_api_key,
                    "query": query,
                    "search_depth": "advanced",
                    "max_results": max_results,
                    "include_answer": False,
                    "include_raw_content": False,
                },
            )
            response.raise_for_status()
            data = response.json()

        results = data.get("results", [])
        sources: List[SearchSource] = []

        for result in results:
            snippet = result.get("content", "No description available.")
            if len(snippet) > 300:
                snippet = snippet[:297] + "..."

            sources.append(
                SearchSource(
                    title=result.get("title", "Untitled"),
                    url=result.get("url", ""),
                    snippet=snippet,
                    source_type="web",
                    relevance_score=result.get("score", 0.0),
                    metadata={
                        "published_date": result.get("published_date"),
                        "search_provider": "tavily",
                    },
                )
            )

        logger.info(f"[Tavily] Found {len(sources)} web results")
        return sources

    except Exception as e:
        logger.error(f"[Tavily] Search failed: {e}")
        return []


@retry_on_http_error
async def _search_serpapi(query: str, max_results: int) -> List[SearchSource]:
    """Search using SerpAPI (Google search)."""
    try:
        logger.info(f"[SerpAPI] Searching for: {query}")

        params = {
            "q": query,
            "api_key": settings.serpapi_key,
            "engine": "google",
            "num": max_results,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                "https://serpapi.com/search",
                params=params,
            )
            response.raise_for_status()
            data = response.json()

        organic_results = data.get("organic_results", [])
        sources: List[SearchSource] = []

        for idx, result in enumerate(organic_results[:max_results]):
            snippet = result.get("snippet", "No description available.")
            if len(snippet) > 300:
                snippet = snippet[:297] + "..."

            sources.append(
                SearchSource(
                    title=result.get("title", "Untitled"),
                    url=result.get("link", ""),
                    snippet=snippet,
                    source_type="web",
                    relevance_score=round(1.0 - (idx * 0.05), 2),  # Rank-based score
                    metadata={
                        "position": result.get("position"),
                        "date": result.get("date"),
                        "search_provider": "serpapi",
                    },
                )
            )

        logger.info(f"[SerpAPI] Found {len(sources)} web results")
        return sources

    except Exception as e:
        logger.error(f"[SerpAPI] Search failed: {e}")
        return []
