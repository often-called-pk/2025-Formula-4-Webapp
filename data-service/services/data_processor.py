import pandas as pd
import numpy as np
import logging
from typing import List, Dict, Any, Optional, Tuple
import io
import time
from datetime import datetime
import asyncio
from concurrent.futures import ThreadPoolExecutor
import re
from models.telemetry_models import (
    SessionMetadata, LapAnalysis, PerformanceMetrics, 
    ComparisonMetrics, ValidationIssue
)

logger = logging.getLogger(__name__)

class TelemetryProcessor:
    """Advanced telemetry data processor for Formula 4 racing analytics"""
    
    def __init__(self):
        self.executor = ThreadPoolExecutor(max_workers=4)
        
        # Define required and optional telemetry parameters
        self.required_parameters = ['Time']
        self.optional_parameters = [
            'Speed', 'RPM', 'Throttle', 'Brake', 'Steering', 'Gear',
            'Latitude', 'Longitude', 'G-Force X', 'G-Force Y', 'G-Force Z',
            'Lap Time', 'Sector Time', 'Distance', 'Engine Temp', 'Oil Pressure',
            'Fuel Level', 'Tire Pressure FL', 'Tire Pressure FR',
            'Tire Pressure RL', 'Tire Pressure RR'
        ]
        
        # Parameter aliases for different naming conventions
        self.parameter_aliases = {
            'time': ['Time', 'time', 'TIME', 'Timestamp', 'timestamp'],
            'speed': ['Speed', 'speed', 'SPEED', 'Vehicle Speed', 'Velocity'],
            'rpm': ['RPM', 'rpm', 'Engine RPM', 'Engine Speed'],
            'throttle': ['Throttle', 'throttle', 'TPS', 'Throttle Position'],
            'brake': ['Brake', 'brake', 'Brake Pressure', 'Brake Force'],
            'steering': ['Steering', 'steering', 'Steering Angle', 'Steer'],
            'gear': ['Gear', 'gear', 'Current Gear', 'Gear Position'],
            'latitude': ['Latitude', 'latitude', 'LAT', 'GPS Latitude'],
            'longitude': ['Longitude', 'longitude', 'LON', 'GPS Longitude'],
            'g_force_x': ['G-Force X', 'G Force X', 'Lateral G', 'Ay'],
            'g_force_y': ['G-Force Y', 'G Force Y', 'Longitudinal G', 'Ax'],
            'g_force_z': ['G-Force Z', 'G Force Z', 'Vertical G', 'Az'],
            'lap_time': ['Lap Time', 'Lap', 'Current Lap Time'],
            'sector_time': ['Sector Time', 'Sector', 'Current Sector'],
            'distance': ['Distance', 'distance', 'Track Distance']
        }

    async def process_csv_data(self, content: bytes, filename: str) -> Dict[str, Any]:
        """Process CSV telemetry data and return comprehensive analysis"""
        start_time = time.time()
        
        try:
            # Read CSV data
            df = await self._read_csv_content(content)
            
            # Normalize column names
            df = self._normalize_column_names(df)
            
            # Extract metadata
            metadata = self._extract_metadata(df, filename)
            
            # Clean and validate data
            df = self._clean_data(df)
            
            # Perform lap analysis
            lap_analysis = self._analyze_laps(df)
            
            # Calculate performance metrics
            performance_metrics = self._calculate_performance_metrics(df, lap_analysis)
            
            processing_time = time.time() - start_time
            
            return {
                'metadata': metadata,
                'data_points': len(df),
                'parameters_found': list(df.columns),
                'lap_analysis': lap_analysis,
                'performance_metrics': performance_metrics,
                'processing_time': processing_time
            }
            
        except Exception as e:
            logger.error(f"Error processing CSV data: {str(e)}")
            raise

    async def analyze_telemetry_data(self, content: bytes, filename: str) -> Dict[str, Any]:
        """Perform detailed analysis on telemetry data"""
        start_time = time.time()
        
        try:
            # Process basic data first
            basic_result = await self.process_csv_data(content, filename)
            
            # Read data again for detailed analysis
            df = await self._read_csv_content(content)
            df = self._normalize_column_names(df)
            df = self._clean_data(df)
            
            # Generate insights
            insights = self._generate_insights(df, basic_result['lap_analysis'])
            
            # Prepare chart data
            charts_data = self._prepare_chart_data(df)
            
            analysis_time = time.time() - start_time
            
            return {
                'metadata': basic_result['metadata'],
                'performance_metrics': basic_result['performance_metrics'],
                'lap_analysis': basic_result['lap_analysis'],
                'insights': insights,
                'charts_data': charts_data,
                'analysis_time': analysis_time
            }
            
        except Exception as e:
            logger.error(f"Error analyzing telemetry data: {str(e)}")
            raise

    async def compare_sessions(self, session_data: List[Dict], parameters: List[str]) -> Dict[str, Any]:
        """Compare multiple telemetry sessions"""
        start_time = time.time()
        
        try:
            comparison_metrics = []
            session_names = [session['filename'] for session in session_data]
            
            # Compare lap times
            lap_times = {}
            for session in session_data:
                filename = session['filename']
                lap_analysis = session['data']['lap_analysis']
                if lap_analysis:
                    fastest_lap = min(lap['lap_time'] for lap in lap_analysis)
                    lap_times[filename] = fastest_lap
            
            if lap_times:
                best_session = min(lap_times.keys(), key=lambda x: lap_times[x])
                worst_session = max(lap_times.keys(), key=lambda x: lap_times[x])
                improvement = ((lap_times[worst_session] - lap_times[best_session]) / lap_times[worst_session]) * 100
                
                comparison_metrics.append(ComparisonMetrics(
                    parameter="Fastest Lap Time",
                    session_values=lap_times,
                    best_performance=best_session,
                    worst_performance=worst_session,
                    improvement_potential=improvement
                ))
            
            # Compare speed metrics
            speed_metrics = {}
            for session in session_data:
                filename = session['filename']
                perf_metrics = session['data']['performance_metrics']
                speed_metrics[filename] = perf_metrics['max_speed']
            
            if speed_metrics:
                best_speed_session = max(speed_metrics.keys(), key=lambda x: speed_metrics[x])
                worst_speed_session = min(speed_metrics.keys(), key=lambda x: speed_metrics[x])
                speed_improvement = ((speed_metrics[best_speed_session] - speed_metrics[worst_speed_session]) / speed_metrics[worst_speed_session]) * 100
                
                comparison_metrics.append(ComparisonMetrics(
                    parameter="Maximum Speed",
                    session_values=speed_metrics,
                    best_performance=best_speed_session,
                    worst_performance=worst_speed_session,
                    improvement_potential=speed_improvement
                ))
            
            # Generate recommendations
            recommendations = self._generate_comparison_recommendations(comparison_metrics)
            
            # Prepare comparison charts
            comparison_charts = self._prepare_comparison_charts(session_data)
            
            comparison_time = time.time() - start_time
            
            return {
                'session_names': session_names,
                'comparison_metrics': [metric.dict() for metric in comparison_metrics],
                'fastest_overall': lap_times and min(lap_times.keys(), key=lambda x: lap_times[x]) or "Unknown",
                'recommendations': recommendations,
                'comparison_charts': comparison_charts,
                'comparison_time': comparison_time
            }
            
        except Exception as e:
            logger.error(f"Error comparing sessions: {str(e)}")
            raise

    async def validate_csv_file(self, content: bytes, filename: str) -> Dict[str, Any]:
        """Validate CSV file structure and content"""
        try:
            # Read CSV
            df = await self._read_csv_content(content)
            
            issues = []
            recommendations = []
            
            # Check basic structure
            if df.empty:
                issues.append(ValidationIssue(
                    severity="error",
                    message="File is empty or contains no data",
                    suggestion="Ensure the CSV file contains telemetry data"
                ))
            
            # Check for required columns
            columns_found = list(df.columns)
            missing_columns = []
            
            # Check for time column (most critical)
            time_column = self._find_column_by_aliases(df.columns, self.parameter_aliases['time'])
            if not time_column:
                missing_columns.append('Time')
                issues.append(ValidationIssue(
                    severity="error",
                    message="No time column found",
                    suggestion="Ensure the CSV contains a time/timestamp column"
                ))
            
            # Check data quality
            if not df.empty:
                # Check for missing values
                missing_percentages = (df.isnull().sum() / len(df)) * 100
                for col, percentage in missing_percentages.items():
                    if percentage > 50:
                        issues.append(ValidationIssue(
                            severity="warning",
                            message=f"Column '{col}' has {percentage:.1f}% missing values",
                            column=col,
                            suggestion="Consider data cleaning or interpolation"
                        ))
                
                # Check for duplicate timestamps
                if time_column and df[time_column].duplicated().any():
                    issues.append(ValidationIssue(
                        severity="warning",
                        message="Duplicate timestamps found",
                        column=time_column,
                        suggestion="Remove or average duplicate entries"
                    ))
            
            # Estimate data quality
            error_count = sum(1 for issue in issues if issue.severity == "error")
            warning_count = sum(1 for issue in issues if issue.severity == "warning")
            
            if error_count > 0:
                quality = "Poor - Contains critical errors"
            elif warning_count > 3:
                quality = "Fair - Multiple warnings present"
            elif warning_count > 0:
                quality = "Good - Minor issues detected"
            else:
                quality = "Excellent - No issues found"
            
            # Generate recommendations
            if not issues:
                recommendations.append("File structure looks good and ready for processing")
            else:
                recommendations.append("Address the identified issues before processing")
                if missing_columns:
                    recommendations.append("Ensure all required telemetry parameters are present")
            
            return {
                'is_valid': error_count == 0,
                'row_count': len(df),
                'column_count': len(df.columns),
                'columns_found': columns_found,
                'required_columns': self.required_parameters,
                'missing_columns': missing_columns,
                'issues': [issue.dict() for issue in issues],
                'recommendations': recommendations,
                'estimated_quality': quality
            }
            
        except Exception as e:
            logger.error(f"Error validating CSV file: {str(e)}")
            return {
                'is_valid': False,
                'row_count': 0,
                'column_count': 0,
                'columns_found': [],
                'required_columns': self.required_parameters,
                'missing_columns': self.required_parameters,
                'issues': [ValidationIssue(
                    severity="error",
                    message=f"Failed to read CSV file: {str(e)}",
                    suggestion="Check file format and encoding"
                ).dict()],
                'recommendations': ["Fix file format issues before reprocessing"],
                'estimated_quality': "Invalid - Cannot process"
            }

    async def _read_csv_content(self, content: bytes) -> pd.DataFrame:
        """Read CSV content from bytes"""
        try:
            # Try different encodings
            encodings = ['utf-8', 'latin-1', 'cp1252']
            
            for encoding in encodings:
                try:
                    content_str = content.decode(encoding)
                    df = pd.read_csv(io.StringIO(content_str))
                    logger.info(f"Successfully read CSV with {encoding} encoding")
                    return df
                except UnicodeDecodeError:
                    continue
                except Exception as e:
                    logger.warning(f"Failed to read CSV with {encoding}: {str(e)}")
                    continue
            
            raise ValueError("Unable to decode CSV file with any supported encoding")
            
        except Exception as e:
            logger.error(f"Error reading CSV content: {str(e)}")
            raise

    def _normalize_column_names(self, df: pd.DataFrame) -> pd.DataFrame:
        """Normalize column names using aliases"""
        column_mapping = {}
        
        for standard_name, aliases in self.parameter_aliases.items():
            found_column = self._find_column_by_aliases(df.columns, aliases)
            if found_column:
                column_mapping[found_column] = standard_name
        
        df = df.rename(columns=column_mapping)
        return df

    def _find_column_by_aliases(self, columns: List[str], aliases: List[str]) -> Optional[str]:
        """Find column by checking aliases"""
        for col in columns:
            if col in aliases:
                return col
        return None

    def _extract_metadata(self, df: pd.DataFrame, filename: str) -> SessionMetadata:
        """Extract session metadata from data and filename"""
        # Extract driver name from filename
        driver_match = re.search(r'([A-Za-z\s]+)\s+Round', filename, re.IGNORECASE)
        driver_name = driver_match.group(1).strip() if driver_match else None
        
        # Extract track/session info
        session_type = "Unknown"
        if "practice" in filename.lower():
            session_type = "Practice"
        elif "qualifying" in filename.lower():
            session_type = "Qualifying"
        elif "race" in filename.lower():
            session_type = "Race"
        
        # Calculate duration
        duration = None
        if 'time' in df.columns:
            try:
                duration = df['time'].max() - df['time'].min()
            except:
                pass
        
        # Estimate lap count
        total_laps = None
        if 'lap_time' in df.columns:
            try:
                total_laps = df['lap_time'].notna().sum()
            except:
                pass
        
        return SessionMetadata(
            driver_name=driver_name,
            track_name="Unknown Track",
            session_type=session_type,
            date=datetime.now().strftime("%Y-%m-%d"),
            weather="Unknown",
            duration=duration,
            total_laps=total_laps
        )

    def _clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and prepare telemetry data"""
        # Remove rows where all values are NaN
        df = df.dropna(how='all')
        
        # Sort by time if available
        if 'time' in df.columns:
            df = df.sort_values('time').reset_index(drop=True)
        
        # Convert numeric columns
        numeric_columns = ['speed', 'rpm', 'throttle', 'brake', 'steering', 'gear',
                          'g_force_x', 'g_force_y', 'g_force_z', 'lap_time', 'sector_time', 'distance']
        
        for col in numeric_columns:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
        
        return df

    def _analyze_laps(self, df: pd.DataFrame) -> List[LapAnalysis]:
        """Analyze lap-by-lap performance"""
        lap_analysis = []
        
        if 'lap_time' not in df.columns or df['lap_time'].isna().all():
            return lap_analysis
        
        # Group by lap (assuming lap changes indicate new lap)
        df['lap_number'] = df['lap_time'].notna().cumsum()
        
        fastest_lap_time = float('inf')
        fastest_lap_number = 0
        
        for lap_num in df['lap_number'].unique():
            if lap_num == 0:
                continue
                
            lap_data = df[df['lap_number'] == lap_num]
            
            if lap_data.empty:
                continue
            
            # Calculate lap metrics
            lap_time = lap_data['lap_time'].iloc[-1] if 'lap_time' in lap_data.columns else 0
            max_speed = lap_data['speed'].max() if 'speed' in lap_data.columns else 0
            avg_speed = lap_data['speed'].mean() if 'speed' in lap_data.columns else 0
            
            # Calculate max G-force
            max_g_force = 0
            if 'g_force_x' in lap_data.columns and 'g_force_y' in lap_data.columns:
                g_combined = np.sqrt(lap_data['g_force_x']**2 + lap_data['g_force_y']**2)
                max_g_force = g_combined.max()
            
            # Check if this is the fastest lap
            is_fastest = False
            if lap_time > 0 and lap_time < fastest_lap_time:
                fastest_lap_time = lap_time
                fastest_lap_number = lap_num
                is_fastest = True
            
            lap_analysis.append(LapAnalysis(
                lap_number=int(lap_num),
                lap_time=float(lap_time),
                max_speed=float(max_speed) if not pd.isna(max_speed) else 0.0,
                avg_speed=float(avg_speed) if not pd.isna(avg_speed) else 0.0,
                max_g_force=float(max_g_force) if not pd.isna(max_g_force) else 0.0,
                is_fastest=is_fastest
            ))
        
        # Update fastest lap flag
        for lap in lap_analysis:
            if lap.lap_number == fastest_lap_number:
                lap.is_fastest = True
        
        return lap_analysis

    def _calculate_performance_metrics(self, df: pd.DataFrame, lap_analysis: List[LapAnalysis]) -> PerformanceMetrics:
        """Calculate overall performance metrics"""
        
        # Lap time metrics
        lap_times = [lap.lap_time for lap in lap_analysis if lap.lap_time > 0]
        fastest_lap = min(lap_times) if lap_times else 0.0
        average_lap = sum(lap_times) / len(lap_times) if lap_times else 0.0
        
        # Speed metrics
        max_speed = df['speed'].max() if 'speed' in df.columns else 0.0
        avg_speed = df['speed'].mean() if 'speed' in df.columns else 0.0
        
        # RPM metrics
        max_rpm = int(df['rpm'].max()) if 'rpm' in df.columns else 0
        avg_rpm = df['rpm'].mean() if 'rpm' in df.columns else 0.0
        
        # G-force metrics
        max_g_force = 0.0
        if 'g_force_x' in df.columns and 'g_force_y' in df.columns:
            g_combined = np.sqrt(df['g_force_x']**2 + df['g_force_y']**2)
            max_g_force = g_combined.max()
        
        # Analyze braking and acceleration zones
        braking_points = 0
        acceleration_zones = 0
        
        if 'throttle' in df.columns and 'brake' in df.columns:
            # Simple analysis of throttle/brake patterns
            brake_threshold = df['brake'].quantile(0.7) if df['brake'].notna().any() else 0
            throttle_threshold = df['throttle'].quantile(0.7) if df['throttle'].notna().any() else 0
            
            braking_points = len(df[df['brake'] > brake_threshold])
            acceleration_zones = len(df[df['throttle'] > throttle_threshold])
        
        return PerformanceMetrics(
            fastest_lap=float(fastest_lap),
            average_lap=float(average_lap),
            max_speed=float(max_speed) if not pd.isna(max_speed) else 0.0,
            avg_speed=float(avg_speed) if not pd.isna(avg_speed) else 0.0,
            max_rpm=max_rpm,
            avg_rpm=float(avg_rpm) if not pd.isna(avg_rpm) else 0.0,
            max_g_force=float(max_g_force) if not pd.isna(max_g_force) else 0.0,
            braking_points=braking_points,
            acceleration_zones=acceleration_zones
        )

    def _generate_insights(self, df: pd.DataFrame, lap_analysis: List[LapAnalysis]) -> Dict[str, Any]:
        """Generate performance insights and recommendations"""
        insights = {
            "performance_summary": {},
            "recommendations": [],
            "key_findings": []
        }
        
        # Analyze lap consistency
        if lap_analysis:
            lap_times = [lap.lap_time for lap in lap_analysis if lap.lap_time > 0]
            if len(lap_times) > 1:
                lap_std = np.std(lap_times)
                lap_avg = np.mean(lap_times)
                consistency = (lap_std / lap_avg) * 100 if lap_avg > 0 else 0
                
                insights["performance_summary"]["lap_consistency"] = {
                    "coefficient_of_variation": consistency,
                    "rating": "Excellent" if consistency < 2 else "Good" if consistency < 5 else "Needs Improvement"
                }
                
                if consistency > 5:
                    insights["recommendations"].append("Focus on lap time consistency - practice maintaining steady pace")
        
        # Speed analysis
        if 'speed' in df.columns:
            speed_data = df['speed'].dropna()
            if not speed_data.empty:
                speed_variance = speed_data.var()
                insights["performance_summary"]["speed_management"] = {
                    "max_speed": speed_data.max(),
                    "average_speed": speed_data.mean(),
                    "speed_variance": speed_variance
                }
                
                if speed_variance > 100:  # High variance in speed
                    insights["recommendations"].append("Work on smoother speed transitions through corners")
        
        # G-force analysis
        if 'g_force_x' in df.columns and 'g_force_y' in df.columns:
            g_data = np.sqrt(df['g_force_x']**2 + df['g_force_y']**2).dropna()
            if not g_data.empty:
                max_g = g_data.max()
                insights["key_findings"].append(f"Maximum G-force recorded: {max_g:.2f}g")
                
                if max_g < 1.5:
                    insights["recommendations"].append("Consider pushing harder in corners to maximize grip")
                elif max_g > 3.0:
                    insights["recommendations"].append("Monitor tire wear - high G-forces detected")
        
        return insights

    def _prepare_chart_data(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Prepare data for frontend charts"""
        charts = {}
        
        # Speed vs Time chart
        if 'time' in df.columns and 'speed' in df.columns:
            speed_data = df[['time', 'speed']].dropna()
            charts['speed_trace'] = {
                'x': speed_data['time'].tolist(),
                'y': speed_data['speed'].tolist(),
                'type': 'line',
                'name': 'Speed'
            }
        
        # RPM vs Time chart
        if 'time' in df.columns and 'rpm' in df.columns:
            rpm_data = df[['time', 'rpm']].dropna()
            charts['rpm_trace'] = {
                'x': rpm_data['time'].tolist(),
                'y': rpm_data['rpm'].tolist(),
                'type': 'line',
                'name': 'RPM'
            }
        
        # G-force scatter plot
        if 'g_force_x' in df.columns and 'g_force_y' in df.columns:
            g_data = df[['g_force_x', 'g_force_y']].dropna()
            charts['g_force_scatter'] = {
                'x': g_data['g_force_x'].tolist(),
                'y': g_data['g_force_y'].tolist(),
                'type': 'scatter',
                'mode': 'markers',
                'name': 'G-Force'
            }
        
        return charts

    def _generate_comparison_recommendations(self, metrics: List[ComparisonMetrics]) -> List[str]:
        """Generate recommendations based on session comparison"""
        recommendations = []
        
        for metric in metrics:
            if metric.parameter == "Fastest Lap Time" and metric.improvement_potential > 1:
                recommendations.append(f"Lap time can be improved by {metric.improvement_potential:.1f}% - analyze {metric.best_performance} session")
            
            if metric.parameter == "Maximum Speed" and metric.improvement_potential > 5:
                recommendations.append(f"Top speed can be increased by {metric.improvement_potential:.1f}% - check setup and driving line")
        
        if not recommendations:
            recommendations.append("Performance is consistent across sessions - focus on fine-tuning")
        
        return recommendations

    def _prepare_comparison_charts(self, session_data: List[Dict]) -> Dict[str, Any]:
        """Prepare chart data for session comparison"""
        charts = {}
        
        # Lap time comparison
        lap_times = {}
        for session in session_data:
            filename = session['filename']
            lap_analysis = session['data']['lap_analysis']
            if lap_analysis:
                times = [lap['lap_time'] for lap in lap_analysis if lap['lap_time'] > 0]
                lap_times[filename] = times
        
        if lap_times:
            charts['lap_time_comparison'] = {
                'data': lap_times,
                'type': 'bar',
                'title': 'Lap Time Comparison'
            }
        
        return charts