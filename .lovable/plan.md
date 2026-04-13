

## Plan: Class Setup Wizard + Section Management

### Overview
Add a post-registration class setup dialog, improve section management in the Classes page, and make student/teacher forms use dynamic class-then-section dropdowns.

### Current State
- `classes` table has `name` and `section` columns — each row is one class-section combo (e.g., "6th" + "A")
- Students pick a single `class_id` dropdown showing "6th - A"
- Teachers are assigned to classes via `teacher_classes` table
- No structured class setup during registration

### Changes

**1. New Component: `src/components/class-setup/ClassSetupWizard.tsx`**
- Full-screen dialog shown after registration completes (before navigating to dashboard)
- Step 1: Checkboxes for class categories with predefined classes:
  - Pre-Primary: Nursery, LKG, UKG
  - Primary: 1st to 5th
  - Secondary: 6th to 10th
  - Senior Secondary: 11th, 12th
- Step 2: For each selected class, a number input (default 1) to set how many sections (A, B, C, D...)
- On submit: bulk-insert into `classes` table (e.g., "6th" with section "A", "6th" with section "B", etc.)
- No fee structures required at this stage — admin can add them later in Classes page

**2. Edit `src/pages/Register.tsx`**
- After successful registration and role assignment, instead of navigating directly to `/school-admin`, show the ClassSetupWizard dialog
- Pass `schoolId` to the wizard; on wizard completion, navigate to dashboard
- Add a "Skip" option to go straight to dashboard

**3. Edit `src/pages/school-admin/Classes.tsx`**
- Add "Add Section" button on each class row — creates a new section (next letter) for that class name
- Group classes by name in the display so "6th-A, 6th-B, 6th-C" appear together
- Default section to "A" when creating a new class if no section is specified

**4. Edit `src/pages/school-admin/Students.tsx` — Dynamic Class + Section Dropdowns**
- Replace single class dropdown with two dropdowns:
  - Dropdown 1: Unique class names (e.g., "6th", "7th")
  - Dropdown 2: Sections for selected class (e.g., "A", "B", "C") — populated dynamically
- If a class has only 1 section, auto-select it
- Set `class_id` based on the name+section combination

**5. Edit `src/pages/school-admin/Teachers.tsx` — Same Dynamic Dropdowns**
- Where teachers are assigned to classes, use the same class-then-section pattern
- Teacher assignment should be to a specific class+section (which maps to a `class_id`)

### No Database Migration Required
The existing `classes` table already supports `name` + `section` per row. The wizard just bulk-inserts rows.

### Files Changed
- New: `src/components/class-setup/ClassSetupWizard.tsx`
- Edit: `src/pages/Register.tsx`
- Edit: `src/pages/school-admin/Classes.tsx`
- Edit: `src/pages/school-admin/Students.tsx`
- Edit: `src/pages/school-admin/Teachers.tsx`

