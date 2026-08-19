import datetime
from dateutil.parser import parse
from app.core.database import supabase_admin
from fastapi import HTTPException

def get_and_replenish_credits(user_id: str) -> int:
    """
    Gets the user's credits and replenishes them if 24 hours have passed.
    """
    profile_res = supabase_admin.table("profiles").select("*").eq("id", user_id).execute()
    
    if not profile_res.data:
        # Create profile fallback
        profile = {
            "id": user_id,
            "credits": 1,
            "last_replenished_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "referral_code": f"inv-{user_id[:8]}"
        }
        supabase_admin.table("profiles").insert(profile).execute()
        return 1
        
    profile = profile_res.data[0]
    credits = profile.get("credits", 0)
    last_replenished = profile.get("last_replenished_at")

    now = datetime.datetime.now(datetime.timezone.utc)
    
    if last_replenished:
        replenished_date = parse(last_replenished)
        if replenished_date.tzinfo is None:
            replenished_date = replenished_date.replace(tzinfo=datetime.timezone.utc)
            
        if (now - replenished_date).total_seconds() >= 86400:
            credits = max(1, credits)
            supabase_admin.table("profiles").update({
                "credits": credits,
                "last_replenished_at": now.isoformat()
            }).eq("id", user_id).execute()
            
    return credits

def check_and_deduct_credit(user_id: str) -> int:
    """
    Deducts 1 credit if available. Raises 403 if out of credits.
    """
    credits = get_and_replenish_credits(user_id)
    
    if credits <= 0:
        raise HTTPException(
            status_code=403, 
            detail="No credits remaining today. Earn more by referring friends or wait until tomorrow!"
        )

    new_credits = credits - 1
    supabase_admin.table("profiles").update({
        "credits": new_credits
    }).eq("id", user_id).execute()
    
    return new_credits
