"""
Innovix Backend — Pydantic Schemas

All request/response models used across the API.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime
from uuid import UUID


# ============================================
# User / Auth
# ============================================

class UserProfile(BaseModel):
    """User profile stored in Supabase."""
    id: UUID
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    preferences: dict = Field(default_factory=dict)
    created_at: Optional[datetime] = None


class UserProfileUpdate(BaseModel):
    """Updatable user profile fields."""
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    preferences: Optional[dict] = None


# ============================================
# Projects
# ============================================

class ProjectCreate(BaseModel):
    """Request to create a new project from an idea."""
    title: str = Field(..., min_length=3, max_length=200)
    idea_text: str = Field(..., min_length=10, max_length=5000)


class ProjectUpdate(BaseModel):
    """Updatable project fields."""
    title: Optional[str] = None
    status: Optional[str] = None
    project_plan: Optional[dict] = None
    project_plan_update: Optional[dict] = None
    tech_stack: Optional[Any] = None
    architecture: Optional[dict] = None
    timeline: Optional[dict] = None
    is_pinned: Optional[bool] = None


class ProjectResponse(BaseModel):
    """Full project response."""
    id: UUID
    user_id: UUID
    title: str
    idea_text: str
    status: str = "planning"
    project_plan: Optional[dict] = None
    tech_stack: Optional[Any] = None
    architecture: Optional[dict] = None
    timeline: Optional[dict] = None
    is_pinned: bool = False
    is_shared: bool = False
    created_at: datetime
    updated_at: datetime
    last_viewed_at: Optional[datetime] = None
    role: Optional[str] = None
    has_unread_changes: Optional[bool] = False
    last_activity: Optional[dict] = None

class ActivityLogResponse(BaseModel):
    id: UUID
    project_id: UUID
    user_id: UUID
    action: str
    component: str
    metadata: Optional[dict] = None
    created_at: datetime
    user_full_name: Optional[str] = None
    user_avatar: Optional[str] = None


# ============================================
# Team & Invitations
# ============================================

class ProjectMemberResponse(BaseModel):
    """A member of a project."""
    id: UUID
    project_id: UUID
    user_id: UUID
    role: str
    created_at: datetime
    # We will enrich this with profile data in the API
    user_email: Optional[str] = None
    user_full_name: Optional[str] = None
    user_avatar: Optional[str] = None

class ProjectInvitationCreate(BaseModel):
    """Request to create a new invitation."""
    email: str
    role: str = "viewer"

class ProjectInvitationResponse(BaseModel):
    """A pending invitation."""
    id: UUID
    project_id: UUID
    email: str
    role: str
    token: str
    status: str
    created_at: datetime
    expires_at: datetime


# ============================================
# DeepSearch
# ============================================

class SearchSource(BaseModel):
    """A single search result from any source."""
    title: str
    url: str
    snippet: str
    source_type: str  # "arxiv" | "github" | "scholar" | "web"
    relevance_score: float = 0.0
    metadata: dict = Field(default_factory=dict)


class DeepSearchRequest(BaseModel):
    """Request to run a deep search."""
    query: str = Field(..., min_length=5, max_length=1000)
    project_id: Optional[UUID] = None
    sources: List[str] = Field(
        default=["arxiv", "github", "scholar", "web"],
        description="Which sources to search",
    )


class DeepSearchResponse(BaseModel):
    """Complete deep search result."""
    id: UUID
    query: str
    sources: List[SearchSource]
    summary: str
    citations: List[dict]
    gap_analysis: Optional[str] = None
    created_at: datetime


# ============================================
# Workspaces
# ============================================

class WorkspaceCreate(BaseModel):
    """Request to create a research workspace."""
    project_id: UUID
    name: str = Field(..., min_length=2, max_length=200)


class NoteCreate(BaseModel):
    """Request to add a note to a workspace."""
    content: str = Field(..., min_length=1)
    tags: List[str] = Field(default_factory=list)


class WorkspaceResponse(BaseModel):
    """Full workspace response."""
    id: UUID
    project_id: UUID
    name: str
    notes: List[dict] = Field(default_factory=list)
    saved_results: List[UUID] = Field(default_factory=list)
    annotations: List[dict] = Field(default_factory=list)
    created_at: datetime


# ============================================
# Dashboard
# ============================================

class DashboardResponse(BaseModel):
    """Aggregated dashboard data."""
    total_projects: int = 0
    projects_by_status: dict = Field(default_factory=dict)
    recent_projects: List[dict] = Field(default_factory=list)
    recent_searches: List[dict] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    trending_topics: List[dict] = Field(default_factory=list)


# ============================================
# WebSocket Streaming (DeepSearch)
# ============================================

class SearchProgress(BaseModel):
    """Progress event sent over WebSocket during a deep search."""
    event: str  # "step" | "source_found" | "source_error" | "sub_queries" | "summary_complete" | "complete"
    step: Optional[str] = None
    message: Optional[str] = None
    source: Optional[str] = None
    count: Optional[int] = None
    error: Optional[str] = None
    queries: Optional[dict] = None
    summary_length: Optional[int] = None


class StreamToken(BaseModel):
    """Individual token from AI summarization stream."""
    event: str = "token"
    token: str
    done: bool = False


# ============================================
# Common
# ============================================

class MessageResponse(BaseModel):
    """Generic API message response."""
    message: str
    success: bool = True
    data: Optional[Any] = None


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = "healthy"
    version: str = "0.1.0"
    environment: str = "development"
