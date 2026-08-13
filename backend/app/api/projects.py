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
    ProjectMemberResponse,
    ProjectInvitationCreate,
    ProjectInvitationResponse,
    ActivityLogResponse
)
import secrets
from app.services.email_service import send_project_invitation
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

def log_activity(project_id: str, user_id: str, action: str, component: str, metadata: dict = None):
    try:
        supabase_admin.table("project_activity_logs").insert({
            "project_id": str(project_id),
            "user_id": str(user_id),
            "action": action,
            "component": component,
            "metadata": metadata or {}
        }).execute()
    except Exception as e:
        logger.error(f"Failed to log activity: {e}")



def get_dict_differences(old_val: any, new_val: any, path: str = "") -> list:
    changes = []
    if isinstance(old_val, dict) and isinstance(new_val, dict):
        for k in set(old_val.keys()).union(new_val.keys()):
            new_path = f"{path}.{k}" if path else k
            if k not in old_val:
                changes.append({"field": new_path, "type": "added", "new": new_val[k]})
            elif k not in new_val:
                changes.append({"field": new_path, "type": "removed", "old": old_val[k]})
            else:
                changes.extend(get_dict_differences(old_val[k], new_val[k], new_path))
    elif isinstance(old_val, list) and isinstance(new_val, list):
        if old_val != new_val:
             changes.append({"field": path, "type": "modified", "old": old_val, "new": new_val})
    else:
        if old_val != new_val:
            changes.append({"field": path, "type": "modified", "old": old_val, "new": new_val})
    return changes

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
        "status": "planning",
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
    is_pinned: Optional[bool] = Query(default=None),
):
    """List all projects for the current user with pagination."""
    # Get projects where user is owner
    query = supabase_admin.table("projects").select("*").eq("user_id", user["id"])
    if is_pinned is not None:
        query = query.eq("is_pinned", is_pinned)
    owner_projects = query.execute().data or []
    for p in owner_projects:
        p["role"] = "owner"
    
    # Get projects where user is a member
    member_res = supabase_admin.table("project_members").select("project_id, role").eq("user_id", user["id"]).execute()
    member_roles = {m["project_id"]: m["role"] for m in (member_res.data or [])}
    member_project_ids = list(member_roles.keys())
    
    member_projects = []
    if member_project_ids:
        query2 = supabase_admin.table("projects").select("*").in_("id", member_project_ids)
        if is_pinned is not None:
            query2 = query2.eq("is_pinned", is_pinned)
        member_projects = query2.execute().data or []
        for p in member_projects:
            p["role"] = member_roles.get(p["id"], "viewer")
        
    # Combine and deduplicate just in case
    all_projects = list({p["id"]: p for p in owner_projects + member_projects}.values())
    
    # Fetch user's project views for unread badges
    views_map = {}
    try:
        views_res = supabase_admin.table("project_user_views").select("project_id, last_viewed_at").eq("user_id", user["id"]).execute()
        views_map = {v["project_id"]: v["last_viewed_at"] for v in (views_res.data or [])}
    except Exception as e:
        logger.warning(f"Could not fetch project views: {e}")

    for p in all_projects:
        p["last_viewed_at"] = views_map.get(p["id"])
        if p.get("updated_at") and p.get("last_viewed_at"):
            p["has_unread_changes"] = p["updated_at"] > p["last_viewed_at"]
        elif p.get("updated_at") and not p.get("last_viewed_at"):
            p["has_unread_changes"] = True
    
    # Sort and paginate manually since we combined two lists
    sorted_projects = sorted(all_projects, key=lambda x: x.get("updated_at") or "", reverse=True)
    return sorted_projects[offset:offset+limit]


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    user: dict = Depends(get_current_user),
):
    """Get a single project by ID."""
    # 1. Check if owner
    result = supabase_admin.table("projects").select("*").eq("id", project_id).eq("user_id", user["id"]).limit(1).execute()
    if result.data:
        project_data = result.data[0]
        project_data["role"] = "owner"
        
        # Fetch last_viewed_at
        try:
            view_res = supabase_admin.table("project_user_views").select("last_viewed_at").eq("project_id", project_id).eq("user_id", user["id"]).execute()
            if view_res.data:
                project_data["last_viewed_at"] = view_res.data[0]["last_viewed_at"]
                if project_data.get("updated_at"):
                    project_data["has_unread_changes"] = project_data["updated_at"] > project_data["last_viewed_at"]
            else:
                project_data["has_unread_changes"] = True
        except Exception as e:
            logger.warning(f"Could not fetch view status: {e}")
            project_data["has_unread_changes"] = False
            
        return project_data
        
    # 2. Check if member
    member_res = supabase_admin.table("project_members").select("*").eq("project_id", project_id).eq("user_id", user["id"]).limit(1).execute()
    if member_res.data:
        # Fetch the project
        proj_res = supabase_admin.table("projects").select("*").eq("id", project_id).limit(1).execute()
        if proj_res.data:
            project_data = proj_res.data[0]
            project_data["role"] = member_res.data[0]["role"]
            
            # Fetch last_viewed_at
            try:
                view_res = supabase_admin.table("project_user_views").select("last_viewed_at").eq("project_id", project_id).eq("user_id", user["id"]).execute()
                if view_res.data:
                    project_data["last_viewed_at"] = view_res.data[0]["last_viewed_at"]
                    if project_data.get("updated_at"):
                        project_data["has_unread_changes"] = project_data["updated_at"] > project_data["last_viewed_at"]
                else:
                    project_data["has_unread_changes"] = True
            except Exception as e:
                logger.warning(f"Could not fetch view status: {e}")
                project_data["has_unread_changes"] = False
                
            return project_data
            
    raise HTTPException(status_code=404, detail="Project not found or you don't have access")


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

    # 1. Fetch current project to check access and compute diff
    result = supabase_admin.table("projects").select("*").eq("id", project_id).limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Project not found")
        
    current_project = result.data[0]
    
    # 2. Check access
    has_access = False
    if current_project["user_id"] == user["id"]:
        has_access = True
    else:
        member_res = supabase_admin.table("project_members").select("role").eq("project_id", project_id).eq("user_id", user["id"]).limit(1).execute()
        if member_res.data and member_res.data[0]["role"] == "editor":
            has_access = True
            
    if not has_access:
        raise HTTPException(status_code=403, detail="You do not have permission to update this project")

    # 3. Compute diff
    diff_changes = []
    for key, new_val in update_data.items():
        if key == "updated_at":
            continue
        old_val = current_project.get(key)
        diff_changes.extend(get_dict_differences(old_val, new_val, path=key))
        
    metadata = {"changes": diff_changes} if diff_changes else {}

    supabase_admin.table("projects").update(update_data).eq("id", project_id).execute()
    
    # Log Activity
    if "project_plan" in update_data:
        log_activity(project_id, user["id"], "updated", "Project Plan", metadata)
    elif "architecture" in update_data:
        log_activity(project_id, user["id"], "updated", "System Architecture", metadata)
    elif "timeline" in update_data:
        log_activity(project_id, user["id"], "updated", "Development Roadmap", metadata)
    elif "status" in update_data:
        log_activity(project_id, user["id"], "updated", f"Status to {update_data['status']}", metadata)
    else:
        log_activity(project_id, user["id"], "updated", "Project Details", metadata)

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

        log_activity(project_id, user["id"], "regenerated", "Full Project Plan")

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
    target_phase: str = Query("full"),
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
                    target_phase=target_phase,
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


# ============================================
# Phase 4 — Team Collaboration & Members
# ============================================

@router.get("/{project_id}/members", response_model=dict)
async def list_members_and_invites(
    project_id: str,
    user: dict = Depends(get_current_user),
):
    """
    List all active members and pending invitations for a project.
    Only accessible by the project owner (or existing members, based on RLS).
    """
    # 1. Fetch active members
    members_res = (
        supabase_admin.table("project_members")
        .select("*, profiles(full_name, avatar_url)")
        .eq("project_id", project_id)
        .execute()
    )
    
    # Also fetch the owner as an implicit member
    project = (
        supabase_admin.table("projects")
        .select("user_id, profiles(full_name, avatar_url)")
        .eq("id", project_id)
        .single()
        .execute()
    )
    
    # 2. Fetch pending invites
    invites_res = (
        supabase_admin.table("project_invitations")
        .select("*")
        .eq("project_id", project_id)
        .eq("status", "pending")
        .execute()
    )
    
    members = []
    if project.data:
        owner_profile = project.data.get("profiles", {}) or {}
        members.append({
            "id": project.data["user_id"],
            "project_id": project_id,
            "user_id": project.data["user_id"],
            "role": "owner",
            "created_at": "",
            "user_email": None,
            "user_full_name": owner_profile.get("full_name"),
            "user_avatar": owner_profile.get("avatar_url")
        })

    for m in members_res.data or []:
        prof = m.get("profiles", {}) or {}
        members.append({
            "id": m["id"],
            "project_id": m["project_id"],
            "user_id": m["user_id"],
            "role": m["role"],
            "created_at": m["created_at"],
            "user_full_name": prof.get("full_name"),
            "user_avatar": prof.get("avatar_url")
        })
        
    return {
        "members": members,
        "invitations": invites_res.data or []
    }


@router.post("/{project_id}/invitations", response_model=ProjectInvitationResponse)
async def create_invitation(
    project_id: str,
    invite: ProjectInvitationCreate,
    user: dict = Depends(get_current_user),
):
    """
    Invite a user via email to collaborate on the project.
    Generates a magic link and prints it using the Mock Email Service.
    """
    # Verify ownership
    project_res = (
        supabase_admin.table("projects")
        .select("title")
        .eq("id", project_id)
        .eq("user_id", user["id"])
        .execute()
    )
    if not project_res.data:
        raise HTTPException(status_code=403, detail="Only the project owner can send invites.")

    project_title = project_res.data[0]["title"]
    token = secrets.token_urlsafe(32)
    
    # Save invite to database
    invite_data = {
        "project_id": project_id,
        "email": invite.email.lower(),
        "role": invite.role,
        "token": token
    }
    
    result = supabase_admin.table("project_invitations").insert(invite_data).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create invitation.")
        
    saved_invite = result.data[0]
    
    # Generate the frontend magic link URL
    # E.g. http://localhost:5173/invite/{token}
    # In production, this would use a settings.FRONTEND_URL
    invite_url = f"http://localhost:5173/invite/{token}"
    
    # Fetch inviter profile
    inviter_res = supabase_admin.table("profiles").select("full_name").eq("id", user["id"]).single().execute()
    inviter_name = inviter_res.data.get("full_name") if inviter_res.data else "A teammate"
    
    # Trigger Mock Email Service
    await send_project_invitation(
        to_email=invite.email,
        inviter_name=inviter_name,
        project_title=project_title,
        role=invite.role,
        invite_url=invite_url
    )
    
    return saved_invite


@router.delete("/{project_id}/members/{user_id}", response_model=MessageResponse)
async def remove_member(
    project_id: str,
    user_id: str,
    user: dict = Depends(get_current_user),
):
    """
    Remove a member from the project.
    Only accessible by the project owner.
    """
    # Verify ownership
    project_res = (
        supabase_admin.table("projects")
        .select("id")
        .eq("id", project_id)
        .eq("user_id", user["id"])
        .execute()
    )
    if not project_res.data:
        raise HTTPException(status_code=403, detail="Only the project owner can remove members.")
        
    supabase_admin.table("project_members").delete().eq("project_id", project_id).eq("user_id", user_id).execute()
    return MessageResponse(message="Member removed successfully.")


@router.post("/{project_id}/view", response_model=MessageResponse)
async def mark_project_viewed(
    project_id: str,
    user: dict = Depends(get_current_user),
):
    """Mark a project as viewed by the user to clear unread badges."""
    # Supabase upsert requires id or unique constraint match. We'll try to find it first.
    res = supabase_admin.table("project_user_views").select("id").eq("project_id", project_id).eq("user_id", user["id"]).execute()
    if res.data:
        supabase_admin.table("project_user_views").update({"last_viewed_at": "now()"}).eq("id", res.data[0]["id"]).execute()
    else:
        supabase_admin.table("project_user_views").insert({
            "project_id": project_id,
            "user_id": user["id"]
        }).execute()
        
    return MessageResponse(message="Project marked as viewed")


@router.get("/{project_id}/activity", response_model=list[ActivityLogResponse])
async def get_project_activity(
    project_id: str,
    user: dict = Depends(get_current_user),
):
    """Fetch the chronological activity feed for a project."""
    # 1. Check access
    res = supabase_admin.table("projects").select("id").eq("id", project_id).eq("user_id", user["id"]).execute()
    has_access = bool(res.data)
    if not has_access:
        member_res = supabase_admin.table("project_members").select("role").eq("project_id", project_id).eq("user_id", user["id"]).execute()
        if member_res.data:
            has_access = True
            
    if not has_access:
        raise HTTPException(status_code=403, detail="Not authorized to view activity")
        
    # 2. Fetch logs
    logs_res = (
        supabase_admin.table("project_activity_logs")
        .select("*")
        .eq("project_id", project_id)
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )
    
    logs = logs_res.data or []
    if not logs:
        return []
        
    # 3. Enrich with user profile data
    user_ids = list(set([log["user_id"] for log in logs]))
    profiles_res = supabase_admin.table("profiles").select("id, full_name, avatar_url").in_("id", user_ids).execute()
    profile_map = {p["id"]: p for p in (profiles_res.data or [])}
    
    enriched_logs = []
    for log in logs:
        p = profile_map.get(log["user_id"], {})
        enriched_logs.append({
            **log,
            "user_full_name": p.get("full_name") or "Unknown User",
            "user_avatar": p.get("avatar_url")
        })
        
    return enriched_logs


@router.delete("/{project_id}/activity", response_model=MessageResponse)
async def clear_project_activity(
    project_id: str,
    user: dict = Depends(get_current_user),
):
    """Clear all activity logs for a project (Owner only)."""
    # Verify ownership
    project_res = (
        supabase_admin.table("projects")
        .select("id")
        .eq("id", project_id)
        .eq("user_id", user["id"])
        .execute()
    )
    if not project_res.data:
        raise HTTPException(status_code=403, detail="Only the project owner can clear activity logs.")
        
    supabase_admin.table("project_activity_logs").delete().eq("project_id", project_id).execute()
    return MessageResponse(message="Activity logs cleared successfully.")
