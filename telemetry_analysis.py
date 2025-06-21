#!/usr/bin/env python3
"""
Formula 4 Telemetry Analysis
Analyzing AiM RaceStudio CSV files for Aqil Alibhai and Jaden Pariat
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

print("Formula 4 Telemetry Analysis")
print("=" * 50)

# File paths
file1_path = "/data/chats/ur9ydd/workspace/uploads/Aqil Alibhai Round 3 Race 1 Telemetry.csv"
file2_path = "/data/chats/ur9ydd/workspace/uploads/Jaden Pariat Round 3 Race 1 Telemetry.csv"

print(f"\nAnalyzing files:")
print(f"1. {Path(file1_path).name}")
print(f"2. {Path(file2_path).name}")

# Function to load and parse AiM telemetry data
def load_aim_telemetry(file_path):
    """
    Load AiM RaceStudio telemetry CSV file
    """
    print(f"\n📂 Loading: {Path(file_path).name}")
    
    # Read first few rows to understand structure
    preview = pd.read_csv(file_path, nrows=20, header=None)
    print(f"   File structure preview (first 5 rows):")
    for i in range(min(5, len(preview))):
        print(f"   Row {i}: {str(preview.iloc[i, 0])[:100]}...")
    
    # Find header row (typically row 14 contains parameter names)
    try:
        # Read headers from row 14 (0-indexed row 13)
        headers = pd.read_csv(file_path, skiprows=13, nrows=1, header=None)
        column_names = headers.iloc[0].tolist()
        
        # Read units from row 15 (0-indexed row 14) 
        units = pd.read_csv(file_path, skiprows=14, nrows=1, header=None)
        unit_names = units.iloc[0].tolist()
        
        print(f"   Found {len(column_names)} parameters")
        print(f"   Sample parameters: {column_names[:5]}")
        
        # Read actual data starting from row 17 (0-indexed row 16)
        data = pd.read_csv(file_path, skiprows=16, names=column_names)
        
        print(f"   Data shape: {data.shape}")
        print(f"   Data loaded successfully ✅")
        
        return data, column_names, unit_names
        
    except Exception as e:
        print(f"   Error loading file: {e}")
        return None, None, None

# Load both telemetry files
print("\n" + "="*50)
print("STEP 1: LOADING TELEMETRY DATA")
print("="*50)

data1, cols1, units1 = load_aim_telemetry(file1_path)
data2, cols2, units2 = load_aim_telemetry(file2_path)

if data1 is not None and data2 is not None:
    print("\n✅ Both files loaded successfully!")
    
    # Basic statistics
    print("\n" + "="*50)
    print("STEP 2: BASIC DATA ANALYSIS")
    print("="*50)
    
    print(f"\n📊 Aqil Alibhai Data:")
    print(f"   Shape: {data1.shape}")
    print(f"   Duration: {data1.iloc[-1, 0]:.2f} seconds" if len(data1) > 0 else "   No data")
    print(f"   Sampling rate: ~{len(data1)/data1.iloc[-1, 0]:.1f} Hz" if len(data1) > 0 and data1.iloc[-1, 0] > 0 else "")
    
    print(f"\n📊 Jaden Pariat Data:")
    print(f"   Shape: {data2.shape}")
    print(f"   Duration: {data2.iloc[-1, 0]:.2f} seconds" if len(data2) > 0 else "   No data")
    print(f"   Sampling rate: ~{len(data2)/data2.iloc[-1, 0]:.1f} Hz" if len(data2) > 0 and data2.iloc[-1, 0] > 0 else "")
    
    # Parameter comparison
    print("\n" + "="*50)
    print("STEP 3: PARAMETER ANALYSIS")
    print("="*50)
    
    print(f"\n🔍 Parameter Comparison:")
    print(f"   Aqil parameters: {len(cols1)}")
    print(f"   Jaden parameters: {len(cols2)}")
    print(f"   Common parameters: {len(set(cols1) & set(cols2))}")
    
    # List all parameters with units
    print(f"\n📋 Complete Parameter List (Aqil Alibhai):")
    for i, (param, unit) in enumerate(zip(cols1, units1), 1):
        print(f"   {i:2d}. {param:<30} [{unit}]")
    
    # Data quality check
    print("\n" + "="*50)
    print("STEP 4: DATA QUALITY ASSESSMENT")
    print("="*50)
    
    print(f"\n🔍 Data Quality - Aqil Alibhai:")
    print(f"   Missing values: {data1.isnull().sum().sum()}")
    print(f"   Duplicate rows: {data1.duplicated().sum()}")
    
    print(f"\n🔍 Data Quality - Jaden Pariat:")
    print(f"   Missing values: {data2.isnull().sum().sum()}")
    print(f"   Duplicate rows: {data2.duplicated().sum()}")
    
    # Key performance metrics
    print("\n" + "="*50)
    print("STEP 5: PERFORMANCE COMPARISON")
    print("="*50)
    
    # Find common parameters for comparison
    key_params = ['GPS Speed', 'Engine RPM', 'Gear', 'Throttle Pos', 'Brake Pos']
    available_params = [p for p in key_params if p in cols1 and p in cols2]
    
    if available_params:
        print(f"\n📈 Performance Metrics Comparison:")
        print(f"{'Metric':<20} {'Aqil Alibhai':<15} {'Jaden Pariat':<15} {'Difference':<15}")
        print("-" * 70)
        
        for param in available_params:
            if param in data1.columns and param in data2.columns:
                val1 = data1[param].max() if param in ['GPS Speed', 'Engine RPM'] else data1[param].mean()
                val2 = data2[param].max() if param in ['GPS Speed', 'Engine RPM'] else data2[param].mean()
                diff = val1 - val2
                
                print(f"{param:<20} {val1:<15.2f} {val2:<15.2f} {diff:<15.2f}")
    
    # Lap time analysis (if available)
    if 'Time' in cols1:
        total_time1 = data1['Time'].iloc[-1] if len(data1) > 0 else 0
        total_time2 = data2['Time'].iloc[-1] if len(data2) > 0 else 0
        
        print(f"\n⏱️ Session Duration:")
        print(f"   Aqil Alibhai: {total_time1:.2f} seconds")
        print(f"   Jaden Pariat: {total_time2:.2f} seconds")
        print(f"   Difference: {total_time1 - total_time2:.2f} seconds")
    
    print("\n" + "="*50)
    print("ANALYSIS COMPLETE ✅")
    print("="*50)
    
else:
    print("\n❌ Failed to load one or both telemetry files")
    print("Please check file paths and format")

print("\n🏁 Formula 4 Telemetry Analysis Complete!")
