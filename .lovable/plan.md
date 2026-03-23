

## Phased Implementation Plan: Missing Features

Based on the feature checklist audit, here are the missing features organized into implementable phases. Each phase is scoped to avoid hallucination and can be tested end-to-end before moving to the next.

---

### Phase 1: Student Management Enhancements
**Scope:** Extend student profiles and add class promotion

| Task | Details |
|------|---------|
| Extend student profile fields | Add emergency contact, medical notes, previous school, nationality to `students` table |
| Student profile detail view | Create a full student profile page with all fields organized in tabs |
| Class promotion (bulk + individual) | Year-end promotion dialog: select class, promote all or individual students to next class/section, with detention option |
| Section/class transfer | Move a student between sections or classes mid-year |

**DB changes:** Migration to add columns to `students` table. New `student_promotions` table for audit trail.

---

### Phase 2: Staff Leave Management
**Scope:** Complete leave management module for employees

| Task | Details |
|------|---------|
| Leave types table | Create `leave_types` table (casual, sick, earned, etc.) with configurable balance per year |
| Leave applications table | Create `leave_applications` table with status workflow (pending/approved/rejected) |
| Leave balance tracking | Create `leave_balances` table per employee per leave type per year |
| Admin leave management page | New page: `/school-admin/leaves` — view/approve/reject leave applications, configure leave types |
| Teacher leave application | Teachers can apply for leave from their dashboard |
| Payroll integration | Show leave deductions in payroll processing |

**DB changes:** 3 new tables with RLS. New nav item in sidebar.

---

### Phase 3: Academic Calendar & Timetable
**Scope:** Calendar with holidays/events and timetable management

| Task | Details |
|------|---------|
| Academic calendar table | Create `academic_events` table (holidays, events, PTM, exams) |
| Calendar page | New page: `/school-admin/calendar` — month view with events, add/edit/delete events |
| Timetable tables | Create `timetable_periods` (config) and `timetable_entries` (class/day/period/subject/teacher) |
| Timetable management page | New page: `/school-admin/timetable` — grid-based timetable editor per class, conflict detection for teacher double-booking |
| Teacher timetable view | Teachers see their own timetable on `/teacher/timetable` |
| Student timetable view | Students see their class timetable on `/student/timetable` |

**DB changes:** 3 new tables. 3 new pages + routes.

---

### Phase 4: Homework & Assignments
**Scope:** Assignment creation, submission, and grading

| Task | Details |
|------|---------|
| Assignments table | Create `assignments` table (class, subject, title, description, due_date, attachments, created_by) |
| Assignment submissions table | Create `assignment_submissions` table (student, assignment, file_url, submitted_at, grade, remarks) |
| Teacher assignments page | New page: `/teacher/assignments` — create, view submissions, grade |
| Student assignments view | New page: `/student/assignments` — view, submit, see grades |
| File upload support | Use storage bucket for assignment file attachments |

**DB changes:** 2 new tables, 1 storage bucket. 2 new pages.

---

### Phase 5: Enhanced Exams & Analytics
**Scope:** Admit cards, rank lists, performance charts

| Task | Details |
|------|---------|
| Admit card generation | Generate printable admit cards from exam schedules with student photo and details |
| Rank/merit list | Auto-calculate ranks per class per exam, show class toppers |
| Performance trend charts | Add recharts-based graphs: subject-wise performance, student trend over exams, class vs school average |
| Dashboard charts | Add attendance trend chart, fee collection chart, exam analytics to admin dashboard |

**DB changes:** Minimal (computed from existing data). Mostly UI work with recharts.

---

### Phase 6: Bulk Import & TC Generation
**Scope:** CSV import and transfer certificate

| Task | Details |
|------|---------|
| Bulk student import | CSV upload → parse → preview → import students with class assignment |
| Bulk staff import | CSV upload → parse → preview → import employees |
| TC generation | Transfer certificate PDF with school header, student details, conduct, reason for leaving |
| Audit log table | Create `audit_logs` table, log critical actions (student add/delete, fee collection, promotion) |

**DB changes:** 1 new table. Edge function for CSV parsing. PDF generation utils.

---

### Phase 7: Communication & Notifications
**Scope:** In-app messaging and notification system

| Task | Details |
|------|---------|
| Messages table | Create `messages` table (sender, receiver, content, read_at) with realtime |
| In-app messaging | Parent-teacher messaging interface accessible from both portals |
| Notification preferences | User-level notification settings |
| PTM scheduling | Create `ptm_schedules` table, admin creates PTM slots, parents book slots |

**DB changes:** 2 new tables with realtime enabled. New pages for messaging.

---

### Implementation Order & Testing

Each phase will be implemented as a separate request. After each phase:
1. All new DB tables created with proper RLS
2. New pages added with routes and sidebar navigation
3. Full CRUD operations tested
4. Role-based access verified

**Recommended starting order:** Phase 1 → 2 → 3 → 4 → 5 → 6 → 7

Which phase would you like me to start with?

