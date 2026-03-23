

## Phase 4: Homework & Assignments (Teacher-Only, No Submissions)

### Scope
Teachers create and distribute assignments to students. Students can only **view** assigned homework. No submission, file upload, or grading functionality.

### Database Changes

**New table: `assignments`**
- `id` (uuid, PK)
- `school_id` (uuid, NOT NULL)
- `class_id` (uuid, NOT NULL)
- `subject` (text, NOT NULL)
- `title` (text, NOT NULL)
- `description` (text)
- `due_date` (date)
- `created_by` (uuid) — teacher's user_id
- `academic_year` (text, default '2024-25')
- `is_published` (boolean, default true)
- `created_at` (timestamptz)

**RLS:**
- School admins: full access (school-scoped)
- Teachers: INSERT + UPDATE own assignments (school-scoped)
- School members: SELECT (school-scoped)

### New Pages & Routes

1. **`/teacher/assignments`** — Teacher creates assignments: select class, subject, title, description, due date. Lists their created assignments with edit/delete.

2. **`/student/assignments`** — Read-only view of assignments for the student's class, sorted by due date, showing subject, title, description, and due date.

### Navigation Updates
- Add "Assignments" to teacher sidebar
- Add "Assignments" to student sidebar

### What Is Excluded
- No `assignment_submissions` table
- No file upload / storage bucket
- No student submission UI
- No grading interface

