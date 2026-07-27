"""
Innovix — Semantic Scholar Source Adapter

Searches Semantic Scholar for academic papers matching a query.
Returns standardized SearchSource results with citation counts and authors.

Uses the Semantic Scholar Academic Graph API (free, optional key for higher limits).
"""

import logging
from typing import List

import httpx

from app.core.config import settings
from app.models.schemas import SearchSource

logger = logging.getLogger(__name__)

BASE_URL = "https://api.semanticscholar.org/graph/v1"
MAX_RESULTS = 10


async def search_scholar(query: str, max_results: int = MAX_RESULTS) -> List[SearchSource]:
    """
    Search Semantic Scholar for papers matching the query.

    Args:
        query: Search query string.
        max_results: Maximum number of results to return.

    Returns:
        List of SearchSource objects with source_type="scholar".
    """
    try:
        logger.info(f"[Scholar] Searching for: {query}")

        headers = {"Content-Type": "application/json"}
        if settings.semantic_scholar_api_key:
            headers["x-api-key"] = settings.semantic_scholar_api_key

        params = {
            "query": query,
            "limit": max_results,
            "fields": "title,abstract,url,citationCount,authors,year,externalIds,publicationTypes",
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{BASE_URL}/paper/search",
                params=params,
                headers=headers,
            )
            response.raise_for_status()
            data = response.json()

        papers = data.get("data", [])
        sources: List[SearchSource] = []

        for paper in papers:
            if not paper.get("title"):
                continue

            abstract = paper.get("abstract") or "No abstract available."
            if len(abstract) > 300:
                abstract = abstract[:297] + "..."

            # Build URL — prefer Semantic Scholar page
            paper_url = paper.get("url") or f"https://www.semanticscholar.org/paper/{paper.get('paperId', '')}"

            # Format authors
            authors_list = paper.get("authors", [])
            authors = ", ".join(a.get("name", "") for a in authors_list[:5])
            if len(authors_list) > 5:
                authors += f" (+{len(authors_list) - 5} more)"

            sources.append(
                SearchSource(
                    title=paper["title"],
                    url=paper_url,
                    snippet=abstract,
                    source_type="scholar",
                    relevance_score=0.0,
                    metadata={
                        "authors": authors,
                        "year": paper.get("year"),
                        "citation_count": paper.get("citationCount", 0),
                        "paper_id": paper.get("paperId"),
                        "doi": paper.get("externalIds", {}).get("DOI"),
                        "publication_types": paper.get("publicationTypes", []),
                    },
                )
            )

        logger.info(f"[Scholar] Found {len(sources)} papers")
        return sources

    except httpx.HTTPStatusError as e:
        if e.response.status_code == 429:
            logger.warning("[Scholar] Rate limited — consider adding SEMANTIC_SCHOLAR_API_KEY")
        else:
            logger.error(f"[Scholar] HTTP error: {e}")
        return []
    except Exception as e:
        logger.error(f"[Scholar] Search failed: {e}")
        return []
