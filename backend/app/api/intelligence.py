"""
Innovix API — Web Intelligence Routes

Endpoints for trending topics, news aggregation, freshness scoring,
and competitive tracking.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security import get_current_user
from app.core.database import supabase_admin
from app.services.web_intel.trend_detector import detect_trends
from app.services.web_intel.news_aggregator import aggregate_news
from app.services.web_intel.freshness_scorer import score_results, get_freshness_distribution
from app.services.web_intel.competitive_tracker import track_competitors

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/intelligence", tags=["Web Intelligence"])


@router.get("/trending")
async def get_trending_topics(
    domain: str = Query(..., min_length=2, description="Research domain to find trends for"),
    max_results: int = Query(default=10, ge=1, le=20),
    user: dict = Depends(get_current_user),
):
    """
    Get trending topics and emerging research directions for a domain.
    Uses SerpAPI + Gemini analysis.
    """
    try:
        trends = await detect_trends(domain, max_results=max_results)
        return {"domain": domain, "trends": trends, "count": len(trends)}
    except Exception as e:
        logger.error(f"[Intelligence] Trending topics failed: {e}")
        raise HTTPException(status_code=500, detail=f"Trend detection failed: {str(e)}")


@router.get("/news")
async def get_news(
    domain: str = Query(..., min_length=2, description="Research domain"),
    max_results: int = Query(default=15, ge=1, le=30),
    user: dict = Depends(get_current_user),
):
    """
    Get aggregated news and recent developments for a research domain.
    """
    try:
        news = await aggregate_news(domain, max_results=max_results)
        return {"domain": domain, "news": news, "count": len(news)}
    except Exception as e:
        logger.error(f"[Intelligence] News aggregation failed: {e}")
        raise HTTPException(status_code=500, detail=f"News aggregation failed: {str(e)}")


@router.get("/freshness/{project_id}")
async def get_freshness_scored_results(
    project_id: str,
    user: dict = Depends(get_current_user),
):
    """
    Get freshness-scored search results for a project.
    Each result gets a freshness score, label, and color.
    """
    try:
        # Verify project ownership
        project = (
            supabase_admin.table("projects")
            .select("id")
            .eq("id", project_id)
            .eq("user_id", user["id"])
            .single()
            .execute()
        )
        if not project.data:
            raise HTTPException(status_code=404, detail="Project not found")

        # Fetch search results
        result = (
            supabase_admin.table("search_results")
            .select("*")
            .eq("project_id", project_id)
            .execute()
        )
        results = result.data or []

        if not results:
            return {
                "results": [],
                "distribution": {"bands": [], "total": 0},
                "message": "No search results found for this project",
            }

        # Flatten sources into individual results for scoring
        all_sources = []
        for r in results:
            sources = r.get("sources", [])
            if isinstance(sources, list):
                for src in sources:
                    if isinstance(src, dict):
                        src["search_query"] = r.get("query", "")
                        src["search_id"] = r.get("id", "")
                        all_sources.append(src)

        scored = score_results(all_sources)
        distribution = get_freshness_distribution(scored)

        return {
            "results": scored,
            "distribution": distribution,
            "total": len(scored),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Intelligence] Freshness scoring failed: {e}")
        raise HTTPException(status_code=500, detail=f"Freshness scoring failed: {str(e)}")


@router.get("/competitors/{project_id}")
async def get_competitors(
    project_id: str,
    user: dict = Depends(get_current_user),
):
    """
    Identify and analyze competitors for a project.
    Uses Gemini + existing search results for context.
    """
    try:
        # Fetch project
        project = (
            supabase_admin.table("projects")
            .select("id, title, idea_text")
            .eq("id", project_id)
            .eq("user_id", user["id"])
            .single()
            .execute()
        )
        if not project.data:
            raise HTTPException(status_code=404, detail="Project not found")

        p = project.data
        competitors = await track_competitors(
            project_id=project_id,
            domain=p.get("title", ""),
            idea_text=p.get("idea_text", ""),
        )

        return {
            "project_id": project_id,
            "competitors": competitors,
            "count": len(competitors),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Intelligence] Competitive tracking failed: {e}")
        raise HTTPException(status_code=500, detail=f"Competitive analysis failed: {str(e)}")
