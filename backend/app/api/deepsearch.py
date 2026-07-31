"""
Innovix API — DeepSearch Routes

Endpoints for AI-powered multi-source research.
Supports both REST (synchronous) and WebSocket (streaming) modes.
"""

import json
import logging
import asyncio
from typing import Optional

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query
from app.core.security import get_current_user
from app.core.database import supabase_admin
from app.models.schemas import (
    DeepSearchRequest,
    DeepSearchResponse,
    MessageResponse,
)
from app.services.search.deep_search import run_deep_search

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/deepsearch", tags=["DeepSearch"])


@router.post("/", response_model=DeepSearchResponse)
async def start_deep_search(
    request: DeepSearchRequest,
    user: dict = Depends(get_current_user),
):
    """
    Run a full DeepSearch across all configured sources.

    Returns the complete result with sources, AI summary, citations, and gap analysis.
    For real-time streaming, use the WebSocket endpoint instead.
    """
    result = await run_deep_search(
        query=request.query,
        project_id=str(request.project_id) if request.project_id else None,
        sources_to_search=request.sources,
        user_id=user["id"],
    )
    return result


@router.websocket("/stream")
async def stream_deep_search(websocket: WebSocket):
    """
    WebSocket endpoint for streaming DeepSearch progress in real-time.

    Authentication: Pass JWT token as query param: /api/deepsearch/stream?token=xxx

    Client sends a JSON message to start the search:
        {"query": "...", "project_id": "...", "sources": ["arxiv", "github", ...]}

    Server streams progress events:
        {"event": "step", "step": "searching", "message": "..."}
        {"event": "source_found", "source": "arxiv", "count": 10}
        {"event": "summary_complete", "summary_length": 1500}
        {"event": "result", "data": { ...full DeepSearchResponse... }}
        {"event": "error", "message": "..."}
    """
    # Authenticate via query param token
    token = websocket.query_params.get("token")
    user_id = None
    if token:
        try:
            from app.core.database import get_supabase_client
            _client = get_supabase_client()
            user_response = _client.auth.get_user(token)
            if user_response and user_response.user:
                user_id = str(user_response.user.id)
        except Exception:
            pass

    await websocket.accept()

    try:
        # Receive the search request
        data = await websocket.receive_json()
        query = data.get("query", "")
        project_id = data.get("project_id")
        sources = data.get("sources", ["arxiv", "github", "scholar", "web"])

        if not query or len(query) < 5:
            await websocket.send_json({
                "event": "error",
                "message": "Query must be at least 5 characters long.",
            })
            await websocket.close()
            return

        # Progress callback — sends events to the WebSocket
        async def send_progress(event: dict):
            try:
                await websocket.send_json(event)
            except Exception:
                pass  # Client may have disconnected

        # Run the full search with streaming progress
        result = await run_deep_search(
            query=query,
            project_id=project_id,
            sources_to_search=sources,
            user_id=user_id,
            progress_callback=send_progress,
        )

        # Send the complete result
        await websocket.send_json({
            "event": "result",
            "data": json.loads(result.model_dump_json()),
        })

    except WebSocketDisconnect:
        logger.info("[DeepSearch WS] Client disconnected")
    except Exception as e:
        logger.error(f"[DeepSearch WS] Error: {e}")
        try:
            await websocket.send_json({
                "event": "error",
                "message": "An error occurred during search. Please try again.",
            })
        except Exception:
            pass
    finally:
        try:
            await websocket.close()
        except Exception:
            pass


@router.get("/results/{project_id}")
async def get_search_results(
    project_id: str,
    user: dict = Depends(get_current_user),
    limit: int = Query(default=20, ge=1, le=100),
):
    """
    Get all saved search results for a project.

    Returns results ordered by creation date (newest first).
    """
    try:
        result = (
            supabase_admin.table("search_results")
            .select("*")
            .eq("project_id", project_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return {"project_id": project_id, "results": result.data}
    except Exception as e:
        logger.error(f"[DeepSearch] Failed to fetch results: {e}")
        return {"project_id": project_id, "results": [], "error": str(e)}


@router.get("/history")
async def get_search_history(
    user: dict = Depends(get_current_user),
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
):
    """
    Get the user's recent search history across all projects AND standalone searches.
    """
    try:
        result = (
            supabase_admin.table("search_results")
            .select("id, query, created_at, project_id, source")
            .eq("user_id", user["id"])
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return {"results": result.data}
    except Exception as e:
        logger.error(f"[DeepSearch] Failed to fetch history: {e}")
        return {"results": []}


@router.get("/standalone")
async def get_standalone_searches(
    user: dict = Depends(get_current_user),
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
):
    """
    Get all standalone (unlinked) search results for the current user.
    These are searches done without a project context.
    """
    try:
        result = (
            supabase_admin.table("search_results")
            .select("*")
            .eq("user_id", user["id"])
            .is_("project_id", "null")
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return {"results": result.data}
    except Exception as e:
        logger.error(f"[DeepSearch] Failed to fetch standalone searches: {e}")
        return {"results": []}


@router.get("/by-project/{project_id}")
async def get_project_searches(
    project_id: str,
    user: dict = Depends(get_current_user),
):
    """
    Get all search results linked to a specific project.
    Used by the Project Detail 'Research' tab.
    """
    try:
        # Verify project belongs to user
        project = (
            supabase_admin.table("projects")
            .select("id")
            .eq("id", project_id)
            .eq("user_id", user["id"])
            .single()
            .execute()
        )
        if not project.data:
            return {"results": []}

        result = (
            supabase_admin.table("search_results")
            .select("*")
            .eq("project_id", project_id)
            .order("created_at", desc=True)
            .execute()
        )
        return {"results": result.data}
    except Exception as e:
        logger.error(f"[DeepSearch] Failed to fetch project searches: {e}")
        return {"results": []}


@router.patch("/{search_id}/link", response_model=MessageResponse)
async def link_search_to_project(
    search_id: str,
    body: dict,
    user: dict = Depends(get_current_user),
):
    """
    Link a standalone search result to a project.
    Updates the search_results row to set the project_id.
    """
    from fastapi import HTTPException, status

    project_id = body.get("project_id")
    if not project_id:
        raise HTTPException(status_code=400, detail="project_id is required")

    # Verify project belongs to user
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

    # Verify search result belongs to user
    search = (
        supabase_admin.table("search_results")
        .select("id")
        .eq("id", search_id)
        .eq("user_id", user["id"])
        .single()
        .execute()
    )
    if not search.data:
        raise HTTPException(status_code=404, detail="Search result not found")

    # Update the search result to link it to the project
    supabase_admin.table("search_results").update(
        {"project_id": project_id}
    ).eq("id", search_id).execute()

    return MessageResponse(message="Search linked to project successfully")

