-- =============================================
--  Migration: FIX AUTH ISSUES (sign in / sign up)
-- =============================================
--  Run this in the Supabase SQL Editor if you already deployed the app
--  and want the auth fixes without re-running schema.sql.
--
--  WHAT THIS FIXES:
--    1. Missions self-insert RLS policy
--       Without it, the 3 default missions inserted at signup are silently
--       rejected by RLS (only admin could insert). New customers ended up
--       with an empty missions list forever, even after staff approval.
--
--    2. (Documentation only) Phone normalization
--       The app now strips non-digit characters from phone numbers BEFORE
--       building the synthesized auth email `{phone}@{emailDomain}`. This
--       fixes "Invalid email" errors when users typed `+962 79 123 4567`,
--       `079-123-4567`, etc. No DB change required.
--
--    3. (Documentation only) Removed admin/employee auto-escalation
--       The old `getDefaultRole()` returned 'admin' for phone '000000' and
--       'employee' for phone '111111' AT SIGNUP TIME — so anyone could
--       self-signup as admin. This is now removed; staff accounts are only
--       created via the SQL seed script. No DB change required.
--
--    4. (Documentation only) Removed auto-create-profile on login
--       The old login() auto-created an 'approved' profile if the auth user
--       existed but the customers row didn't — bypassing the signup-approval
--       workflow. Now login() surfaces PROFILE_MISSING instead. No DB change.
--
--  Safe to re-run (uses IF NOT EXISTS).
-- =============================================

-- 1. Missions self-insert policy
--    Allows a freshly-signed-up customer to insert their own 3 default
--    missions (RLS evaluates auth.uid() = customer_id).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'missions'
      AND policyname = 'Users can insert own missions'
  ) THEN
    CREATE POLICY "Users can insert own missions"
      ON public.missions FOR INSERT
      WITH CHECK (customer_id = auth.uid());
    RAISE NOTICE 'Created policy "Users can insert own missions" on public.missions.';
  ELSE
    RAISE NOTICE 'Policy "Users can insert own missions" already exists -- skipping.';
  END IF;
END $$;

-- Verify
SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'missions'
ORDER BY policyname;
