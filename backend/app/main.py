"""
Innovix Backend — FastAPI Application

Main entry point. Registers all routers, middleware, and the health endpoint.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.models.schemas import HealthResponse

# Import routers
from app.api.auth import router as auth_router
from app.api.deepsearch import router as deepsearch_router
from app.api.projects import router as projects_router
from app.api.workspaces import router as workspaces_router
from app.api.agents import router as agents_router
from app.api.dashboard import router as dashboard_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    print(f"[START] {settings.app_name} starting in {settings.app_env} mode...")
    yield
    print(f"[STOP] {settings.app_name} shutting down...")


# Create the FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="AI-Powered Research & Innovation Copilot for Students",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Register Routers ---
app.include_router(auth_router, prefix="/api")
app.include_router(deepsearch_router, prefix="/api")
app.include_router(projects_router, prefix="/api")
app.include_router(workspaces_router, prefix="/api")
app.include_router(agents_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")


# --- Health Check ---
@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """Health check endpoint for monitoring."""
    return HealthResponse(
        status="healthy",
        version="0.1.0",
        environment=settings.app_env,
    )


@app.get("/", tags=["System"])
async def root():
    """Root endpoint — API info."""
    return {
        "name": settings.app_name,
        "version": "0.1.0",
        "docs": f"{settings.backend_url}/docs",
        "health": f"{settings.backend_url}/health",
    }
