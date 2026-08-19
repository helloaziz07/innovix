"""
Innovix API — Authentication Routes

Handles user profile management. Actual auth (login/signup) happens
client-side via Supabase Auth SDK — these endpoints manage the
extended profile data.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user
from app.core.database import supabase_admin
from app.models.schemas import UserProfile, UserProfileUpdate, MessageResponse, ReferralRedeemRequest
from app.services.credit_service import get_and_replenish_credits

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/me", response_model=UserProfile)
async def get_profile(user: dict = Depends(get_current_user)):
    """Get the current user's profile."""
    try:
        # Replenish credits before fetching to ensure they are up to date
        get_and_replenish_credits(user["id"])
        
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

@router.post("/redeem-referral", response_model=MessageResponse)
async def redeem_referral(
    request: ReferralRedeemRequest,
    user: dict = Depends(get_current_user),
):
    """Redeem a referral code."""
    # 1. Check if user already used a referral
    profile_res = supabase_admin.table("profiles").select("referred_by, created_at").eq("id", user["id"]).single().execute()
    if profile_res.data and profile_res.data.get("referred_by"):
        raise HTTPException(status_code=400, detail="You have already redeemed a referral code.")
        
    code = request.referral_code.strip()
    
    # 2. Find the owner of the referral code
    referrer_res = supabase_admin.table("profiles").select("id, credits, created_at").eq("referral_code", code).execute()
    if not referrer_res.data:
        raise HTTPException(status_code=404, detail="Invalid referral code.")
        
    referrer = referrer_res.data[0]
    if referrer["id"] == user["id"]:
        raise HTTPException(status_code=400, detail="You cannot redeem your own referral code.")
        
    # 3. Prevent newer users from referring older users and mutual referrals
    user_created_at = profile_res.data.get("created_at")
    referrer_created_at = referrer.get("created_at")
    
    if user_created_at and referrer_created_at:
        # ISO 8601 strings are lexicographically sortable
        if referrer_created_at >= user_created_at:
            raise HTTPException(
                status_code=400, 
                detail="You can only redeem referral codes from users who joined before you."
            )
        
    # 3. Update the referrer (give them 1 credit)
    supabase_admin.table("profiles").update({
        "credits": referrer.get("credits", 0) + 1
    }).eq("id", referrer["id"]).execute()
    
    # 4. Update the current user (mark as referred)
    supabase_admin.table("profiles").update({
        "referred_by": referrer["id"]
    }).eq("id", user["id"]).execute()
    
    return MessageResponse(message="Referral code applied successfully!")
