

## Phase 6: Bulk Import (without TC Generation)

### Goal
Allow school admins to bulk-import Students, Teachers, and Employees via CSV file upload, instead of adding them one by one.

### What Gets Built

**1. CSV Import for Students** (`/school-admin/students` — new "Import" button)
- Upload a CSV file with columns: Full Name, Roll Number, Admission Number, Class, Section, Gender, Date of Birth, Parent Name, Parent Phone, Parent Email, Address, Blood Group
- Preview parsed rows in a table before confirming import
- Validate required fields (full_name, class matching) and show row-level errors
- Auto-match class names to existing `classes` records
- Skip or flag duplicate admission numbers
- Summary after import: X imported, Y skipped, Z errors

**2. CSV Import for Teachers** (`/school-admin/teachers` — new "Import" button)
- Columns: Full Name, Email, Phone, Employee ID, Qualification, Subjects (comma-separated), Date of Joining
- Same preview-validate-import flow
- Duplicate detection by email

**3. CSV Import for Employees** (`/school-admin/employees` — new "Import" button)
- Columns: Full Name, Category, Employee Code, Phone, Email, Base Salary, Date of Joining, Bank Name, Bank Account, IFSC Code
- Same preview-validate-import flow
- Duplicate detection by employee code or email

**4. Downloadable CSV Templates**
- Each import page offers a "Download Template" button with correct headers and 1-2 sample rows

### Technical Approach
- New shared component: `src/components/import/CSVImporter.tsx` — handles file upload, Papa Parse CSV parsing, preview table, validation, and batch insert
- Add `papaparse` package for CSV parsing
- No new database tables — inserts go into existing `students`, `teachers`, `employees` tables
- Batch inserts use Supabase `.insert()` with arrays (chunked to avoid timeouts)
- Class name resolution: query `classes` table to map "Class 5 - A" to the correct `class_id`

### Files Changed
- New: `src/components/import/CSVImporter.tsx` — reusable CSV import component
- Edit: `src/pages/school-admin/Students.tsx` — add Import button + dialog
- Edit: `src/pages/school-admin/Teachers.tsx` — add Import button + dialog
- Edit: `src/pages/school-admin/Employees.tsx` — add Import button + dialog
- New dependency: `papaparse` + `@types/papaparse`

### No Database Migration Required
All data goes into existing tables.

