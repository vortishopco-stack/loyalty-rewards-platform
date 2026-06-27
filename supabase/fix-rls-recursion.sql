-- =============================================
-- FIX: Infinite Recursion in RLS Policies
-- Run this in the Supabase SQL Editor
-- =============================================

-- Step 1: Create a SECURITY DEFINER function that reads user role
-- This function runs as the database owner, bypassing RLS, so no recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.customers WHERE id = auth.uid();
$$;

-- Step 2: Create a helper to check if current user is admin or employee
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM public.customers WHERE id = auth.uid() AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.is_employee()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM public.customers WHERE id = auth.uid() AND role = 'employee');
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_employee()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM public.customers WHERE id = auth.uid() AND role IN ('admin', 'employee'));
$$;

-- Step 3: Drop the recursive policies on ALL tables and recreate them

-- ========== CUSTOMERS ==========
DROP POLICY IF EXISTS "Admins can read all customers" ON public.customers;
DROP POLICY IF EXISTS "Employees can read all customers" ON public.customers;

CREATE POLICY "Admins can read all customers"
  ON public.customers FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Employees can read all customers"
  ON public.customers FOR SELECT
  USING (public.is_employee());

-- ========== VISITS ==========
DROP POLICY IF EXISTS "Admins can read all visits" ON public.visits;
DROP POLICY IF EXISTS "Employees can read all visits" ON public.visits;

CREATE POLICY "Admins can read all visits"
  ON public.visits FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Employees can read all visits"
  ON public.visits FOR SELECT
  USING (public.is_employee());

-- ========== GAME HISTORY ==========
DROP POLICY IF EXISTS "Admins can read all game history" ON public.game_history;

CREATE POLICY "Admins can read all game history"
  ON public.game_history FOR SELECT
  USING (public.is_admin());

-- ========== MISSIONS ==========
DROP POLICY IF EXISTS "Admins can read all missions" ON public.missions;
DROP POLICY IF EXISTS "Employees can read all missions" ON public.missions;

CREATE POLICY "Admins can read all missions"
  ON public.missions FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Employees can read all missions"
  ON public.missions FOR SELECT
  USING (public.is_employee());

-- ========== REWARD REDEMPTIONS ==========
DROP POLICY IF EXISTS "Admins can read all redemptions" ON public.reward_redemptions;

CREATE POLICY "Admins can read all redemptions"
  ON public.reward_redemptions FOR SELECT
  USING (public.is_admin());

-- ========== MENU ITEMS ==========
DROP POLICY IF EXISTS "Admins can insert menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Admins can update menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Admins can delete menu items" ON public.menu_items;

CREATE POLICY "Admins can insert menu items"
  ON public.menu_items FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update menu items"
  ON public.menu_items FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete menu items"
  ON public.menu_items FOR DELETE
  USING (public.is_admin());

-- ========== REWARDS ==========
DROP POLICY IF EXISTS "Admins can insert rewards" ON public.rewards;
DROP POLICY IF EXISTS "Admins can update rewards" ON public.rewards;
DROP POLICY IF EXISTS "Admins can delete rewards" ON public.rewards;

CREATE POLICY "Admins can insert rewards"
  ON public.rewards FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update rewards"
  ON public.rewards FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete rewards"
  ON public.rewards FOR DELETE
  USING (public.is_admin());

-- ========== APP SETTINGS ==========
DROP POLICY IF EXISTS "Admins can insert app settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admins can update app settings" ON public.app_settings;

CREATE POLICY "Admins can insert app settings"
  ON public.app_settings FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update app settings"
  ON public.app_settings FOR UPDATE
  USING (public.is_admin());

-- ========== MISSIONS (Admin can manage all) ==========
DROP POLICY IF EXISTS "Admins can insert missions" ON public.missions;
DROP POLICY IF EXISTS "Admins can update missions" ON public.missions;
DROP POLICY IF EXISTS "Admins can delete missions" ON public.missions;

CREATE POLICY "Admins can insert missions"
  ON public.missions FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update missions"
  ON public.missions FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete missions"
  ON public.missions FOR DELETE
  USING (public.is_admin());

-- ========== REWARD REDEMPTIONS (Employee can read all) ==========
DROP POLICY IF EXISTS "Employees can read all redemptions" ON public.reward_redemptions;
CREATE POLICY "Employees can read all redemptions"
  ON public.reward_redemptions FOR SELECT
  USING (public.is_employee());

-- ========== VISITS (Employee can create) ==========
CREATE POLICY IF NOT EXISTS "Employees can create visits"
  ON public.visits FOR INSERT
  WITH CHECK (public.is_admin_or_employee());
