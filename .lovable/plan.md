

## Phase 6: Bulk Import (without TC Generation)

### Goal
Allow school admins to bulk-import Students, Teachers, and Employees via CSV file upload.

### What Was Built

**1. Reusable CSVImporter Component** (`src/components/import/CSVImporter.tsx`)
- File upload with drag-and-drop style UI
- Papa Parse CSV parsing with header detection
- Preview table with row-level validation and error indicators
- Batch insert with chunking (50 per batch)
- Duplicate detection by configurable field
- Download CSV template with sample data
- Import summary: imported / skipped / errors

**2. Student CSV Import** — "Import CSV" button on Students page
- Auto-resolves class name + section to class_id
- Duplicate detection by admission number

**3. Teacher CSV Import** — "Import CSV" button on Teachers page
- Subjects parsed from comma-separated string
- Duplicate detection by email

**4. Employee CSV Import** — "Import CSV" button on Employees page
- Category normalized to snake_case
- Duplicate detection by employee code

### Files Changed
- New: `src/components/import/CSVImporter.tsx`
- Edit: `src/pages/school-admin/Students.tsx`
- Edit: `src/pages/school-admin/Teachers.tsx`
- Edit: `src/pages/school-admin/Employees.tsx`
- New dependency: `papaparse` + `@types/papaparse`

### No Database Migration Required
