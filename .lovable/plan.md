

## Plan: Change Trial Period from 1 Day to 14 Days

### Changes Required

#### 1. Database Migration
Alter the `subscriptions` table default for `trial_end_date` from `now() + interval '1 day'` to `now() + interval '14 days'`.

```sql
ALTER TABLE public.subscriptions 
ALTER COLUMN trial_end_date SET DEFAULT (now() + interval '14 days');
```

#### 2. Database Function Update
Update `complete_school_registration` function — the trial subscription insert currently relies on the column default, so the migration above covers it. Need to verify no hardcoded interval there.

#### 3. UI Text Updates (5 files)

| File | Change |
|------|--------|
| `src/components/landing/HeroSection.tsx` | "1 Day Free Trial" → "14 Days Free Trial" |
| `src/components/landing/CTASection.tsx` | "1 Day Free Trial" → "14 Days Free Trial", update description text |
| `src/pages/Register.tsx` | "1-Day Free Trial" → "14-Day Free Trial", meta description, success message |
| `src/components/landing/PricingSection.tsx` | No text change needed (just says "Start Free Trial") |
| `src/components/landing/Header.tsx` | No text change needed |

#### 4. Memory Update
The business model memory says "1-day free trial" — will be updated to 14 days.

### Summary
- 1 database migration (change default interval)
- 3 files with UI text updates
- All existing trials in the database will keep their current end dates; only new trials get 14 days

