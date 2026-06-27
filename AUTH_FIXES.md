# Sign In / Sign Up — Fixes Applied

This document summarizes the bugs found in the auth flow and the fixes applied.

## Bugs fixed

### 1. Phone number not normalized → "Invalid email" from Supabase
**File:** `src/lib/brand.ts`

The app synthesizes an auth email as `${phone}@${emailDomain}`. If a user
typed anything other than pure digits (`+962 79 123 4567`, `079-123-4567`,
spaces, parens, etc.), Supabase Auth rejected the email as invalid and both
login and signup failed.

**Fix:** Added `normalizePhone(phone)` which strips everything except digits.
Used in `phoneToEmail()`, in `api.login()`, `api.signup()`, and in the
`auth-screen.tsx` phone inputs (so the user sees exactly what we'll send).

---

### 2. Default missions silently rejected by RLS at signup
**Files:** `supabase/schema.sql`, `supabase/migrate-fix-auth-issues.sql`

The signup flow inserts 3 default missions for every new customer. But the
missions RLS policy only allowed admin INSERT:
```sql
CREATE POLICY "Admins can insert missions"
  ON public.missions FOR INSERT
  WITH CHECK (public.is_admin());
```
Signup runs as the just-signed-up CUSTOMER, so the INSERT was silently
denied. The error was also swallowed (no `error` check). Net effect: every
new customer — even after staff approval — saw an empty missions list
forever.

**Fix:**
- Added a new RLS policy:
  ```sql
  CREATE POLICY "Users can insert own missions"
    ON public.missions FOR INSERT
    WITH CHECK (customer_id = auth.uid());
  ```
- The signup flow now checks the missions INSERT error and logs it (instead
  of swallowing it silently).
- Existing deployments can apply `supabase/migrate-fix-auth-issues.sql`.

---

### 3. Admin / employee self-escalation at signup
**File:** `src/lib/api.ts` (removed `getDefaultRole`)

The old `getDefaultRole()` returned `'admin'` for phone `'000000'` and
`'employee'` for phone `'111111'`. So anyone could self-signup as admin by
typing `000000` in the signup form.

**Fix:** Removed the helper. Every self-signup is now hardcoded to
`role: 'customer'`. Admin/employee accounts can only be created via the
SQL seed script.

---

### 4. Auto-create profile on login bypassed the signup-approval workflow
**File:** `src/lib/api.ts`

If `signInWithPassword` succeeded but no `customers` row existed, the old
code auto-created one with `status: 'approved'` and (via `getDefaultRole`)
potentially the admin role. This was a security hole — anyone with an auth
user (e.g., created via some other path) was auto-approved.

**Fix:** Removed the auto-create. Login now throws `PROFILE_MISSING` and
signs the user out, with a friendly toast telling them to contact staff.

---

### 5. No-session-after-signUp not handled (email confirmation on)
**File:** `src/lib/api.ts`

If the Supabase project has "Confirm email" enabled, `signUp` returns a user
but no session. Without a session, RLS denies every write (`auth.uid()` is
null), so the customer INSERT would fail, and the function would return
`{ user: null, token: '' }` — leaving the app in a broken half-auth state.

**Fix:** After `signUp`, check `data.session`. If null, throw
`EMAIL_CONFIRMATION_REQUIRED` with a friendly message telling the user to
disable email confirmation in Supabase (since this is a phone-only app).

---

### 6. Raw Supabase error messages shown to users
**Files:** `src/lib/api.ts`, `src/components/auth/auth-screen.tsx`,
`src/lib/i18n/locales/en.ts`, `src/lib/i18n/locales/ar.ts`

Errors like "Invalid login credentials", "User already registered",
"Email not confirmed" were shown verbatim — confusing, especially for
Arabic users.

**Fix:**
- New `AuthError` class + `mapAuthError()` helper translate raw Supabase
  errors into friendly codes (`INVALID_CREDENTIALS`,
  `USER_ALREADY_REGISTERED`, `EMAIL_CONFIRMATION_REQUIRED`, etc.).
- `auth-screen.tsx` has a `showAuthError()` switch that maps each code to a
  translated toast (title + description).
- Added 14 new i18n keys (`errInvalidCredentials`, `errUserAlreadyRegistered`,
  …) to both `en.ts` and `ar.ts`.

---

### 7. Signup form not reset after `SIGNUP_PENDING`
**File:** `src/components/auth/auth-screen.tsx`

After a successful signup (which throws `SIGNUP_PENDING`), the form kept
the user's input and stayed on the signup tab. No clear next step.

**Fix:** After `SIGNUP_PENDING`:
- Reset the signup form (phone, name, password all cleared)
- Switch to the login tab (so the user knows where to come back after
  staff approval)

---

### 8. "User already registered" not handled on signup
**File:** `src/lib/api.ts`

If a phone was already registered (even with status='rejected'), signup
threw "User already registered" with no clear path forward.

**Fix:** `mapAuthError()` now maps this to `USER_ALREADY_REGISTERED` with
a description telling the user to either sign in or contact staff.

---

### Bonus: Session-restore status check
**File:** `src/app/page.tsx`

On page reload, the existing-code logged the user in if their auth session
existed and a profile was found — without checking `status`. A user whose
account was rejected after their last login would still be logged in via
the stale localStorage session.

**Fix:** The session-restore now checks `profile.status`. If it's
`'pending'` or `'rejected'`, the user is signed out and will see the
appropriate error message when they next try to log in.

---

## Files changed

| File | Change |
|------|--------|
| `src/lib/brand.ts` | Added `normalizePhone()`; `phoneToEmail()` uses it |
| `src/lib/api.ts` | New `AuthError` class + `mapAuthError()`; rewrote `login()` and `signup()`; removed `getDefaultRole()` |
| `src/components/auth/auth-screen.tsx` | New `showAuthError()`; controlled tab state; phone input normalization; form reset on `SIGNUP_PENDING` |
| `src/app/page.tsx` | Session-restore now checks `profile.status` |
| `src/lib/i18n/locales/en.ts` | +14 error message keys; removed duplicate `enterPhone` |
| `src/lib/i18n/locales/ar.ts` | +14 error message keys (Arabic); removed duplicate `enterPhone` |
| `supabase/schema.sql` | Added `Users can insert own missions` RLS policy |
| `supabase/migrate-fix-auth-issues.sql` | **NEW** — migration for existing deployments |
| `README.md` | Added the new migration to the migrations table |

## How to deploy the fixes

### For a NEW deployment
Just use the updated `supabase/schema.sql` — it already includes the new
missions RLS policy.

### For an EXISTING deployment
1. Run `supabase/migrate-fix-auth-issues.sql` in the Supabase SQL Editor.
2. Redeploy the app (push to GitHub → GitHub Actions re-builds).
3. **Important:** In Supabase → Authentication → Providers → Email,
   make sure "Confirm email" is **OFF**. This app is phone-only — email
   confirmation breaks signup because no email is ever sent.
