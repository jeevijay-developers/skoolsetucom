# Plan: Executive PRD for SkoolSetu (as-built)

## Deliverable
A single downloadable file: `/mnt/documents/PRD.md` (~5–8 pages).
Scope reflects **only what currently exists** in the codebase + landing page — no aspirational modules.

## Approach
1. Explore the codebase to inventory the actual, implemented feature set:
   - `src/pages/super-admin/*` → Super Admin capabilities
   - `src/pages/school-admin/*` → School Admin / Principal capabilities
   - `src/pages/teacher/*` → Teacher capabilities
   - `src/pages/student/*` → Student / Parent capabilities
   - `src/pages/school-staff/*` + `staff_permissions` → Office Staff sub-admin roles (Finance/Accountant, HR, etc. modeled as permission bundles)
   - `src/components/landing/*` → marketing claims to cross-check
   - `supabase/functions/*` → auxiliary backend capabilities
2. Cross-reference with landing page (`FeaturesSection`, `HeroSection`, memory notes) for tagline, positioning, target market.
3. Write PRD directly to `/mnt/documents/PRD.md`.

## PRD Structure (~5–8 pages)
1. **Overview** — product name, tagline, one-paragraph description, current status.
2. **Vision & Positioning** — problem, solution, differentiators (₹1/day pricing, India-first).
3. **Target Users & Market** — Indian private schools (CBSE/State Board), 200–5000 students.
4. **User Roles** — one subsection each with purpose, primary jobs-to-be-done, and dashboard entry point:
   - Super Admin (SkoolSetu)
   - School Admin / Principal / Director
   - Teacher
   - Student / Parent (shared portal)
   - Finance / Accountant *(realized via Office Staff sub-admin with `can_collect_fee` + `can_manage_payroll`)*
   - HR *(Office Staff sub-admin with payroll + employee-adjacent perms)*
   - Office Staff (generic sub-admin) — permission matrix
   - Librarian / Transport — **noted as not-yet-implemented** (per as-built scope)
5. **Feature Modules** (grouped, terse) — Student Mgmt, Teacher/Employee Mgmt, Class Setup Wizard (with streams for 11th/12th), Attendance, Fees & Collection, Discount Authorities, Invoice Customization, Exams & Results, Report Cards, Assignments, Payroll, Leave Management, Notices, Greetings, Analytics, Class Promotion, Subscriptions & Trials, Coupons, Trial Leads, Staff Access Control, Parent Portal.
6. **Role × Module Permission Matrix** — compact table.
7. **Non-Functional Requirements** — auth (role-based), RLS, subscription gating, responsive UI, PDF/CSV export.
8. **Out of Scope (current release)** — Library, Transport, Hostel, Timetable, LMS/content, biometric attendance.
9. **Success Metrics** — trial→paid conversion, active schools, DAU per school, fee-collection throughput.

## Delivery
- Write file with a single shell heredoc.
- Emit `<presentation-artifact path="PRD.md" mime_type="text/markdown"></presentation-artifact>` so the user can download.
- Short closing sentence — no recap.

## Non-goals for this task
- No code changes.
- No new modules or DB migrations.
- No aspirational features beyond what code + landing page confirm.
