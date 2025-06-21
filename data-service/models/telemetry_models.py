from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Union
from datetime import datetime
import pandas as pd

class HealthResponse(BaseModel):
    status: str = Field(..., description="Service health status")
    service: str = Field(..., description="Service name")
    version: str = Field(..., description="Service version")
    timestamp: datetime = Field(default_factory=datetime.now)

class ServiceInfo(BaseModel):
    name: str = Field(..., description="Service name")
    version: str = Field(..., description="Service version")
    status: str = Field(..., description="Service status")
    description: str = Field(..., description="Service description")
    endpoints: Dict[str, str] = Field(..., description="Available endpoints")

class TelemetryDataPoint(BaseModel):
    time: Optional[float] = Field(None, description="Time in seconds")
    speed: Optional[float] = Field(None, description="Speed in km/h")
    rpm: Optional[int] = Field(None, description="Engine RPM")
    throttle: Optional[float] = Field(None, description="Throttle position %")
    brake: Optional[float] = Field(None, description="Brake pressure %")
    steering: Optional[float] = Field(None, description="Steering angle degrees")
    gear: Optional[int] = Field(None, description="Current gear")
    latitude: Optional[float] = Field(None, description="GPS latitude")
    longitude: Optional[float] = Field(None, description="GPS longitude")
    g_force_x: Optional[float] = Field(None, description="Lateral G-force")
    g_force_y: Optional[float] = Field(None, description="Longitudinal G-force")
    g_force_z: Optional[float] = Field(None, description="Vertical G-force")
    lap_time: Optional[float] = Field(None, description="Lap time in seconds")
    sector_time: Optional[float] = Field(None, description="Sector time in seconds")
    distance: Optional[float] = Field(None, description="Distance traveled in meters")

class SessionMetadata(BaseModel):
    driver_name: Optional[str] = Field(None, description="Driver name")
    track_name: Optional[str] = Field(None, description="Track name")
    session_type: Optional[str] = Field(None, description="Session type (practice, qualifying, race)")
    date: Optional[str] = Field(None, description="Session date")
    weather: Optional[str] = Field(None, description="Weather conditions")
    duration: Optional[float] = Field(None, description="Session duration in seconds")
    total_laps: Optional[int] = Field(None, description="Total number of laps")

class LapAnalysis(BaseModel):
    lap_number: int = Field(..., description="Lap number")
    lap_time: float = Field(..., description="Lap time in seconds")
    sector_1: Optional[float] = Field(None, description="Sector 1 time")
    sector_2: Optional[float] = Field(None, description="Sector 2 time")
    sector_3: Optional[float] = Field(None, description="Sector 3 time")
    max_speed: float = Field(..., description="Maximum speed in lap")
    avg_speed: float = Field(..., description="Average speed in lap")
    max_g_force: float = Field(..., description="Maximum G-force in lap")
    is_fastest: bool = Field(False, description="Is this the fastest lap")

class PerformanceMetrics(BaseModel):
    fastest_lap: float = Field(..., description="Fastest lap time")
    average_lap: float = Field(..., description="Average lap time")
    max_speed: float = Field(..., description="Maximum speed achieved")
    avg_speed: float = Field(..., description="Average speed")
    max_rpm: int = Field(..., description="Maximum RPM")
    avg_rpm: float = Field(..., description="Average RPM")
    max_g_force: float = Field(..., description="Maximum G-force")
    braking_points: int = Field(..., description="Number of braking points")
    acceleration_zones: int = Field(..., description="Number of acceleration zones")

class TelemetryProcessResponse(BaseModel):
    success: bool = Field(..., description="Processing success status")
    filename: str = Field(..., description="Original filename")
    metadata: SessionMetadata = Field(..., description="Session metadata")
    data_points: int = Field(..., description="Number of data points processed")
    parameters_found: List[str] = Field(..., description="Parameters found in file")
    lap_analysis: List[LapAnalysis] = Field(..., description="Lap-by-lap analysis")
    performance_metrics: PerformanceMetrics = Field(..., description="Overall performance metrics")
    processing_time: float = Field(..., description="Processing time in seconds")

class TelemetryAnalysisResponse(BaseModel):
    success: bool = Field(..., description="Analysis success status")
    filename: str = Field(..., description="Original filename")
    metadata: SessionMetadata = Field(..., description="Session metadata")
    performance_metrics: PerformanceMetrics = Field(..., description="Performance metrics")
    lap_analysis: List[LapAnalysis] = Field(..., description="Detailed lap analysis")
    insights: Dict[str, Any] = Field(..., description="Data insights and recommendations")
    charts_data: Dict[str, Any] = Field(..., description="Data prepared for visualization")
    analysis_time: float = Field(..., description="Analysis time in seconds")

class ComparisonMetrics(BaseModel):
    parameter: str = Field(..., description="Parameter being compared")
    session_values: Dict[str, float] = Field(..., description="Values for each session")
    best_performance: str = Field(..., description="Session with best performance")
    worst_performance: str = Field(..., description="Session with worst performance")
    improvement_potential: float = Field(..., description="Potential improvement percentage")

class SessionComparisonResponse(BaseModel):
    success: bool = Field(..., description="Comparison success status")
    sessions_compared: int = Field(..., description="Number of sessions compared")
    session_names: List[str] = Field(..., description="Names of compared sessions")
    comparison_metrics: List[ComparisonMetrics] = Field(..., description="Detailed comparison metrics")
    fastest_overall: str = Field(..., description="Fastest session overall")
    recommendations: List[str] = Field(..., description="Performance improvement recommendations")
    comparison_charts: Dict[str, Any] = Field(..., description="Chart data for comparison visualization")
    comparison_time: float = Field(..., description="Comparison processing time")

class ValidationIssue(BaseModel):
    severity: str = Field(..., description="Issue severity (error, warning, info)")
    message: str = Field(..., description="Issue description")
    column: Optional[str] = Field(None, description="Affected column")
    row: Optional[int] = Field(None, description="Affected row")
    suggestion: Optional[str] = Field(None, description="Suggested fix")

class ValidationResponse(BaseModel):
    filename: str = Field(..., description="Validated filename")
    is_valid: bool = Field(..., description="Overall validation status")
    row_count: int = Field(..., description="Number of data rows")
    column_count: int = Field(..., description="Number of columns")
    columns_found: List[str] = Field(..., description="Column names found")
    required_columns: List[str] = Field(..., description="Required columns")
    missing_columns: List[str] = Field(..., description="Missing required columns")
    issues: List[ValidationIssue] = Field(..., description="Validation issues found")
    recommendations: List[str] = Field(..., description="Recommendations for fixes")
    estimated_quality: str = Field(..., description="Data quality assessment")

class CapabilitiesResponse(BaseModel):
    supported_parameters: List[str] = Field(..., description="Supported telemetry parameters")
    analysis_types: List[str] = Field(..., description="Available analysis types")
    comparison_metrics: List[str] = Field(..., description="Available comparison metrics")
    supported_formats: List[str] = Field(..., description="Supported file formats")
    max_file_size: str = Field(..., description="Maximum file size")
    max_files_comparison: int = Field(..., description="Maximum files for comparison")

class ProcessingRequest(BaseModel):
    parameters: Optional[List[str]] = Field(None, description="Specific parameters to process")
    analysis_type: Optional[str] = Field("full", description="Type of analysis to perform")
    include_charts: bool = Field(True, description="Include chart data in response")

class AnalysisRequest(BaseModel):
    focus_areas: Optional[List[str]] = Field(None, description="Specific areas to focus analysis on")
    comparison_baseline: Optional[str] = Field(None, description="Baseline for comparison")
    include_recommendations: bool = Field(True, description="Include performance recommendations")

class SessionFilter(BaseModel):
    driver: Optional[str] = Field(None, description="Filter by driver name")
    track: Optional[str] = Field(None, description="Filter by track name")
    date_from: Optional[str] = Field(None, description="Filter from date (YYYY-MM-DD)")
    date_to: Optional[str] = Field(None, description="Filter to date (YYYY-MM-DD)")
    session_type: Optional[str] = Field(None, description="Filter by session type")

class PaginationParams(BaseModel):
    limit: int = Field(20, ge=1, le=100, description="Number of items per page")
    offset: int = Field(0, ge=0, description="Number of items to skip")
    sort_by: str = Field("created_at", description="Field to sort by")
    sort_order: str = Field("desc", regex="^(asc|desc)$", description="Sort order")