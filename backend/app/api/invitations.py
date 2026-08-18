"""
Innovix API — Invitations Routes

Endpoints for validating and accepting project invitations.
"""

from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user
from app.core.database import supabase_admin
from app.models.schemas import MessageResponse
from app.services.task_assignment import run_matchmaker

router = APIRouter(prefix="/invitations", tags=["Team Invitations"])

@router.get("/{token}")
async def get_invitation_details(token: str):
    """
    Get details of an invitation by its token without requiring authentication.
    Used for the invite landing page to show "You've been invited to X".
    """
    result = (
        supabase_admin.table("project_invitations")
        .select("id, project_id, email, role, status, projects(title)")
        .eq("token", token)
        .single()
        .execute()
    )
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Invalid or expired invitation token.")
        
    if result.data["status"] == "accepted":
        raise HTTPException(status_code=400, detail="This invitation has already been accepted.")
        
    return {
        "invitation_id": result.data["id"],
        "project_id": result.data["project_id"],
        "project_title": result.data.get("projects", {}).get("title"),
        "role": result.data["role"],
        "email": result.data["email"]
    }

@router.post("/{token}/accept", response_model=MessageResponse)
async def accept_invitation(
    token: str,
    user: dict = Depends(get_current_user),
):
    """
    Accept an invitation.
    The user must be authenticated. This adds them to project_members.
    """
    # 1. Fetch invitation
    result = (
        supabase_admin.table("project_invitations")
        .select("*")
        .eq("token", token)
        .single()
        .execute()
    )
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Invalid invitation token.")
        
    invite = result.data
    
    if invite["status"] == "accepted":
        raise HTTPException(status_code=400, detail="This invitation has already been accepted.")
        
    # Check if the user's email matches the invite email?
    # Note: Depending on your security requirements, you might want to enforce this:
    # if user["email"] != invite["email"]:
    #     raise HTTPException(status_code=403, detail="This invitation was sent to a different email address.")
    
    # 2. Add to project_members
    member_data = {
        "project_id": invite["project_id"],
        "user_id": user["id"],
        "role": invite["role"],
        "technical_role": invite.get("technical_role"),
        "alias_name": invite.get("alias_name")
    }
    
    try:
        supabase_admin.table("project_members").insert(member_data).execute()
    except Exception as e:
        # Ignore unique constraint violations (if they are already a member)
        if "duplicate key value violates unique constraint" not in str(e):
            raise HTTPException(status_code=500, detail="Failed to add you to the project.")
            
    # 3. Mark invite as accepted
    supabase_admin.table("project_invitations").update({"status": "accepted"}).eq("id", invite["id"]).execute()
    
    # 4. Trigger matchmaker to assign tasks
    await run_matchmaker(invite["project_id"])
    
    return MessageResponse(message="Successfully joined the project!")
