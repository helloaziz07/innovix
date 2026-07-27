"""
Innovix — GitHub Source Adapter

Searches GitHub for repositories matching a query.
Returns standardized SearchSource results with repo metadata.

Uses PyGithub with an optional GITHUB_TOKEN for higher rate limits.
"""

import asyncio
import logging
from typing import List

from github import Github, Auth
from github.GithubException import GithubException

from app.core.config import settings
from app.models.schemas import SearchSource

logger = logging.getLogger(__name__)

MAX_RESULTS = 10


async def search_github(query: str, max_results: int = MAX_RESULTS) -> List[SearchSource]:
    """
    Search GitHub for repositories matching the query.

    Args:
        query: Search query string.
        max_results: Maximum number of results to return.

    Returns:
        List of SearchSource objects with source_type="github".
    """
    if not settings.github_token:
        logger.warning("[GitHub] No GITHUB_TOKEN configured — skipping GitHub search")
        return []

    try:
        logger.info(f"[GitHub] Searching repos for: {query}")

        results = await asyncio.to_thread(_fetch_github, query, max_results)
        return results

    except GithubException as e:
        logger.error(f"[GitHub] API error: {e}")
        return []
    except Exception as e:
        logger.error(f"[GitHub] Search failed: {e}")
        return []


def _fetch_github(query: str, max_results: int) -> List[SearchSource]:
    """Synchronous GitHub fetch — called via asyncio.to_thread."""
    auth = Auth.Token(settings.github_token)
    g = Github(auth=auth)

    # Search repositories sorted by relevance (best match)
    repos = g.search_repositories(
        query=query,
        sort="stars",
        order="desc",
    )

    sources: List[SearchSource] = []
    for repo in repos[:max_results]:
        description = repo.description or "No description provided."

        # Truncate long descriptions
        if len(description) > 300:
            description = description[:297] + "..."

        sources.append(
            SearchSource(
                title=repo.full_name,
                url=repo.html_url,
                snippet=description,
                source_type="github",
                relevance_score=0.0,
                metadata={
                    "stars": repo.stargazers_count,
                    "forks": repo.forks_count,
                    "language": repo.language,
                    "topics": repo.get_topics()[:10] if repo.get_topics() else [],
                    "updated_at": repo.updated_at.isoformat() if repo.updated_at else None,
                    "open_issues": repo.open_issues_count,
                    "license": repo.license.name if repo.license else None,
                },
            )
        )

    logger.info(f"[GitHub] Found {len(sources)} repositories")
    g.close()
    return sources
