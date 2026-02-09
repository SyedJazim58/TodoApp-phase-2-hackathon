"""
FastAPI application entry point with JWT authentication.

This module initializes the FastAPI application, configures CORS,
and registers API routes with JWT authentication middleware.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api import tasks

# Initialize FastAPI application
app = FastAPI(
    title="Task Management API",
    description="Multi-user task management with JWT authentication",
    version="1.0.0"
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Frontend origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(tasks.router, tags=["tasks"])


@app.get("/health")
async def health_check():
    """
    Health check endpoint (no authentication required).

    Returns:
        dict: Status message
    """
    return {"status": "healthy", "service": "task-management-api"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
