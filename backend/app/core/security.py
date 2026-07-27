"""
Innovix Backend — Security & Auth Middleware

Verifies Supabase JWT tokens and extracts user info for protected routes.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client
from app.core.config import settings

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    Validates the Supabase JWT from the Authorization header.
    Returns the authenticated user object.

    Raises 401 if the token is invalid or expired.
    """
    token = credentials.credentials

    try:
        # Create a temporary client with the user's token
        supabase = create_client(
            settings.supabase_url,
            settings.supabase_anon_key,
        )
        # Verify the JWT and get user info
        user_response = supabase.auth.get_user(token)

        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token",
            )

        return {
            "id": str(user_response.user.id),
            "email": user_response.user.email,
            "full_name": user_response.user.user_metadata.get("full_name", ""),
            "avatar_url": user_response.user.user_metadata.get("avatar_url", ""),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
        )
