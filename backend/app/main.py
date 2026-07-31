"""
Innovix Backend — FastAPI Application

Main entry point. Registers all routers, middleware, and the health endpoint.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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
from app.api.intelligence import router as intelligence_router
from app.api.clusters import router as clusters_router
from app.api.translation import router as translation_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # Validate critical config
    if settings.is_production and settings.secret_key == "change-this-to-a-random-secret-key":
        raise RuntimeError(
            "FATAL: SECRET_KEY is set to the default value. "
            "Generate a new one: python -c \"import secrets; print(secrets.token_hex(32))\""
        )
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
_allowed_origins = [settings.frontend_url]
if not settings.is_production:
    _allowed_origins.extend(["http://localhost:5173", "http://localhost:3000"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# --- Rate Limiting ---
try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded

    limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    print("[INIT] Rate limiting enabled (slowapi)")
except ImportError:
    print("[WARN] slowapi not installed — rate limiting disabled. Run: pip install slowapi")


# --- Register Routers ---
app.include_router(auth_router, prefix="/api")
app.include_router(deepsearch_router, prefix="/api")
app.include_router(projects_router, prefix="/api")
app.include_router(workspaces_router, prefix="/api")
app.include_router(agents_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(intelligence_router, prefix="/api")
app.include_router(clusters_router, prefix="/api")
app.include_router(translation_router, prefix="/api")


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
