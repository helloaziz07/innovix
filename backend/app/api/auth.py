"""
Innovix API — Authentication Routes

Handles user profile management. Actual auth (login/signup) happens
client-side via Supabase Auth SDK — these endpoints manage the
extended profile data.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user
from app.core.database import supabase_admin
from app.models.schemas import UserProfile, UserProfileUpdate, MessageResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/me", response_model=UserProfile)
async def get_profile(user: dict = Depends(get_current_user)):
    """Get the current user's profile."""
    try:
        result = (
            supabase_admin.table("profiles")
            .select("*")
            .eq("id", user["id"])
            .single()
            .execute()
        )
        return result.data
    except Exception:
        # Profile doesn't exist yet — create it
        profile_data = {
            "id": user["id"],
            "full_name": user.get("full_name", ""),
            "avatar_url": user.get("avatar_url", ""),
            "preferences": {},
        }
        result = (
            supabase_admin.table("profiles")
            .upsert(profile_data)
            .execute()
        )
        return result.data[0]


@router.patch("/me", response_model=MessageResponse)
async def update_profile(
    updates: UserProfileUpdate,
    user: dict = Depends(get_current_user),
):
    """Update the current user's profile."""
    update_data = updates.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    supabase_admin.table("profiles").update(update_data).eq(
        "id", user["id"]
    ).execute()

    return MessageResponse(message="Profile updated successfully")
