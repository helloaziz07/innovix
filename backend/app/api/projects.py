"""
Innovix API — Project HUB Routes

Endpoints for project CRUD, AI plan generation, export, and TTS narration.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response

from app.core.security import get_current_user
from app.core.database import supabase_admin
from app.models.schemas import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    MessageResponse,
)
from app.services.project_hub.generator import generate_project_plan
from app.services.project_hub.export_service import (
    export_to_markdown,
    export_to_pdf,
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
async def list_projects(user: dict = Depends(get_current_user)):
    """List all projects for the current user."""
    result = (
        supabase_admin.table("projects")
        .select("*")
        .eq("user_id", user["id"])
        .order("updated_at", desc=True)
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


@router.get("/{project_id}/export")
async def export_project(
    project_id: str,
    user: dict = Depends(get_current_user),
    format: str = Query(default="md", regex="^(md|pdf)$"),
):
    """
    Export project plan as Markdown or PDF.

    Query params:
        format: "md" (default) or "pdf"
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
