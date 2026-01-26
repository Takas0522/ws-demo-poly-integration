"""
Mock Services Main Application
Provides mock API endpoints for 4 services: file-management, messaging, api-usage, backup
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import file_management, messaging, api_usage, backup

app = FastAPI(
    title="Mock Services",
    description="Mock services for development and testing",
    version="1.0.0"
)

# CORS configuration for development
# Note: In production, replace "*" with specific allowed origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development/testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers for each service
app.include_router(file_management.router, prefix="/file-management", tags=["file-management"])
app.include_router(messaging.router, prefix="/messaging", tags=["messaging"])
app.include_router(api_usage.router, prefix="/api-usage", tags=["api-usage"])
app.include_router(backup.router, prefix="/backup", tags=["backup"])

@app.get("/")
async def root():
    return {
        "message": "Mock Services API",
        "services": [
            {"id": "file-management", "path": "/file-management"},
            {"id": "messaging", "path": "/messaging"},
            {"id": "api-usage", "path": "/api-usage"},
            {"id": "backup", "path": "/backup"}
        ]
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}
