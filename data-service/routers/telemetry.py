from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, Query
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
import pandas as pd
import logging
from services.data_processor import TelemetryProcessor
from models.telemetry_models import (
    TelemetryProcessResponse,
    TelemetryAnalysisResponse,
    SessionComparisonResponse,
    ValidationResponse,
    CapabilitiesResponse
)

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize telemetry processor
telemetry_processor = TelemetryProcessor()

@router.post("/process", response_model=TelemetryProcessResponse)
async def process_telemetry_file(
    file: UploadFile = File(..., description="CSV telemetry file to process")
):
    """Process uploaded telemetry CSV file"""
    try:
        # Validate file type
        if not file.filename.endswith('.csv'):
            raise HTTPException(
                status_code=400,
                detail="Only CSV files are supported"
            )
        
        # Check file size (50MB limit)
        if file.size and file.size > 50 * 1024 * 1024:
            raise HTTPException(
                status_code=413,
                detail="File size exceeds 50MB limit"
            )
        
        logger.info(f"Processing telemetry file: {file.filename}")
        
        # Read file content
        content = await file.read()
        
        # Process the telemetry data
        result = await telemetry_processor.process_csv_data(content, file.filename)
        
        logger.info(f"Successfully processed {file.filename}")
        
        return TelemetryProcessResponse(
            success=True,
            filename=file.filename,
            **result
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing file {file.filename}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process telemetry file: {str(e)}"
        )

@router.post("/analyze", response_model=TelemetryAnalysisResponse)
async def analyze_telemetry_data(
    file: UploadFile = File(..., description="CSV telemetry file to analyze")
):
    """Perform detailed analysis on telemetry data"""
    try:
        if not file.filename.endswith('.csv'):
            raise HTTPException(
                status_code=400,
                detail="Only CSV files are supported"
            )
        
        logger.info(f"Analyzing telemetry file: {file.filename}")
        
        content = await file.read()
        analysis_result = await telemetry_processor.analyze_telemetry_data(content, file.filename)
        
        logger.info(f"Successfully analyzed {file.filename}")
        
        return TelemetryAnalysisResponse(
            success=True,
            filename=file.filename,
            **analysis_result
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing file {file.filename}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze telemetry file: {str(e)}"
        )

@router.post("/compare", response_model=SessionComparisonResponse)
async def compare_sessions(
    files: List[UploadFile] = File(..., description="Multiple CSV files to compare"),
    parameters: List[str] = Query(default=[], description="Specific parameters to compare")
):
    """Compare multiple telemetry sessions"""
    try:
        if len(files) < 2:
            raise HTTPException(
                status_code=400,
                detail="At least 2 files are required for comparison"
            )
        
        if len(files) > 10:
            raise HTTPException(
                status_code=400,
                detail="Maximum 10 files allowed for comparison"
            )
        
        logger.info(f"Comparing {len(files)} telemetry sessions")
        
        # Process all files
        session_data = []
        for file in files:
            if not file.filename.endswith('.csv'):
                raise HTTPException(
                    status_code=400,
                    detail=f"File {file.filename} is not a CSV file"
                )
            
            content = await file.read()
            processed_data = await telemetry_processor.process_csv_data(content, file.filename)
            session_data.append({
                'filename': file.filename,
                'data': processed_data
            })
        
        # Perform comparison
        comparison_result = await telemetry_processor.compare_sessions(session_data, parameters)
        
        logger.info(f"Successfully compared {len(files)} sessions")
        
        return SessionComparisonResponse(
            success=True,
            sessions_compared=len(files),
            **comparison_result
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error comparing sessions: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to compare sessions: {str(e)}"
        )

@router.post("/validate", response_model=ValidationResponse)
async def validate_csv_file(
    file: UploadFile = File(..., description="CSV file to validate")
):
    """Validate CSV file structure and content"""
    try:
        if not file.filename.endswith('.csv'):
            raise HTTPException(
                status_code=400,
                detail="Only CSV files are supported"
            )
        
        logger.info(f"Validating CSV file: {file.filename}")
        
        content = await file.read()
        validation_result = await telemetry_processor.validate_csv_file(content, file.filename)
        
        logger.info(f"Validation completed for {file.filename}")
        
        return ValidationResponse(
            filename=file.filename,
            **validation_result
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error validating file {file.filename}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to validate CSV file: {str(e)}"
        )

@router.get("/capabilities", response_model=CapabilitiesResponse)
async def get_capabilities():
    """Get service capabilities and supported parameters"""
    return CapabilitiesResponse(
        supported_parameters=[
            "Time", "Speed", "RPM", "Throttle", "Brake", "Steering", "Gear",
            "Latitude", "Longitude", "G-Force X", "G-Force Y", "G-Force Z",
            "Lap Time", "Sector Time", "Distance", "Engine Temp", "Oil Pressure",
            "Fuel Level", "Tire Pressure FL", "Tire Pressure FR", 
            "Tire Pressure RL", "Tire Pressure RR"
        ],
        analysis_types=[
            "lap_time_analysis", "speed_analysis", "sector_analysis", 
            "g_force_analysis", "throttle_brake_analysis", "steering_analysis",
            "rpm_analysis", "gear_analysis", "track_mapping"
        ],
        comparison_metrics=[
            "fastest_lap", "average_speed", "max_speed", "sector_times",
            "g_force_peaks", "braking_points", "acceleration_zones"
        ],
        supported_formats=["CSV", "AiM RaceStudio"],
        max_file_size="50MB",
        max_files_comparison=10
    )

@router.get("/sessions")
async def get_sessions(
    driver: Optional[str] = Query(None, description="Filter by driver name"),
    track: Optional[str] = Query(None, description="Filter by track name"),
    date: Optional[str] = Query(None, description="Filter by date (YYYY-MM-DD)"),
    limit: int = Query(20, ge=1, le=100, description="Number of sessions to return"),
    offset: int = Query(0, ge=0, description="Number of sessions to skip")
):
    """Get list of processed telemetry sessions"""
    # In a real implementation, this would query a database
    # For now, return a placeholder response
    return {
        "sessions": [],
        "total": 0,
        "message": "Session storage not yet implemented - using file-based processing"
    }

@router.get("/sessions/{session_id}")
async def get_session_data(
    session_id: str,
    parameters: Optional[str] = Query(None, description="Comma-separated list of parameters"),
    start_time: Optional[str] = Query(None, description="Start time filter"),
    end_time: Optional[str] = Query(None, description="End time filter")
):
    """Get specific session data"""
    # Placeholder - would retrieve from database in real implementation
    raise HTTPException(
        status_code=501,
        detail="Session retrieval not yet implemented - use file upload endpoints"
    )

@router.get("/sessions/{session_id}/analysis")
async def get_session_analysis(session_id: str):
    """Get analysis for a specific session"""
    # Placeholder - would retrieve from database in real implementation
    raise HTTPException(
        status_code=501,
        detail="Session analysis retrieval not yet implemented - use file upload endpoints"
    )