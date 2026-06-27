-- =============================================
--  Migration: PHONE-ONLY auth (drop email requirement)
-- =============================================
--  Run this in the Supabase SQL Editor ONLY if you deployed an earlier
--  version where customers.email was UNIQUE NOT NULL and you now want the
--  phone-only signup flow (no email collected at registration).
--
--  Safe + idempotent: drops the NOT NULL and UNIQUE constraints on
--  customers.email if they exist. Existing data is untouched.
-- =============================================

-- 1) Allow NULL emails (new phone-only signups won't set one)
ALTER TABLE public.customers ALTER COLUMN email DROP NOT NULL;

-- 2) Drop the UNIQUE constraint on email (name can vary by project).
--    This finds and drops whatever UNIQUE constraint covers only `email`.
DO $$
DECLARE
  c_name TEXT;
BEGIN
  SELECT tc.constraint_name INTO c_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
   AND tc.table_schema   = ccu.table_schema
  WHERE tc.table_schema = 'public'
    AND tc.table_name   = 'customers'
    AND tc.constraint_type = 'UNIQUE'
    AND ccu.column_name = 'email'
  LIMIT 1;

  IF c_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.customers DROP CONSTRAINT %I', c_name);
    RAISE NOTICE 'Dropped UNIQUE constraint % on customers.email', c_name;
  ELSE
    RAISE NOTICE 'No UNIQUE constraint on customers.email — nothing to drop.';
  END IF;
END $$;
