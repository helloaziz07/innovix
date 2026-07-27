"""
Innovix API — DeepSearch Routes

Endpoints for AI-powered multi-source research.
Full implementation in Phase 2.
"""

from fastapi import APIRouter, Depends, WebSocket
from app.core.security import get_current_user
from app.models.schemas import DeepSearchRequest, DeepSearchResponse, MessageResponse

router = APIRouter(prefix="/deepsearch", tags=["DeepSearch"])


@router.post("/", response_model=MessageResponse)
async def start_deep_search(
    request: DeepSearchRequest,
    user: dict = Depends(get_current_user),
):
    """
    Start a deep search across multiple sources.
    Returns a job ID for streaming results.

    [Phase 2 Implementation]
    """
    return MessageResponse(
        message="DeepSearch endpoint ready — full implementation in Phase 2",
        data={"query": request.query, "sources": request.sources},
    )


@router.get("/results/{project_id}")
async def get_search_results(
    project_id: str,
    user: dict = Depends(get_current_user),
):
    """
    Get all search results for a project.

    [Phase 2 Implementation]
    """
    return {"project_id": project_id, "results": [], "message": "Phase 2"}
