from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database import get_db, init_db
from app.config import get_settings
from app.routes import submissions, directories, saas
from datetime import datetime
from app.utils.logger import get_logger

settings = get_settings()
logger = get_logger(__name__)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Automated SaaS Directory Submission System"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(saas.router, prefix="/api/saas", tags=["SaaS Products"])
app.include_router(directories.router, prefix="/api/directories", tags=["Directories"])
app.include_router(submissions.router, prefix="/api/submissions", tags=["Submissions"])

@app.on_event("startup")
async def startup_event():
    """Initialize database and services on startup"""
    logger.info("Starting application...")
    init_db()
    logger.info("Application started successfully")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running"
    }

@app.get("/api/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }