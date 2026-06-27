-- =============================================
-- Migration: Add signup approval workflow
-- =============================================
-- Run this in the Supabase SQL Editor if you already
-- deployed the app and want to add the signup-approval
-- feature WITHOUT re-running the whole schema.sql.
--
-- WHAT THIS DOES:
--   1. Adds a `status` column to customers (pending/approved/rejected).
--      Existing users default to 'approved' so they keep working.
--   2. Adds an index on status (for the pending-approvals list).
--   3. Creates the set_customer_status() RPC that staff call to
--      approve or reject a signup (bypasses RLS via SECURITY DEFINER).
--
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE).
-- =============================================

-- 1. Add status column (idempotent)
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved'
  CHECK (status IN ('pending', 'approved', 'rejected'));

-- Backfill any NULLs (defensive)
UPDATE public.customers SET status = 'approved' WHERE status IS NULL;

-- 2. Index for the pending-approvals list
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);

-- 3. RPC: staff/admin approve or reject a customer
CREATE OR REPLACE FUNCTION public.set_customer_status(
  p_customer_id UUID,
  p_status TEXT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_status TEXT;
BEGIN
  IF NOT public.is_admin_or_employee() THEN
    RETURN json_build_object('success', false, 'error', 'Only staff can approve or reject signups');
  END IF;

  IF p_status NOT IN ('approved', 'rejected', 'pending') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid status');
  END IF;

  SELECT status INTO v_old_status FROM public.customers WHERE id = p_customer_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Customer not found');
  END IF;

  UPDATE public.customers
  SET status = p_status, updated_at = NOW()
  WHERE id = p_customer_id;

  RETURN json_build_object(
    'success', true,
    'customer_id', p_customer_id,
    'old_status', v_old_status,
    'new_status', p_status
  );
END;
$$;

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'status';
