"""
Innovix — arXiv Source Adapter

Searches arXiv for research papers matching a query.
Returns standardized SearchSource results with title, abstract, authors, and PDF link.

Uses the `arxiv` Python package (no API key required).
"""

import asyncio
import logging
from typing import List

import arxiv

from app.models.schemas import SearchSource

logger = logging.getLogger(__name__)

# Maximum results per query
MAX_RESULTS = 10


async def search_arxiv(query: str, max_results: int = MAX_RESULTS) -> List[SearchSource]:
    """
    Search arXiv for papers matching the query.

    Args:
        query: Search query string (user's idea or sub-query).
        max_results: Maximum number of results to return.

    Returns:
        List of SearchSource objects with source_type="arxiv".
    """
    try:
        logger.info(f"[arXiv] Searching for: {query}")

        # arXiv client is synchronous — run in executor
        results = await asyncio.to_thread(_fetch_arxiv, query, max_results)

        sources: List[SearchSource] = []
        for paper in results:
            authors = ", ".join(a.name for a in paper.authors[:5])
            if len(paper.authors) > 5:
                authors += f" (+{len(paper.authors) - 5} more)"

            sources.append(
                SearchSource(
                    title=paper.title.strip().replace("\n", " "),
                    url=paper.entry_id,
                    snippet=_truncate(paper.summary.strip().replace("\n", " "), 300),
                    source_type="arxiv",
                    relevance_score=0.0,  # Will be scored by the orchestrator
                    metadata={
                        "authors": authors,
                        "published": paper.published.isoformat() if paper.published else None,
                        "pdf_url": paper.pdf_url,
                        "primary_category": paper.primary_category,
                        "categories": paper.categories,
                    },
                )
            )

        logger.info(f"[arXiv] Found {len(sources)} papers")
        return sources

    except Exception as e:
        logger.error(f"[arXiv] Search failed: {e}")
        return []


def _fetch_arxiv(query: str, max_results: int) -> list:
    """Synchronous arXiv fetch — called via asyncio.to_thread."""
    client = arxiv.Client()
    search = arxiv.Search(
        query=query,
        max_results=max_results,
        sort_by=arxiv.SortCriterion.Relevance,
    )
    return list(client.results(search))


def _truncate(text: str, max_len: int) -> str:
    """Truncate text to max_len with ellipsis."""
    if len(text) <= max_len:
        return text
    return text[: max_len - 3].rsplit(" ", 1)[0] + "..."
