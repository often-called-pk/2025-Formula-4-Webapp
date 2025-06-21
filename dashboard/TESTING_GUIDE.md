# Formula 4 Race Analytics - Testing Guide

## Overview

This guide provides comprehensive testing procedures for the Formula 4 Race Analytics dashboard with Supabase integration.

## Pre-Testing Setup

### 1. Environment Configuration

Ensure your `.env` file contains:
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Dependencies Installation
```bash
pnpm install
```

### 3. Lint Check
```bash
pnpm run lint
```

## Testing Scenarios

### 1. Authentication Testing

#### Test Case 1.1: User Sign In
- **Objective**: Verify successful user authentication
- **Steps**:
  1. Navigate to the application
  2. Enter valid email and password
  3. Click "Sign In"
- **Expected Result**: User successfully logged in, redirected to dashboard
- **Status**: ✅ PASS / ❌ FAIL

#### Test Case 1.2: Invalid Credentials
- **Objective**: Test error handling for invalid login
- **Steps**:
  1. Enter invalid email/password
  2. Click "Sign In"
- **Expected Result**: Error message displayed, user remains on login screen
- **Status**: ✅ PASS / ❌ FAIL

#### Test Case 1.3: Session Persistence
- **Objective**: Verify user session persists on page reload
- **Steps**:
  1. Sign in successfully
  2. Refresh the page
- **Expected Result**: User remains logged in
- **Status**: ✅ PASS / ❌ FAIL

#### Test Case 1.4: Sign Out
- **Objective**: Test logout functionality
- **Steps**:
  1. Click the logout button in header
- **Expected Result**: User signed out, redirected to login
- **Status**: ✅ PASS / ❌ FAIL

### 2. File Upload Testing

#### Test Case 2.1: Valid CSV Upload
- **Objective**: Test successful telemetry file upload
- **Steps**:
  1. Navigate to "Upload Telemetry" tab
  2. Drag and drop a valid CSV file
  3. Fill in session metadata (driver name, track, etc.)
  4. Click "Upload Session"
- **Expected Result**: File uploaded successfully, session created
- **Status**: ✅ PASS / ❌ FAIL

#### Test Case 2.2: Invalid File Format
- **Objective**: Test file validation
- **Steps**:
  1. Try to upload a non-CSV file (e.g., .txt, .jpg)
- **Expected Result**: Error message about invalid file format
- **Status**: ✅ PASS / ❌ FAIL

#### Test Case 2.3: Large File Upload
- **Objective**: Test file size limits
- **Steps**:
  1. Try to upload a very large CSV file (>50MB)
- **Expected Result**: Appropriate handling (progress bar or size warning)
- **Status**: ✅ PASS / ❌ FAIL

#### Test Case 2.4: Upload Progress
- **Objective**: Verify upload progress indication
- **Steps**:
  1. Upload a moderately large file
  2. Observe progress indicator
- **Expected Result**: Progress bar shows upload status
- **Status**: ✅ PASS / ❌ FAIL

### 3. Dashboard Functionality

#### Test Case 3.1: Session List Display
- **Objective**: Verify sessions load and display correctly
- **Steps**:
  1. Navigate to Dashboard tab
  2. Observe session list
- **Expected Result**: All user sessions displayed with metadata
- **Status**: ✅ PASS / ❌ FAIL

#### Test Case 3.2: Session Selection
- **Objective**: Test session selection for analysis
- **Steps**:
  1. Click on session cards to select
  2. Observe selection state
- **Expected Result**: Sessions highlight when selected
- **Status**: ✅ PASS / ❌ FAIL

#### Test Case 3.3: Data Visualization
- **Objective**: Test chart rendering
- **Steps**:
  1. Select one or more sessions
  2. Observe charts and graphs
- **Expected Result**: Charts render with telemetry data
- **Status**: ✅ PASS / ❌ FAIL

#### Test Case 3.4: Real-time Updates
- **Objective**: Test live data synchronization
- **Steps**:
  1. Upload a new session in another browser tab
  2. Check if dashboard updates automatically
- **Expected Result**: New session appears without page refresh
- **Status**: ✅ PASS / ❌ FAIL

### 4. Driver Comparison

#### Test Case 4.1: Multi-Session Comparison
- **Objective**: Test comparison functionality
- **Steps**:
  1. Navigate to "Driver Comparison" tab
  2. Select multiple sessions
  3. View comparison charts
- **Expected Result**: Comparative visualizations displayed
- **Status**: ✅ PASS / ❌ FAIL

#### Test Case 4.2: Performance Metrics
- **Objective**: Verify calculated metrics
- **Steps**:
  1. Compare two sessions
  2. Check lap times, sector times, speed analysis
- **Expected Result**: Accurate performance metrics displayed
- **Status**: ✅ PASS / ❌ FAIL

#### Test Case 4.3: Chart Interactions
- **Objective**: Test interactive chart features
- **Steps**:
  1. Hover over chart elements
  2. Zoom and pan operations
  3. Toggle data series
- **Expected Result**: Charts respond to user interactions
- **Status**: ✅ PASS / ❌ FAIL

### 5. Session Management

#### Test Case 5.1: Session Details Edit
- **Objective**: Test session metadata editing
- **Steps**:
  1. Navigate to "Session Manager" tab
  2. Click edit on a session
  3. Modify driver name, track, or other details
  4. Save changes
- **Expected Result**: Session updated successfully
- **Status**: ✅ PASS / ❌ FAIL

#### Test Case 5.2: Session Deletion
- **Objective**: Test session removal
- **Steps**:
  1. Select a session to delete
  2. Confirm deletion
- **Expected Result**: Session removed from database and storage
- **Status**: ✅ PASS / ❌ FAIL

#### Test Case 5.3: Bulk Operations
- **Objective**: Test multiple session operations
- **Steps**:
  1. Select multiple sessions
  2. Perform bulk action (delete, archive, etc.)
- **Expected Result**: Operations applied to all selected sessions
- **Status**: ✅ PASS / ❌ FAIL

### 6. Real-time Features

#### Test Case 6.1: Online User Count
- **Objective**: Test user presence indicator
- **Steps**:
  1. Open application in multiple browser tabs/windows
  2. Observe online user count in header
- **Expected Result**: Count updates accurately
- **Status**: ✅ PASS / ❌ FAIL

#### Test Case 6.2: Live Data Sync
- **Objective**: Test real-time data synchronization
- **Steps**:
  1. Open app in two browser windows
  2. Upload session in one window
  3. Check if other window updates
- **Expected Result**: Data syncs across all instances
- **Status**: ✅ PASS / ❌ FAIL

### 7. Error Handling

#### Test Case 7.1: Network Disconnection
- **Objective**: Test offline behavior
- **Steps**:
  1. Disconnect internet connection
  2. Try to perform operations
- **Expected Result**: Appropriate error messages displayed
- **Status**: ✅ PASS / ❌ FAIL

#### Test Case 7.2: Supabase Service Down
- **Objective**: Test backend unavailability
- **Steps**:
  1. Use invalid Supabase URL in config
  2. Try to load application
- **Expected Result**: Clear error message about service unavailability
- **Status**: ✅ PASS / ❌ FAIL

#### Test Case 7.3: Database Errors
- **Objective**: Test database operation failures
- **Steps**:
  1. Simulate database constraint violations
  2. Try to save invalid data
- **Expected Result**: User-friendly error messages
- **Status**: ✅ PASS / ❌ FAIL

## Performance Testing

### Load Testing
- **Large Dataset**: Upload sessions with 10,000+ telemetry points
- **Multiple Sessions**: Load dashboard with 50+ sessions
- **Concurrent Users**: Test with 10+ simultaneous users

### Performance Benchmarks
- **Page Load Time**: < 3 seconds
- **Chart Rendering**: < 2 seconds for 1000 data points
- **File Upload**: Progress indication for files > 5MB
- **Real-time Updates**: < 1 second latency

## Browser Compatibility

### Supported Browsers
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Mobile Testing
- ✅ Responsive design on tablets
- ✅ Touch interactions work
- ⚠️ Limited functionality on phones (by design)

## Security Testing

### Authentication Security
- [ ] SQL injection attempts blocked
- [ ] XSS protection active
- [ ] CSRF tokens validated
- [ ] Session timeout working

### Data Access Control
- [ ] Users can only see their own data
- [ ] File access restricted by user
- [ ] API endpoints properly secured
- [ ] Database RLS policies active

## Automated Testing Commands

```bash
# Lint check
pnpm run lint

# Type checking (if TypeScript)
pnpm run type-check

# Unit tests (if configured)
pnpm run test

# E2E tests (if configured)
pnpm run test:e2e

# Build verification
pnpm run build
```

## Test Data

### Sample CSV Files
Use the existing telemetry files in the uploads directory:
- `Aqil Alibhai Round 3 Race 1 Telemetry.csv`
- `Jaden Pariat Round 3 Race 1 Telemetry.csv`

### Test User Accounts
Create test accounts with different roles:
- Engineer: `engineer@formula4team.com`
- Manager: `manager@formula4team.com`
- Driver: `driver@formula4team.com`

## Bug Reporting Template

```markdown
**Bug Title**: Brief description

**Environment**:
- Browser: Chrome 120
- OS: Windows 11
- Device: Desktop

**Steps to Reproduce**:
1. Step one
2. Step two
3. Step three

**Expected Behavior**:
What should happen

**Actual Behavior**:
What actually happened

**Screenshots**:
Attach relevant screenshots

**Console Errors**:
Any JavaScript errors in browser console

**Additional Notes**:
Any other relevant information
```

## Testing Checklist Summary

### Core Functionality ✅
- [ ] User authentication works
- [ ] File upload functions properly
- [ ] Dashboard displays data correctly
- [ ] Charts render and are interactive
- [ ] Session management works
- [ ] Real-time features active

### Performance ✅
- [ ] Application loads quickly
- [ ] Large files upload smoothly
- [ ] Charts render without lag
- [ ] Memory usage is reasonable

### Security ✅
- [ ] Data access is restricted
- [ ] File uploads are secure
- [ ] Authentication is robust
- [ ] XSS/CSRF protection active

### User Experience ✅
- [ ] Interface is intuitive
- [ ] Error messages are clear
- [ ] Loading states are shown
- [ ] Mobile experience is acceptable

---

**Testing Complete**: ✅ All tests passed  
**Ready for Production**: ✅ Yes / ❌ No  
**Tested By**: [Your Name]  
**Date**: [Test Date]