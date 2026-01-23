# Requirements Document

## Introduction

This document specifies requirements for enhancing the educational platform with subject-specific teacher authentication and student performance analytics. The system will enable teachers to access dedicated interfaces based on their subject areas while providing comprehensive analytics on student performance through percentage calculations and progress tracking.

## Glossary

- **System**: The educational platform (Szent Mihály Görögkatolikus Óvoda, Általános Iskola és AMI)
- **Teacher**: An educator who manages exercises and monitors student progress in specific subjects
- **Student**: A learner who completes exercises and accumulates points
- **Subject_Area**: A specific academic discipline (e.g., informatics, mathematics, language arts)
- **Performance_Analytics**: Statistical calculations and visualizations of student achievement data
- **Subject_Dashboard**: A dedicated interface showing data relevant to a specific subject area
- **Percentage_Score**: A calculated value representing student achievement as a percentage of total possible points
- **Progress_Tracker**: A component that monitors and displays student improvement over time
- **Authentication_System**: The login and access control mechanism for teachers

## Requirements

### Requirement 1: Student Performance Analytics

**User Story:** As a teacher, I want to view student performance as percentages based on achieved points, so that I can easily assess and compare student achievement levels.

#### Acceptance Criteria

1. WHEN a student completes exercises, THE System SHALL calculate percentage scores based on achieved points divided by total possible points
2. WHEN a teacher views student data, THE System SHALL display percentage scores alongside raw point values
3. WHEN calculating percentages, THE System SHALL handle cases where total possible points is zero by displaying "N/A"
4. WHEN percentage calculations are performed, THE System SHALL round results to one decimal place
5. THE Performance_Analytics SHALL calculate percentages dynamically from existing point data without storing redundant percentage values

### Requirement 2: Progress Tracking Over Time

**User Story:** As a teacher, I want to track student progress over time, so that I can identify learning trends and provide targeted support.

#### Acceptance Criteria

1. WHEN a student completes exercises across multiple sessions, THE Progress_Tracker SHALL calculate historical performance from existing exercise completion records
2. WHEN displaying progress data, THE System SHALL compute percentage trends on-demand from stored point data over configurable time periods
3. WHEN generating progress reports, THE System SHALL create visual representations using cached calculations with 1-hour refresh intervals
4. WHEN no historical data exists for a student, THE System SHALL display an appropriate message indicating insufficient data
5. THE Progress_Tracker SHALL use existing exercise completion timestamps without requiring additional storage

### Requirement 3: Subject-Specific Teacher Authentication

**User Story:** As a teacher, I want to log in with subject-specific credentials, so that I can access a dashboard tailored to my teaching area.

#### Acceptance Criteria

1. WHEN a teacher attempts to log in, THE Authentication_System SHALL validate credentials against subject-specific username patterns (e.g., infoxxx, matekxxx)
2. WHEN authentication succeeds, THE System SHALL redirect teachers to their subject-specific dashboard
3. WHEN invalid credentials are provided, THE Authentication_System SHALL display clear error messages and prevent access
4. THE Authentication_System SHALL use existing session management without additional database tables
5. WHEN a teacher session expires, THE System SHALL leverage existing session timeout mechanisms

### Requirement 4: Subject-Specific Teacher Dashboards

**User Story:** As a subject teacher, I want a dedicated interface showing only my subject's data, so that I can focus on relevant student performance without distractions.

#### Acceptance Criteria

1. WHEN a teacher accesses their dashboard, THE Subject_Dashboard SHALL display only students and exercises relevant to their subject area
2. WHEN showing analytics, THE Subject_Dashboard SHALL filter performance data by the teacher's assigned subject
3. WHEN displaying student lists, THE System SHALL show only students who have completed exercises in the teacher's subject area
4. THE Subject_Dashboard SHALL provide subject-specific exercise creation and management tools
5. WHEN teachers switch between different views, THE Subject_Dashboard SHALL maintain subject-area filtering throughout the session

### Requirement 5: Performance Comparison and Analytics

**User Story:** As a teacher, I want to compare student performance across different metrics, so that I can identify high and low performers and adjust my teaching strategies.

#### Acceptance Criteria

1. WHEN viewing class analytics, THE Performance_Analytics SHALL display average, median, and range statistics for percentage scores
2. WHEN comparing students, THE System SHALL provide sortable lists by percentage score, total points, and completion rate
3. WHEN generating reports, THE Performance_Analytics SHALL include distribution charts showing performance ranges
4. THE System SHALL highlight students performing significantly above or below class averages
5. WHEN analytics are displayed, THE System SHALL cache computed statistics for 30 minutes to reduce database queries

### Requirement 6: Data Security and Access Control

**User Story:** As a system administrator, I want to ensure teachers can only access data for their assigned subjects, so that student privacy and data security are maintained.

#### Acceptance Criteria

1. WHEN a teacher logs in, THE Authentication_System SHALL enforce role-based access control limiting data visibility to assigned subjects
2. WHEN API requests are made, THE System SHALL validate teacher permissions before returning student data
3. WHEN displaying student information, THE System SHALL mask or exclude data from subjects not assigned to the requesting teacher
4. THE Authentication_System SHALL use in-memory logging with periodic batch writes to minimize database operations
5. WHEN unauthorized access is attempted, THE System SHALL log security violations using existing error logging mechanisms

### Requirement 7: Performance Data Export

**User Story:** As a teacher, I want to export student performance data, so that I can create detailed reports and share progress with parents or administrators.

#### Acceptance Criteria

1. WHEN a teacher requests data export, THE System SHALL generate reports in common formats (PDF, CSV, Excel)
2. WHEN exporting data, THE System SHALL include student names, percentage scores, raw points, and completion dates
3. WHEN generating exports, THE System SHALL respect subject-area access restrictions for the requesting teacher
4. THE System SHALL allow teachers to select date ranges and specific students for export
5. WHEN exports are created, THE System SHALL include metadata showing export date, teacher name, and subject area

### Requirement 8: Real-time Performance Updates

**User Story:** As a teacher, I want to see student performance updates in real-time, so that I can monitor active learning sessions and provide immediate feedback.

#### Acceptance Criteria

1. WHEN students complete exercises, THE System SHALL update teacher dashboards using existing real-time infrastructure without additional database polling
2. WHEN multiple students are active simultaneously, THE System SHALL use existing websocket connections to handle concurrent updates
3. WHEN network connectivity is interrupted, THE System SHALL use browser-side caching and synchronize using existing mechanisms
4. THE System SHALL display visual indicators using client-side state management without additional database queries
5. WHEN real-time updates occur, THE System SHALL use existing performance optimization strategies