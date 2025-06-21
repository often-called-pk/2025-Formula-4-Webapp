from fastapi import FastAPI, HTTPException, UploadFile, File, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import logging
from contextlib import asynccontextmanager
from routers import telemetry
from models.telemetry_models import HealthResponse, ServiceInfo

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 Formula 4 Data Processing Service starting up...")
    yield
    # Shutdown
    logger.info("🛑 Formula 4 Data Processing Service shutting down...")

# Create FastAPI application
app = FastAPI(
    title="Formula 4 Race Analytics - Data Processing Service",
    description="Advanced telemetry data processing and analysis service for Formula 4 racing",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://localhost:5173",
        "http://localhost:4173"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(telemetry.router, prefix="/telemetry", tags=["telemetry"])

@app.get("/", response_model=ServiceInfo)
async def root():
    """Root endpoint with service information"""
    return ServiceInfo(
        name="Formula 4 Race Analytics - Data Processing Service",
        version="1.0.0",
        status="operational",
        description="Advanced telemetry data processing and analysis service",
        endpoints={
            "health": "/health",
            "docs": "/docs",
            "telemetry": "/telemetry",
            "process": "/telemetry/process",
            "analyze": "/telemetry/analyze"
        }
    )

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        service="data-processing",
        version="1.0.0"
    )

@app.get("/info", response_model=dict)
async def service_info():
    """Get detailed service information"""
    return {
        "service_name": "Formula 4 Data Processing Service",
        "version": "1.0.0",
        "python_version": "3.11+",
        "framework": "FastAPI",
        "capabilities": [
            "CSV telemetry file processing",
            "Data validation and cleaning",
            "Lap time analysis", 
            "Driver performance comparison",
            "Speed and sector analysis",
            "G-force analysis",
            "Track mapping",
            "Statistical insights"
        ],
        "supported_formats": ["CSV", "AiM RaceStudio"],
        "max_file_size": "50MB",
        "processing_timeout": "5 minutes"
    }

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "timestamp": str(pd.Timestamp.now()),
            "path": str(request.url)
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """General exception handler"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred during processing",
            "timestamp": str(pd.Timestamp.now()),
            "path": str(request.url)
        }
    )

if __name__ == "__main__":
    import os
    port = int(os.getenv("PORT", 8001))
    host = os.getenv("HOST", "0.0.0.0")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info",
        access_log=True
    )