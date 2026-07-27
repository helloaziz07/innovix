"""
Innovix Backend — Supabase Database Client

Provides both an admin client (service role) for server operations
and a user-scoped client factory for per-request auth.
"""

from supabase import create_client, Client
from app.core.config import settings


def get_supabase_admin() -> Client:
    """
    Returns a Supabase client using the service role key.
    Use for server-side operations (bypasses RLS).
    """
    return create_client(
        settings.supabase_url,
        settings.supabase_service_role_key,
    )


def get_supabase_client() -> Client:
    """
    Returns a Supabase client using the anon key.
    Use for operations that respect Row Level Security.
    """
    return create_client(
        settings.supabase_url,
        settings.supabase_anon_key,
    )


# Shared admin client singleton
supabase_admin: Client = get_supabase_admin()
