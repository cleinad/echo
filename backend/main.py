"""
Main application entry point with route registration.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.clips import router as clips_router
from routes.playback import router as playback_router
from routes.conversations import router as conversations_router
from config import get_settings

# Initialize app
app = FastAPI(
    title="echo",
    description="delivering information back to you.",
    version="0.1.0"
)

# CORS middleware for extension and web app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(clips_router, prefix="/api/v1")
app.include_router(playback_router, prefix="/api/v1")
app.include_router(conversations_router, prefix="/api/v1")

#
@app.get("/")
def root():
    """Health check endpoint."""
    return {"status": "ok", "service": "echo-api"}


@app.get("/health")
def health_check():
    """Detailed health check for monitoring."""
    settings = get_settings()
    return {
        "status": "healthy",
        "supabase_configured": bool(settings.SUPABASE_URL),
        "debug": settings.DEBUG
    }
