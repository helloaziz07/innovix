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

    Client sends a JSON message to start the search:
        {"query": "...", "project_id": "...", "sources": ["arxiv", "github", ...]}

    Server streams progress events:
        {"event": "step", "step": "searching", "message": "..."}
        {"event": "source_found", "source": "arxiv", "count": 10}
        {"event": "summary_complete", "summary_length": 1500}
        {"event": "result", "data": { ...full DeepSearchResponse... }}
        {"event": "error", "message": "..."}
    """
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
            user_id=None,  # WebSocket auth can be added later
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
                "message": str(e),
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
    limit: int = Query(default=10, ge=1, le=50),
):
    """
    Get the user's recent search history across all projects.
    """
    try:
        # Get user's project IDs first
        projects = (
            supabase_admin.table("projects")
            .select("id")
            .eq("user_id", user["id"])
            .execute()
        )
        project_ids = [p["id"] for p in projects.data]

        if not project_ids:
            return {"results": []}

        result = (
            supabase_admin.table("search_results")
            .select("id, query, created_at, project_id")
            .in_("project_id", project_ids)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return {"results": result.data}
    except Exception as e:
        logger.error(f"[DeepSearch] Failed to fetch history: {e}")
        return {"results": []}
