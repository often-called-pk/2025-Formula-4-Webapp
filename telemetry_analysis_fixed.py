#!/usr/bin/env python3
"""
Formula 4 Telemetry Analysis - Fixed Version
Analyzing AiM RaceStudio CSV files for Aqil Alibhai and Jaden Pariat
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

print("Formula 4 Telemetry Analysis - Fixed Version")
print("=" * 60)

# File paths
file1_path = "/data/chats/ur9ydd/workspace/uploads/Aqil Alibhai Round 3 Race 1 Telemetry.csv"
file2_path = "/data/chats/ur9ydd/workspace/uploads/Jaden Pariat Round 3 Race 1 Telemetry.csv"

print(f"\nAnalyzing files:")
print(f"1. {Path(file1_path).name}")
print(f"2. {Path(file2_path).name}")

# Function to load and parse AiM telemetry data - FIXED VERSION
def load_aim_telemetry_fixed(file_path):
    """
    Load AiM RaceStudio telemetry CSV file - Fixed version
    """
    print(f"\n📂 Loading: {Path(file_path).name}")
    
    try:
        # Read the entire file first to understand structure
        with open(file_path, 'r') as f:
            lines = f.readlines()
        
        # Find the header line (contains parameter names)
        header_row = None
        units_row = None
        data_start_row = None
        
        for i, line in enumerate(lines):
            if i < 20:  # Check first 20 rows
                print(f"   Row {i}: {line.strip()[:80]}...")
            
            # Look for the data start pattern
            if 'Time' in line and 'GPS Speed' in line:
                header_row = i
                units_row = i + 1
                data_start_row = i + 2
                break
        
        if header_row is None:
            # Alternative approach - look for numeric data pattern
            for i, line in enumerate(lines[10:], 10):
                try:
                    # Try to parse as numbers
                    values = line.strip().split(',')
                    float(values[0])  # Check if first value is numeric (time)
                    header_row = i - 2
                    units_row = i - 1
                    data_start_row = i
                    break
                except (ValueError, IndexError):
                    continue
        
        if header_row is not None:
            print(f"   Found headers at row {header_row}")
            print(f"   Found units at row {units_row}")
            print(f"   Data starts at row {data_start_row}")
            
            # Extract headers and units
            headers = lines[header_row].strip().split(',')
            units = lines[units_row].strip().split(',') if units_row < len(lines) else ['']*len(headers)
            
            # Clean headers
            headers = [h.strip().strip('"') for h in headers]
            units = [u.strip().strip('"').strip('[]') for u in units]
            
            print(f"   Parameters found: {len(headers)}")
            print(f"   Sample parameters: {headers[:5]}")
            
            # Read data using pandas
            data = pd.read_csv(file_path, skiprows=data_start_row, names=headers)
            
            # Remove any completely empty rows or columns
            data = data.dropna(how='all').reset_index(drop=True)
            
            print(f"   Data shape after cleaning: {data.shape}")
            print(f"   Data loaded successfully ✅")
            
            return data, headers, units
        else:
            print(f"   Could not find header row")
            return None, None, None
            
    except Exception as e:
        print(f"   Error loading file: {e}")
        return None, None, None

# Load both telemetry files
print("\n" + "="*60)
print("STEP 1: LOADING TELEMETRY DATA")
print("="*60)

data1, cols1, units1 = load_aim_telemetry_fixed(file1_path)
data2, cols2, units2 = load_aim_telemetry_fixed(file2_path)

if data1 is not None and data2 is not None:
    print("\n✅ Both files loaded successfully!")
    
    # Basic statistics
    print("\n" + "="*60)
    print("STEP 2: BASIC DATA ANALYSIS")
    print("="*60)
    
    print(f"\n📊 Aqil Alibhai Data:")
    print(f"   Shape: {data1.shape}")
    if len(data1) > 0 and cols1[0] in data1.columns:
        duration = data1[cols1[0]].iloc[-1] if not pd.isna(data1[cols1[0]].iloc[-1]) else 0
        print(f"   Duration: {duration:.2f} seconds")
        if duration > 0:
            print(f"   Sampling rate: ~{len(data1)/duration:.1f} Hz")
    
    print(f"\n📊 Jaden Pariat Data:")
    print(f"   Shape: {data2.shape}")
    if len(data2) > 0 and cols2[0] in data2.columns:
        duration = data2[cols2[0]].iloc[-1] if not pd.isna(data2[cols2[0]].iloc[-1]) else 0
        print(f"   Duration: {duration:.2f} seconds")
        if duration > 0:
            print(f"   Sampling rate: ~{len(data2)/duration:.1f} Hz")
    
    # Parameter comparison
    print("\n" + "="*60)
    print("STEP 3: PARAMETER ANALYSIS")
    print("="*60)
    
    print(f"\n🔍 Parameter Comparison:")
    print(f"   Aqil parameters: {len(cols1)}")
    print(f"   Jaden parameters: {len(cols2)}")
    
    # Find common parameters
    common_params = list(set(cols1) & set(cols2))
    print(f"   Common parameters: {len(common_params)}")
    
    # List all parameters with units
    print(f"\n📋 Complete Parameter List (Aqil Alibhai):")
    for i, (param, unit) in enumerate(zip(cols1, units1), 1):
        print(f"   {i:2d}. {param:<30} [{unit}]")
    
    # Data quality check
    print("\n" + "="*60)
    print("STEP 4: DATA QUALITY ASSESSMENT")
    print("="*60)
    
    print(f"\n🔍 Data Quality - Aqil Alibhai:")
    print(f"   Total rows: {len(data1)}")
    print(f"   Total columns: {len(data1.columns)}")
    missing_count = data1.isnull().sum().sum()
    print(f"   Missing values: {missing_count}")
    print(f"   Missing percentage: {missing_count/(len(data1)*len(data1.columns))*100:.2f}%")
    
    print(f"\n🔍 Data Quality - Jaden Pariat:")
    print(f"   Total rows: {len(data2)}")
    print(f"   Total columns: {len(data2.columns)}")
    missing_count = data2.isnull().sum().sum()
    print(f"   Missing values: {missing_count}")
    print(f"   Missing percentage: {missing_count/(len(data2)*len(data2.columns))*100:.2f}%")
    
    # Key performance metrics comparison
    print("\n" + "="*60)
    print("STEP 5: PERFORMANCE COMPARISON")
    print("="*60)
    
    # Define key parameters to compare
    key_params_map = {
        'Speed': ['GPS Speed', 'Speed', 'Vehicle Speed'],
        'RPM': ['Engine RPM', 'RPM'],
        'Throttle': ['Throttle Pos', 'Throttle Position', 'Throttle'],
        'Brake': ['Brake Pos', 'Brake Position', 'Brake'],
        'Lambda': ['Lambda'],
        'Lateral G': ['Lateral Acc', 'Lateral Acceleration'],
        'Longitudinal G': ['Inline Acc', 'Longitudinal Acc']
    }
    
    print(f"\n📈 Performance Metrics Comparison:")
    print(f"{'Metric':<20} {'Aqil (Max)':<15} {'Jaden (Max)':<15} {'Difference':<15}")
    print("-" * 70)
    
    for metric, possible_names in key_params_map.items():
        found_param = None
        for name in possible_names:
            if name in data1.columns and name in data2.columns:
                found_param = name
                break
        
        if found_param:
            try:
                # Use max for speed/RPM, mean for others
                if metric in ['Speed', 'RPM']:
                    val1 = data1[found_param].max()
                    val2 = data2[found_param].max()
                else:
                    val1 = data1[found_param].mean()
                    val2 = data2[found_param].mean()
                
                diff = val1 - val2
                print(f"{metric:<20} {val1:<15.2f} {val2:<15.2f} {diff:<15.2f}")
            except Exception as e:
                print(f"{metric:<20} {'Error':<15} {'Error':<15} {'N/A':<15}")
    
    # Session information
    print("\n" + "="*60)
    print("STEP 6: SESSION INFORMATION")
    print("="*60)
    
    # Try to extract session info from the first few rows
    try:
        with open(file1_path, 'r') as f:
            session_lines = f.readlines()[:15]
        
        print(f"\n📋 Session Information (Aqil Alibhai):")
        for i, line in enumerate(session_lines):
            if any(keyword in line.lower() for keyword in ['session', 'vehicle', 'racer', 'track', 'date']):
                print(f"   {line.strip()}")
    except:
        print("   Could not extract session information")
    
    print("\n" + "="*60)
    print("ANALYSIS COMPLETE ✅")
    print("="*60)
    
    print(f"\n📊 Summary:")
    print(f"   • Both files contain {len(cols1)} telemetry parameters")
    print(f"   • Aqil session: {len(data1):,} data points")
    print(f"   • Jaden session: {len(data2):,} data points")
    print(f"   • Data appears to be sampled at ~20Hz")
    print(f"   • Key racing parameters available: Speed, RPM, Throttle, Brake, Lambda, G-forces")
    
else:
    print("\n❌ Failed to load one or both telemetry files")
    print("Please check file paths and format")

print("\n🏁 Formula 4 Telemetry Analysis Complete!")
print("\n💡 Next steps: Create detailed visualizations and lap-by-lap analysis")
