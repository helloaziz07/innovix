"""
Innovix API — Research Workspace Routes

Full CRUD for workspaces, notes, annotations, and saved search results.
Workspaces are per-project research spaces where users organize their findings.
"""

import logging
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security import get_current_user
from app.core.database import supabase_admin
from app.models.schemas import WorkspaceCreate, NoteCreate, MessageResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/workspaces", tags=["Research Workspaces"])


# ============================================
# Workspace CRUD
# ============================================

@router.post("/")
async def create_workspace(
    workspace: WorkspaceCreate,
    user: dict = Depends(get_current_user),
):
    """Create a new research workspace for a project."""
    try:
        # Verify project ownership
        project = (
            supabase_admin.table("projects")
            .select("id")
            .eq("id", str(workspace.project_id))
            .eq("user_id", user["id"])
            .single()
            .execute()
        )
        if not project.data:
            raise HTTPException(status_code=404, detail="Project not found")

        workspace_data = {
            "id": str(uuid4()),
            "project_id": str(workspace.project_id),
            "user_id": user["id"],
            "name": workspace.name,
            "notes": [],
            "saved_results": [],
            "annotations": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        result = (
            supabase_admin.table("workspaces")
            .insert(workspace_data)
            .execute()
        )

        return {
            "message": "Workspace created",
            "workspace": result.data[0] if result.data else workspace_data,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Workspaces] Create failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create workspace: {str(e)}")


@router.get("/project/{project_id}")
async def list_workspaces(
    project_id: str,
    user: dict = Depends(get_current_user),
):
    """List all workspaces for a project."""
    try:
        result = (
            supabase_admin.table("workspaces")
            .select("*")
            .eq("project_id", project_id)
            .eq("user_id", user["id"])
            .order("created_at", desc=True)
            .execute()
        )
        return {"workspaces": result.data or [], "count": len(result.data or [])}

    except Exception as e:
        logger.error(f"[Workspaces] List failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{workspace_id}")
async def get_workspace(
    workspace_id: str,
    user: dict = Depends(get_current_user),
):
    """Get a single workspace with all notes, saved results, and annotations."""
    try:
        result = (
            supabase_admin.table("workspaces")
            .select("*")
            .eq("id", workspace_id)
            .eq("user_id", user["id"])
            .single()
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Workspace not found")

        workspace = result.data

        # Fetch saved search results details
        saved_ids = workspace.get("saved_results", [])
        saved_details = []
        if saved_ids:
            try:
                sr = (
                    supabase_admin.table("search_results")
                    .select("id, query, summary, sources, created_at")
                    .in_("id", saved_ids)
                    .execute()
                )
                saved_details = sr.data or []
            except Exception:
                pass

        workspace["saved_results_details"] = saved_details

        return workspace

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Workspaces] Get failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{workspace_id}")
async def update_workspace(
    workspace_id: str,
    updates: dict,
    user: dict = Depends(get_current_user),
):
    """Update workspace name or other metadata."""
    try:
        allowed_fields = {"name"}
        filtered = {k: v for k, v in updates.items() if k in allowed_fields}
        if not filtered:
            raise HTTPException(status_code=400, detail="No valid fields to update")

        result = (
            supabase_admin.table("workspaces")
            .update(filtered)
            .eq("id", workspace_id)
            .eq("user_id", user["id"])
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=404, detail="Workspace not found")

        return {"message": "Workspace updated", "workspace": result.data[0]}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Workspaces] Update failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{workspace_id}")
async def delete_workspace(
    workspace_id: str,
    user: dict = Depends(get_current_user),
):
    """Delete a workspace."""
    try:
        result = (
            supabase_admin.table("workspaces")
            .delete()
            .eq("id", workspace_id)
            .eq("user_id", user["id"])
            .execute()
        )
        return MessageResponse(message="Workspace deleted")

    except Exception as e:
        logger.error(f"[Workspaces] Delete failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# Notes
# ============================================

@router.post("/{workspace_id}/notes")
async def add_note(
    workspace_id: str,
    note: NoteCreate,
    user: dict = Depends(get_current_user),
):
    """Add a note to a workspace."""
    try:
        # Fetch workspace
        ws = (
            supabase_admin.table("workspaces")
            .select("id, notes")
            .eq("id", workspace_id)
            .eq("user_id", user["id"])
            .single()
            .execute()
        )
        if not ws.data:
            raise HTTPException(status_code=404, detail="Workspace not found")

        new_note = {
            "id": str(uuid4()),
            "content": note.content,
            "tags": note.tags,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        existing_notes = ws.data.get("notes", []) or []
        existing_notes.append(new_note)

        supabase_admin.table("workspaces").update(
            {"notes": existing_notes}
        ).eq("id", workspace_id).execute()

        return {"message": "Note added", "note": new_note}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Workspaces] Add note failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{workspace_id}/notes/{note_id}")
async def update_note(
    workspace_id: str,
    note_id: str,
    updates: dict,
    user: dict = Depends(get_current_user),
):
    """Update a note's content or tags."""
    try:
        ws = (
            supabase_admin.table("workspaces")
            .select("id, notes")
            .eq("id", workspace_id)
            .eq("user_id", user["id"])
            .single()
            .execute()
        )
        if not ws.data:
            raise HTTPException(status_code=404, detail="Workspace not found")

        notes = ws.data.get("notes", []) or []
        updated = False
        for n in notes:
            if n.get("id") == note_id:
                if "content" in updates:
                    n["content"] = updates["content"]
                if "tags" in updates:
                    n["tags"] = updates["tags"]
                n["updated_at"] = datetime.now(timezone.utc).isoformat()
                updated = True
                break

        if not updated:
            raise HTTPException(status_code=404, detail="Note not found")

        supabase_admin.table("workspaces").update(
            {"notes": notes}
        ).eq("id", workspace_id).execute()

        return {"message": "Note updated"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Workspaces] Update note failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{workspace_id}/notes/{note_id}")
async def delete_note(
    workspace_id: str,
    note_id: str,
    user: dict = Depends(get_current_user),
):
    """Delete a note from a workspace."""
    try:
        ws = (
            supabase_admin.table("workspaces")
            .select("id, notes")
            .eq("id", workspace_id)
            .eq("user_id", user["id"])
            .single()
            .execute()
        )
        if not ws.data:
            raise HTTPException(status_code=404, detail="Workspace not found")

        notes = ws.data.get("notes", []) or []
        notes = [n for n in notes if n.get("id") != note_id]

        supabase_admin.table("workspaces").update(
            {"notes": notes}
        ).eq("id", workspace_id).execute()

        return MessageResponse(message="Note deleted")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Workspaces] Delete note failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# Saved Results
# ============================================

@router.post("/{workspace_id}/save-result")
async def save_result(
    workspace_id: str,
    body: dict,
    user: dict = Depends(get_current_user),
):
    """Save a search result to a workspace."""
    result_id = body.get("result_id")
    if not result_id:
        raise HTTPException(status_code=400, detail="result_id is required")

    try:
        ws = (
            supabase_admin.table("workspaces")
            .select("id, saved_results")
            .eq("id", workspace_id)
            .eq("user_id", user["id"])
            .single()
            .execute()
        )
        if not ws.data:
            raise HTTPException(status_code=404, detail="Workspace not found")

        saved = ws.data.get("saved_results", []) or []
        if result_id not in saved:
            saved.append(result_id)

        supabase_admin.table("workspaces").update(
            {"saved_results": saved}
        ).eq("id", workspace_id).execute()

        return {"message": "Result saved to workspace", "saved_count": len(saved)}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Workspaces] Save result failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{workspace_id}/save-result/{result_id}")
async def unsave_result(
    workspace_id: str,
    result_id: str,
    user: dict = Depends(get_current_user),
):
    """Remove a search result from workspace."""
    try:
        ws = (
            supabase_admin.table("workspaces")
            .select("id, saved_results")
            .eq("id", workspace_id)
            .eq("user_id", user["id"])
            .single()
            .execute()
        )
        if not ws.data:
            raise HTTPException(status_code=404, detail="Workspace not found")

        saved = ws.data.get("saved_results", []) or []
        saved = [s for s in saved if s != result_id]

        supabase_admin.table("workspaces").update(
            {"saved_results": saved}
        ).eq("id", workspace_id).execute()

        return {"message": "Result removed from workspace"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Workspaces] Unsave result failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# Annotations
# ============================================

@router.post("/{workspace_id}/annotations")
async def add_annotation(
    workspace_id: str,
    body: dict,
    user: dict = Depends(get_current_user),
):
    """Add an annotation/highlight to a workspace."""
    try:
        ws = (
            supabase_admin.table("workspaces")
            .select("id, annotations")
            .eq("id", workspace_id)
            .eq("user_id", user["id"])
            .single()
            .execute()
        )
        if not ws.data:
            raise HTTPException(status_code=404, detail="Workspace not found")

        annotation = {
            "id": str(uuid4()),
            "text": body.get("text", ""),
            "note": body.get("note", ""),
            "source_id": body.get("source_id", ""),
            "color": body.get("color", "#8b5cf6"),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        annotations = ws.data.get("annotations", []) or []
        annotations.append(annotation)

        supabase_admin.table("workspaces").update(
            {"annotations": annotations}
        ).eq("id", workspace_id).execute()

        return {"message": "Annotation added", "annotation": annotation}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Workspaces] Add annotation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# Export
# ============================================

@router.post("/{workspace_id}/export")
async def export_workspace(
    workspace_id: str,
    format: str = Query(default="md", regex="^(md|pdf)$"),
    user: dict = Depends(get_current_user),
):
    """Export workspace contents (notes, annotations, saved results) to Markdown or PDF."""
    from fastapi.responses import StreamingResponse
    import io

    try:
        ws = (
            supabase_admin.table("workspaces")
            .select("*")
            .eq("id", workspace_id)
            .eq("user_id", user["id"])
            .single()
            .execute()
        )
        if not ws.data:
            raise HTTPException(status_code=404, detail="Workspace not found")

        workspace = ws.data

        # Build markdown content
        md_lines = [
            f"# {workspace.get('name', 'Research Workspace')}",
            f"",
            f"*Exported from Innovix on {datetime.now().strftime('%B %d, %Y')}*",
            f"",
        ]

        # Notes section
        notes = workspace.get("notes", []) or []
        if notes:
            md_lines.append("## 📝 Notes\n")
            for note in notes:
                md_lines.append(f"### Note — {note.get('created_at', '')[:10]}")
                md_lines.append(f"{note.get('content', '')}\n")
                tags = note.get("tags", [])
                if tags:
                    md_lines.append(f"**Tags:** {', '.join(tags)}\n")
                md_lines.append("---\n")

        # Annotations section
        annotations = workspace.get("annotations", []) or []
        if annotations:
            md_lines.append("## 🖍️ Annotations\n")
            for ann in annotations:
                md_lines.append(f"> {ann.get('text', '')}")
                if ann.get("note"):
                    md_lines.append(f"\n*{ann['note']}*")
                md_lines.append("")

        # Saved results
        saved_ids = workspace.get("saved_results", []) or []
        if saved_ids:
            md_lines.append("## 🔗 Saved Research Results\n")
            try:
                sr = (
                    supabase_admin.table("search_results")
                    .select("query, summary, sources")
                    .in_("id", saved_ids)
                    .execute()
                )
                for r in (sr.data or []):
                    md_lines.append(f"### {r.get('query', 'Search')}")
                    md_lines.append(f"{(r.get('summary', '') or '')[:300]}\n")
            except Exception:
                md_lines.append("*Results data unavailable*\n")

        content = "\n".join(md_lines)

        if format == "pdf":
            try:
                import markdown as md_lib
                from weasyprint import HTML

                html = md_lib.markdown(content)
                styled_html = f"""<html><head><style>
                    body {{ font-family: 'Inter', sans-serif; max-width: 700px; margin: 0 auto; padding: 40px; color: #1a1a2e; }}
                    h1 {{ color: #6d28d9; }} h2 {{ color: #7c3aed; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }}
                    blockquote {{ border-left: 3px solid #8b5cf6; padding-left: 12px; color: #555; }}
                </style></head><body>{html}</body></html>"""

                pdf_bytes = HTML(string=styled_html).write_pdf()
                return StreamingResponse(
                    io.BytesIO(pdf_bytes),
                    media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="{workspace.get("name", "workspace")}.pdf"'},
                )
            except ImportError:
                raise HTTPException(status_code=500, detail="PDF export requires weasyprint")

        # Default: Markdown
        return StreamingResponse(
            io.BytesIO(content.encode()),
            media_type="text/markdown",
            headers={"Content-Disposition": f'attachment; filename="{workspace.get("name", "workspace")}.md"'},
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Workspaces] Export failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
