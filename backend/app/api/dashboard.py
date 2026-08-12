"""
Innovix API — Dashboard Routes

Aggregated dashboard data with live stats from all modules:
projects, searches, workspaces, and AI-generated recommendations.
"""

import logging
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.core.database import supabase_admin
from app.models.schemas import DashboardResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/", response_model=DashboardResponse)
async def get_dashboard(user: dict = Depends(get_current_user)):
    """
    Get aggregated dashboard data for the current user.
    Combines project stats, recent searches, workspace activity,
    and AI-generated recommendations.
    """
    try:
        user_id = user["id"]

        # ---- Projects ----
        projects_result = (
            supabase_admin.table("projects")
            .select("id, title, status, updated_at")
            .eq("user_id", user_id)
            .order("updated_at", desc=True)
            .execute()
        )
        projects = projects_result.data or []

        status_counts = {}
        for p in projects:
            s = p.get("status", "planning")
            status_counts[s] = status_counts.get(s, 0) + 1

        # ---- Recent searches ----
        recent_searches = []
        try:
            # search_results doesn't have user_id — filter by the user's project IDs
            project_ids = [p.get("id") for p in projects if p.get("id")]
            if project_ids:
                searches_result = (
                    supabase_admin.table("search_results")
                    .select("id, query, created_at, project_id, sources")
                    .in_("project_id", project_ids)
                    .order("created_at", desc=True)
                    .limit(10)
                    .execute()
                )
                for s in (searches_result.data or []):
                    sources = s.get("sources", [])
                    source_count = len(sources) if isinstance(sources, list) else 0
                    recent_searches.append({
                        "id": s.get("id"),
                        "query": s.get("query", ""),
                        "created_at": s.get("created_at", ""),
                        "project_id": s.get("project_id"),
                        "source_count": source_count,
                    })
        except Exception as e:
            logger.warning(f"[Dashboard] Searches fetch failed: {e}")

        # ---- Trending topics (cached or lightweight) ----
        trending = []
        try:
            # Use the most recent project's domain as trending context
            if projects:
                latest_title = projects[0].get("title", "")
                trending = [
                    {"topic": latest_title, "type": "your_project"},
                ]
        except Exception:
            pass

        # ---- Build recommendations ----
        recommendations = _build_recommendations(
            total_projects=len(projects),
            total_searches=len(recent_searches),
            status_counts=status_counts,
        )

        # ---- Recent projects (top 4 for quick access) ----
        recent_projects_list = []
        for p in projects[:4]:
            recent_projects_list.append({
                "id": p.get("id"),
                "title": p.get("title", ""),
                "status": p.get("status", "planning"),
            })

        return DashboardResponse(
            total_projects=len(projects),
            projects_by_status=status_counts,
            recent_projects=recent_projects_list,
            recent_searches=recent_searches,
            recommendations=recommendations,
            trending_topics=trending,
        )

    except Exception as e:
        logger.error(f"[Dashboard] Failed: {e}")
        return DashboardResponse(
            recommendations=[
                "Welcome to Innovix! Create your first project to get started.",
            ]
        )


@router.get("/activity")
async def get_activity_feed(user: dict = Depends(get_current_user)):
    """
    Get recent activity feed: project updates, searches, workspace changes.
    """
    try:
        user_id = user["id"]
        activities = []

        # Recent project updates
        try:
            projects = (
                supabase_admin.table("projects")
                .select("id, title, status, updated_at, created_at")
                .eq("user_id", user_id)
                .order("updated_at", desc=True)
                .limit(5)
                .execute()
            )
            for p in (projects.data or []):
                activities.append({
                    "type": "project",
                    "action": "updated" if p["updated_at"] != p.get("created_at") else "created",
                    "title": p.get("title", ""),
                    "entity_id": p.get("id"),
                    "timestamp": p.get("updated_at"),
                    "status": p.get("status"),
                })
        except Exception:
            pass

        # Recent searches
        try:
            searches = (
                supabase_admin.table("search_results")
                .select("id, query, created_at, project_id")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .limit(5)
                .execute()
            )
            for s in (searches.data or []):
                activities.append({
                    "type": "search",
                    "action": "completed",
                    "title": s.get("query", ""),
                    "entity_id": s.get("id"),
                    "timestamp": s.get("created_at"),
                    "project_id": s.get("project_id"),
                })
        except Exception:
            pass

        # Sort by timestamp
        activities.sort(
            key=lambda a: a.get("timestamp", ""),
            reverse=True,
        )

        return {"activities": activities[:15]}

    except Exception as e:
        logger.error(f"[Dashboard] Activity feed failed: {e}")
        return {"activities": []}


def _build_recommendations(
    total_projects: int,
    total_searches: int,
    status_counts: dict,
) -> list:
    """Generate contextual recommendations based on user's activity."""
    recs = []

    if total_projects == 0:
        recs.append("🚀 Create your first project to start organizing your research ideas")
        recs.append("🔍 Try a DeepSearch to explore any research topic across multiple sources")
    elif total_searches == 0:
        recs.append("🔍 Run your first DeepSearch to discover papers, repos, and articles")
    else:
        if status_counts.get("planning", 0) > 0:
            recs.append("💡 You have projects in planning — generate a plan to move them forward")
        if status_counts.get("planning", 0) > 0:
            recs.append("📋 Review your project plans and export them as PDF")

    recs.append("🌐 Check Web Intelligence for trending topics in your research domain")
    recs.append("🧠 Generate Knowledge Clusters to find hidden connections in your research")

    if total_projects > 1:
        recs.append("📊 Use the comparison table in Project HUB to evaluate tech stacks")

    return recs[:5]
