

## Fix: Remove "Registration Incomplete" blocker in ProtectedRoute

### Problem
After admin account creation, the ProtectedRoute shows a "Registration Incomplete" card because the user role takes time to load. The 2-second timeout fires before `roleLoaded` is true, blocking dashboard access.

### Solution
Use the `roleLoaded` flag from AuthContext instead of an arbitrary 2-second timeout. Only show the incomplete message when `roleLoaded` is true AND `userRole` is null — meaning the role fetch completed but no role was found.

### Changes

**`src/components/ProtectedRoute.tsx`**
- Remove the `useState` for `showIncompleteMessage` and the `setTimeout` logic
- Use `roleLoaded` from `useAuth()` to determine state
- If `loading` or `!roleLoaded` → show spinner
- If `roleLoaded && !userRole` → show the incomplete registration card (but only after role fetch is truly done, not after an arbitrary timer)
- This eliminates the false-positive "incomplete" screen that appears during normal role loading

This is a single-file fix with no database changes.

