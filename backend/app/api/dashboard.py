"""
Innovix API — Dashboard Routes

Aggregated dashboard data for the personalized homepage.
Full implementation in Phase 5.
"""

from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.core.database import supabase_admin
from app.models.schemas import DashboardResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/", response_model=DashboardResponse)
async def get_dashboard(user: dict = Depends(get_current_user)):
    """
    Get aggregated dashboard data for the current user.
    Combines project stats, recent activity, and AI recommendations.
    """
    try:
        # Get project counts
        projects_result = (
            supabase_admin.table("projects")
            .select("id, status")
            .eq("user_id", user["id"])
            .execute()
        )
        projects = projects_result.data or []

        # Count by status
        status_counts = {}
        for p in projects:
            s = p.get("status", "ideation")
            status_counts[s] = status_counts.get(s, 0) + 1

        return DashboardResponse(
            total_projects=len(projects),
            projects_by_status=status_counts,
            recent_searches=[],
            recommendations=[
                "Start your first DeepSearch to discover research opportunities",
                "Create a project to organize your ideas",
            ],
            trending_topics=[],
        )
    except Exception:
        # Return empty dashboard if DB isn't set up yet
        return DashboardResponse(
            recommendations=[
                "Welcome to Innovix! Set up your Supabase project to get started.",
            ]
        )
