# main.py
import asyncio
import sys
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db
from app.routes import auth, directories, saas, submissions
from app.utils.logger import get_logger

# Windows compatibility
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

settings = get_settings()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("=" * 50)
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info("=" * 50)

    # Generate encryption key if missing
    if not settings.ENCRYPTION_KEY:
        from app.utils.auth import generate_encryption_key

        logger.warning("⚠️  ENCRYPTION_KEY not set! Generating new key...")
        logger.warning("⚠️  Add this to your .env file:")
        logger.warning(f"ENCRYPTION_KEY={generate_encryption_key()}")
        logger.error("❌ Application cannot start without ENCRYPTION_KEY")
        raise ValueError("ENCRYPTION_KEY environment variable is required")

    try:
        init_db()
        logger.info("✅ Database initialized")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        raise

    logger.info("🔐 Authentication: JWT with httpOnly cookies")
    logger.info(f"🤖 AI: Ollama ({settings.OLLAMA_MODEL})")
    logger.info(f"🌍 Server: http://{settings.HOST}:{settings.PORT}")
    logger.info("✅ Application started successfully")

    yield

    # Shutdown
    logger.info("Shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Automated SaaS Directory Submission System with Ollama AI",
    debug=settings.DEBUG,
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(saas.router, prefix="/api/saas", tags=["SaaS Products"])
app.include_router(directories.router, prefix="/api/directories", tags=["Directories"])
app.include_router(submissions.router, prefix="/api/submissions", tags=["Submissions"])


@app.get("/")
async def root():
    """Health check"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/api/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "database": "connected",
        "ai_provider": "Ollama",
        "ai_model": settings.OLLAMA_MODEL,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
