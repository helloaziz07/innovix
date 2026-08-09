"""
Innovix API — Project HUB Routes

Endpoints for project CRUD, AI plan generation, export, and TTS narration.
"""

import asyncio
import json
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import Response, StreamingResponse

from app.core.security import get_current_user
from app.core.database import supabase_admin
from app.models.schemas import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    MessageResponse,
)
from app.services.project_hub.generator import generate_project_plan, GenerationCancelled
from app.services.project_hub.export_service import (
    export_to_markdown,
    export_to_pdf,
    export_to_pptx,
    get_narration_text,
)
from app.services.sarvam.tts_service import synthesize_speech, is_available as sarvam_available

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/projects", tags=["Project HUB"])


@router.post("/", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project: ProjectCreate,
    user: dict = Depends(get_current_user),
):
    """Create a new project from an idea."""
    project_data = {
        "user_id": user["id"],
        "title": project.title,
        "idea_text": project.idea_text,
        "status": "ideation",
    }
    result = supabase_admin.table("projects").insert(project_data).execute()
    return MessageResponse(
        message="Project created successfully",
        data=result.data[0],
    )


@router.get("/", response_model=list[ProjectResponse])
async def list_projects(
    user: dict = Depends(get_current_user),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    """List all projects for the current user with pagination."""
    result = (
        supabase_admin.table("projects")
        .select("*")
        .eq("user_id", user["id"])
        .order("updated_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return result.data


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    user: dict = Depends(get_current_user),
):
    """Get a single project by ID."""
    result = (
        supabase_admin.table("projects")
        .select("*")
        .eq("id", project_id)
        .eq("user_id", user["id"])
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Project not found")
    return result.data


@router.patch("/{project_id}", response_model=MessageResponse)
async def update_project(
    project_id: str,
    updates: ProjectUpdate,
    user: dict = Depends(get_current_user),
):
    """Update project details."""
    update_data = updates.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    supabase_admin.table("projects").update(update_data).eq(
        "id", project_id
    ).eq("user_id", user["id"]).execute()

    return MessageResponse(message="Project updated successfully")


@router.delete("/{project_id}", response_model=MessageResponse)
async def delete_project(
    project_id: str,
    user: dict = Depends(get_current_user),
):
    """Delete a project."""
    supabase_admin.table("projects").delete().eq(
        "id", project_id
    ).eq("user_id", user["id"]).execute()

    return MessageResponse(message="Project deleted successfully")


@router.get("/{project_id}/suggest-links")
async def suggest_search_links(
    project_id: str,
    user: dict = Depends(get_current_user),
):
    """
    Suggest standalone searches that might be related to this project.
    Uses simple keyword overlap between the project's idea_text and search queries.
    """
    # Get the project's idea text
    project = (
        supabase_admin.table("projects")
        .select("idea_text")
        .eq("id", project_id)
        .eq("user_id", user["id"])
        .single()
        .execute()
    )
    if not project.data:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get all standalone searches for this user
    searches = (
        supabase_admin.table("search_results")
        .select("id, query, created_at, source")
        .eq("user_id", user["id"])
        .is_("project_id", "null")
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )

    if not searches.data:
        return {"suggestions": []}

    # Simple keyword matching: find searches with 2+ common words
    idea_words = set(
        w.lower().strip(".,!?\"'()[]{}") for w in project.data["idea_text"].split()
        if len(w) > 3  # Skip short words (a, an, the, for, etc.)
    )

    suggestions = []
    for search in searches.data:
        query_words = set(
            w.lower().strip(".,!?\"'()[]{}") for w in search["query"].split()
            if len(w) > 3
        )
        overlap = len(idea_words & query_words)
        if overlap >= 2:
            suggestions.append({**search, "relevance": overlap})

    # Sort by relevance (most overlap first)
    suggestions.sort(key=lambda x: x["relevance"], reverse=True)

    return {"suggestions": suggestions[:10]}


# ============================================
# Phase 3 — Plan Generation, Export, Narration
# ============================================


@router.post("/{project_id}/generate-plan", response_model=MessageResponse)
async def generate_plan(
    project_id: str,
    user: dict = Depends(get_current_user),
):
    """
    Generate a complete AI-powered project plan.

    Chains three Gemini calls to produce:
    - Problem validation, existing solutions, innovation opportunities
    - System architecture with Mermaid diagram
    - Development roadmap with weekly timeline

    The plan is persisted in the project's JSONB columns and the
    project status progresses through researching → planning.
    """
    try:
        plan = await generate_project_plan(
            project_id=project_id,
            user_id=user["id"],
        )

        if plan.get("error"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=plan["error"],
            )

        return MessageResponse(
            message="Project plan generated successfully",
            data=plan,
        )

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"[ProjectHub] Plan generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Plan generation failed: {str(e)}",
        )


@router.post("/{project_id}/generate-plan-stream")
async def generate_plan_stream(
    project_id: str,
    request: Request,
    user: dict = Depends(get_current_user),
):
    """
    Generate a project plan with real-time SSE progress streaming.

    Returns a text/event-stream response. Each event is a JSON object:
        {"stage": "...", "message": "...", "progress": 0-100}

    Supports cancellation: if the client disconnects, the generation
    is aborted between stages.
    """
    cancel_event = asyncio.Event()

    async def event_generator():
        queue: asyncio.Queue = asyncio.Queue()

        async def progress_callback(event: dict):
            await queue.put(event)

        async def run_generation():
            try:
                plan = await generate_project_plan(
                    project_id=project_id,
                    user_id=user["id"],
                    progress_callback=progress_callback,
                    cancel_event=cancel_event,
                )
                if plan.get("error"):
                    await queue.put({"stage": "error", "message": plan["error"], "progress": 0})
                # Signal that generation is done
                await queue.put(None)
            except GenerationCancelled:
                await queue.put({"stage": "cancelled", "message": "Generation cancelled.", "progress": 0})
                await queue.put(None)
            except ValueError as e:
                await queue.put({"stage": "error", "message": str(e), "progress": 0})
                await queue.put(None)
            except Exception as e:
                logger.error(f"[ProjectHub] SSE generation failed: {e}")
                await queue.put({"stage": "error", "message": f"Plan generation failed: {str(e)}", "progress": 0})
                await queue.put(None)

        # Start generation in a background task
        gen_task = asyncio.create_task(run_generation())

        try:
            while True:
                # Check if the client disconnected
                if await request.is_disconnected():
                    cancel_event.set()
                    break

                try:
                    event = await asyncio.wait_for(queue.get(), timeout=1.0)
                except asyncio.TimeoutError:
                    # Send a keep-alive comment to prevent connection timeout
                    yield ": keep-alive\n\n"
                    continue

                if event is None:
                    # Generation finished
                    break

                yield f"data: {json.dumps(event)}\n\n"

                if event.get("stage") in ("complete", "error", "cancelled"):
                    break
        finally:
            if not gen_task.done():
                cancel_event.set()
                # Give the task a moment to clean up
                try:
                    await asyncio.wait_for(gen_task, timeout=5.0)
                except (asyncio.TimeoutError, Exception):
                    gen_task.cancel()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/{project_id}/export")
async def export_project(
    project_id: str,
    user: dict = Depends(get_current_user),
    format: str = Query(default="md", regex="^(md|pdf|pptx)$"),
):
    """
    Export project plan as Markdown, PDF, or PPTX.

    Query params:
        format: "md" (default), "pdf", or "pptx"
    """
    # Fetch the full project
    result = (
        supabase_admin.table("projects")
        .select("*")
        .eq("id", project_id)
        .eq("user_id", user["id"])
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Project not found")

    project = result.data

    if not project.get("project_plan"):
        raise HTTPException(
            status_code=400,
            detail="No plan generated yet. Run /generate-plan first.",
        )

    if format == "pdf":
        try:
            pdf_bytes = export_to_pdf(project)
            filename = f"{project.get('title', 'project').replace(' ', '_')}_plan.pdf"
            return Response(
                content=pdf_bytes,
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f'attachment; filename="{filename}"',
                },
            )
        except Exception as e:
            logger.error(f"[Export] PDF generation failed: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"PDF export failed: {str(e)}. Try markdown format instead.",
            )
    elif format == "pptx":
        try:
            pptx_bytes = await export_to_pptx(project)
            filename = f"{project.get('title', 'project').replace(' ', '_')}_plan.pptx"
            return Response(
                content=pptx_bytes,
                media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
                headers={
                    "Content-Disposition": f'attachment; filename="{filename}"',
                },
            )
        except Exception as e:
            logger.error(f"[Export] PPTX generation failed: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"PPTX export failed: {str(e)}. Try markdown format instead.",
            )
    else:
        md_content = export_to_markdown(project)
        filename = f"{project.get('title', 'project').replace(' ', '_')}_plan.md"
        return Response(
            content=md_content,
            media_type="text/markdown",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
            },
        )

@router.post("/{project_id}/narrate")
async def narrate_project(
    project_id: str,
    user: dict = Depends(get_current_user),
    language: str = Query(default="en", description="Language code (en, hi, ta, te, etc.)"),
):
    """
    Generate TTS audio narration of the project plan using Sarvam AI.

    Returns WAV audio bytes. Requires SARVAM_API_KEY to be configured.
    Gracefully returns an error message if Sarvam is not available.
    """
    if not sarvam_available():
        raise HTTPException(
            status_code=501,
            detail="Sarvam AI TTS is not configured. Set SARVAM_API_KEY to enable narration.",
        )

    # Fetch project
    result = (
        supabase_admin.table("projects")
        .select("*")
        .eq("id", project_id)
        .eq("user_id", user["id"])
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Project not found")

    project = result.data
    if not project.get("project_plan"):
        raise HTTPException(status_code=400, detail="No plan generated yet.")

    # Get narration text
    narration_text = get_narration_text(project)

    # Synthesize speech
    audio_bytes = await synthesize_speech(narration_text, language=language)

    if not audio_bytes:
        raise HTTPException(
            status_code=500,
            detail="Speech synthesis failed. Check Sarvam API key and try again.",
        )

    filename = f"{project.get('title', 'project').replace(' ', '_')}_narration.wav"
    return Response(
        content=audio_bytes,
        media_type="audio/wav",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )
