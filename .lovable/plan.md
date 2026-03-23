

## Phase 5: Exams & Analytics Enhancements

### What Already Exists
- Exam CRUD, schedules, marks entry, results viewing, CSV exports, report cards, and basic reports (attendance, results, fees) are all built.

### What Phase 5 Adds

**1. Analytics Dashboard for School Admin** (`/school-admin/reports` — new "Analytics" tab)
- Class-wise performance bar chart (average % per class per exam)
- Subject-wise performance breakdown (identify weak/strong subjects)
- Top 5 and bottom 5 performers per class
- Pass/fail ratio visualization
- Exam-over-exam comparison (track trends across Unit Test 1 → 2 → Half Yearly, etc.)

**2. Teacher Performance Insights** (`/teacher/report-cards` — enhance existing)
- Summary cards: average marks, pass rate, highest/lowest scorer for their classes
- Subject-wise average across classes the teacher handles

**3. Student Progress Tracking** (`/student/results` — enhance existing)
- A simple line/bar chart showing the student's percentage trend across exams
- Subject-wise strength/weakness indicator

### Technical Approach
- No new database tables needed — all analytics derived from existing `exam_results`, `exams`, `students`, `classes` tables
- Use **Recharts** (already in dependencies) for chart components
- Add a new "Analytics" tab in the Reports page with computed aggregations
- Enhance teacher and student result pages with summary stats and charts

### Files Changed
- `src/pages/school-admin/Reports.tsx` — add Analytics tab with charts
- `src/pages/teacher/ReportCards.tsx` — add summary stats
- `src/pages/student/Results.tsx` — add progress chart
- New component: `src/components/analytics/PerformanceCharts.tsx`

### No Database Migration Required
All data already exists in `exam_results`, `exams`, `students`, and `classes`.

