-- =============================================
-- Loyalty Platform - Supabase Database Schema
-- Run this in the Supabase SQL Editor
-- =============================================

-- =============================================
-- 1. TABLES
-- =============================================

-- Customers (extends auth.users)
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,            -- optional: app is PHONE-ONLY, no email is ever collected
  name TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'employee', 'admin')),
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Visits
CREATE TABLE IF NOT EXISTS public.visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  invoice_amount FLOAT NOT NULL,
  points_earned INTEGER NOT NULL,
  created_by UUID NOT NULL REFERENCES public.customers(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu Items
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price FLOAT NOT NULL,
  category TEXT DEFAULT 'Main',
  image_url TEXT DEFAULT '',
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu Categories (admin-managed category metadata: name, icon, color, sort order, visibility)
-- Each row's `name` matches the `category` text stored on menu_items.
-- `display_name` is what customers see in the menu (can differ from internal name).
CREATE TABLE IF NOT EXISTS public.menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  icon TEXT DEFAULT 'UtensilsCrossed',
  color TEXT DEFAULT 'from-amber-500/20 to-orange-500/20',
  sort_order INTEGER DEFAULT 0,
  visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rewards
CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  points_cost INTEGER NOT NULL,
  image_url TEXT DEFAULT '',
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game History
CREATE TABLE IF NOT EXISTS public.game_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,
  entry_cost INTEGER NOT NULL,
  winnings INTEGER NOT NULL DEFAULT 0,
  played_at TIMESTAMPTZ DEFAULT NOW()
);

-- App Settings
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Missions
CREATE TABLE IF NOT EXISTS public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  target INTEGER NOT NULL,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reward Redemptions
CREATE TABLE IF NOT EXISTS public.reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  points_cost INTEGER NOT NULL,
  redeemed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Sign-Ins
CREATE TABLE IF NOT EXISTS public.daily_sign_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  sign_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
  points_awarded INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, sign_in_date)
);

-- =============================================
-- 2. INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_role ON public.customers(role);
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);
CREATE INDEX IF NOT EXISTS idx_visits_customer ON public.visits(customer_id);
CREATE INDEX IF NOT EXISTS idx_game_history_customer ON public.game_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_game_history_game_type ON public.game_history(game_type);
CREATE INDEX IF NOT EXISTS idx_missions_customer ON public.missions(customer_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_customer ON public.reward_redemptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_daily_sign_ins_customer ON public.daily_sign_ins(customer_id);
CREATE INDEX IF NOT EXISTS idx_daily_sign_ins_date ON public.daily_sign_ins(sign_in_date);
CREATE INDEX IF NOT EXISTS idx_menu_categories_sort ON public.menu_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_menu_categories_visible ON public.menu_categories(visible);

-- =============================================
-- 3. HELPER FUNCTIONS (SECURITY DEFINER - bypasses RLS to avoid recursion)
-- =============================================
-- IMPORTANT: These must be created BEFORE RLS policies that reference them!

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.customers WHERE id = auth.uid();
$$;

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

-- =============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_sign_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

-- ---------- Customers ----------
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.customers FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.customers FOR UPDATE
  USING (auth.uid() = id);

-- Admins can read all customers (uses helper function to avoid recursion)
CREATE POLICY "Admins can read all customers"
  ON public.customers FOR SELECT
  USING (public.is_admin());

-- Employees can read all customers (uses helper function to avoid recursion)
CREATE POLICY "Employees can read all customers"
  ON public.customers FOR SELECT
  USING (public.is_employee());

-- Anyone can insert (for signup)
CREATE POLICY "Allow signup insert"
  ON public.customers FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ---------- Visits ----------
-- Users can read their own visits
CREATE POLICY "Users can read own visits"
  ON public.visits FOR SELECT
  USING (customer_id = auth.uid());

-- Admins can read all visits
CREATE POLICY "Admins can read all visits"
  ON public.visits FOR SELECT
  USING (public.is_admin());

-- Employees can read all visits
CREATE POLICY "Employees can read all visits"
  ON public.visits FOR SELECT
  USING (public.is_employee());

-- Visits are created via RPC function (add_visit)

-- ---------- Menu Items ----------
-- Public read access
CREATE POLICY "Public read menu items"
  ON public.menu_items FOR SELECT
  USING (true);

-- Admins can manage menu items
CREATE POLICY "Admins can insert menu items"
  ON public.menu_items FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update menu items"
  ON public.menu_items FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete menu items"
  ON public.menu_items FOR DELETE
  USING (public.is_admin());

-- ---------- Menu Categories ----------
-- Public read access (so anonymous menu-preview users can see categories too)
CREATE POLICY "Public read menu categories"
  ON public.menu_categories FOR SELECT
  USING (true);

-- Admins can manage menu categories
CREATE POLICY "Admins can insert menu categories"
  ON public.menu_categories FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update menu categories"
  ON public.menu_categories FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete menu categories"
  ON public.menu_categories FOR DELETE
  USING (public.is_admin());

-- ---------- Rewards ----------
-- Public read access
CREATE POLICY "Public read rewards"
  ON public.rewards FOR SELECT
  USING (true);

-- Admins can manage rewards
CREATE POLICY "Admins can insert rewards"
  ON public.rewards FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update rewards"
  ON public.rewards FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete rewards"
  ON public.rewards FOR DELETE
  USING (public.is_admin());

-- ---------- Game History ----------
-- Users can read their own game history
CREATE POLICY "Users can read own game history"
  ON public.game_history FOR SELECT
  USING (customer_id = auth.uid());

-- Admins can read all game history
CREATE POLICY "Admins can read all game history"
  ON public.game_history FOR SELECT
  USING (public.is_admin());

-- Game history is created via RPC function (play_game)

-- ---------- App Settings ----------
-- Public read access
CREATE POLICY "Public read app settings"
  ON public.app_settings FOR SELECT
  USING (true);

-- Admins can manage settings
CREATE POLICY "Admins can insert app settings"
  ON public.app_settings FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update app settings"
  ON public.app_settings FOR UPDATE
  USING (public.is_admin());

-- ---------- Missions ----------
-- Users can read their own missions
CREATE POLICY "Users can read own missions"
  ON public.missions FOR SELECT
  USING (customer_id = auth.uid());

-- Admins can read all missions
CREATE POLICY "Admins can read all missions"
  ON public.missions FOR SELECT
  USING (public.is_admin());

-- Employees can read all missions
CREATE POLICY "Employees can read all missions"
  ON public.missions FOR SELECT
  USING (public.is_employee());

-- Admins can insert missions
CREATE POLICY "Admins can insert missions"
  ON public.missions FOR INSERT
  WITH CHECK (public.is_admin());

-- Users can insert their OWN missions (for the default-missions step of signup).
-- Without this policy, the 3 default missions inserted by api.signup() are
-- silently rejected by RLS -- new customers see an empty missions list forever.
CREATE POLICY "Users can insert own missions"
  ON public.missions FOR INSERT
  WITH CHECK (customer_id = auth.uid());

-- Admins can update missions
CREATE POLICY "Admins can update missions"
  ON public.missions FOR UPDATE
  USING (public.is_admin());

-- Admins can delete missions
CREATE POLICY "Admins can delete missions"
  ON public.missions FOR DELETE
  USING (public.is_admin());

-- Missions are managed via RPC functions

-- ---------- Reward Redemptions ----------
-- Users can read their own redemptions
CREATE POLICY "Users can read own redemptions"
  ON public.reward_redemptions FOR SELECT
  USING (customer_id = auth.uid());

-- Admins can read all redemptions
CREATE POLICY "Admins can read all redemptions"
  ON public.reward_redemptions FOR SELECT
  USING (public.is_admin());

-- Redemptions are created via RPC function (redeem_reward)

-- ---------- Daily Sign-Ins ----------
-- Users can read their own daily sign-ins
CREATE POLICY "Users can read own daily sign-ins"
  ON public.daily_sign_ins FOR SELECT
  USING (customer_id = auth.uid());

-- Admins can read all daily sign-ins
CREATE POLICY "Admins can read all daily sign-ins"
  ON public.daily_sign_ins FOR SELECT
  USING (public.is_admin());

-- Daily sign-ins are created via RPC function (claim_daily_sign_in)

-- =============================================
-- 5. POSTGRESQL FUNCTIONS (RPC)
-- =============================================

-- ADD VISIT: Employee adds a visit for a customer
CREATE OR REPLACE FUNCTION public.add_visit(
  p_customer_id UUID,
  p_invoice_amount FLOAT,
  p_created_by UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_points_per_currency FLOAT;
  v_points_earned INT;
  v_new_points INT;
  v_visit_id UUID;
  v_mission RECORD;
  v_new_progress INT;
  v_total_spend FLOAT;
  v_mission_points INT;
BEGIN
  -- Get points per currency setting
  SELECT (value)::FLOAT INTO v_points_per_currency
  FROM public.app_settings WHERE key = 'points_per_currency';

  IF v_points_per_currency IS NULL THEN
    v_points_per_currency := 1;
  END IF;

  v_points_earned := FLOOR(p_invoice_amount * v_points_per_currency);

  -- Create visit
  INSERT INTO public.visits (id, customer_id, invoice_amount, points_earned, created_by)
  VALUES (gen_random_uuid(), p_customer_id, p_invoice_amount, v_points_earned, p_created_by)
  RETURNING id INTO v_visit_id;

  -- Update customer points and visits
  UPDATE public.customers
  SET points = points + v_points_earned,
      total_visits = total_visits + 1,
      updated_at = NOW()
  WHERE id = p_customer_id
  RETURNING points INTO v_new_points;

  -- Update missions
  FOR v_mission IN
    SELECT id, type, target, progress, points AS mission_points, completed
    FROM public.missions
    WHERE customer_id = p_customer_id AND completed = false
  LOOP
    v_new_progress := v_mission.progress;

    IF v_mission.type IN ('visit_5', 'visit_10') THEN
      SELECT total_visits INTO v_new_progress
      FROM public.customers WHERE id = p_customer_id;
    ELSIF v_mission.type = 'spend_200' THEN
      SELECT COALESCE(FLOOR(SUM(invoice_amount)), 0) INTO v_new_progress
      FROM public.visits WHERE customer_id = p_customer_id;
    END IF;

    IF v_new_progress >= v_mission.target THEN
      UPDATE public.missions SET progress = v_new_progress, completed = true, updated_at = NOW()
      WHERE id = v_mission.id;

      -- Award mission points
      v_mission_points := v_mission.mission_points;
      IF v_mission_points > 0 THEN
        UPDATE public.customers SET points = points + v_mission_points, updated_at = NOW()
        WHERE id = p_customer_id;
        v_new_points := v_new_points + v_mission_points;
      END IF;
    ELSE
      UPDATE public.missions SET progress = v_new_progress, updated_at = NOW()
      WHERE id = v_mission.id;
    END IF;
  END LOOP;

  RETURN json_build_object(
    'visit_id', v_visit_id,
    'points_earned', v_points_earned,
    'new_points_balance', v_new_points
  );
END;
$$;

-- PLAY GAME: Record a game play with entry cost and winnings
CREATE OR REPLACE FUNCTION public.play_game(
  p_customer_id UUID,
  p_game_type TEXT,
  p_winnings INT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_entry_cost INT;
  v_cooldown_days INT;
  v_last_play TIMESTAMPTZ;
  v_cooldown_ms BIGINT;
  v_time_since BIGINT;
  v_remaining_hours INT;
  v_new_points INT;
  v_game_id UUID;
BEGIN
  -- Get game cost from settings
  SELECT (value)::INT INTO v_entry_cost
  FROM public.app_settings WHERE key = 'game_cost_' || p_game_type;
  IF v_entry_cost IS NULL THEN
    CASE p_game_type
      WHEN 'burger_catch' THEN v_entry_cost := 50;
      WHEN 'coffee_shooter' THEN v_entry_cost := 50;
      WHEN 'grand_wheel' THEN v_entry_cost := 100;
      WHEN 'predict_match' THEN v_entry_cost := 60;
      WHEN 'shoot_target' THEN v_entry_cost := 60;
      WHEN 'lucky_scratch' THEN v_entry_cost := 40;
      ELSE v_entry_cost := 50;
    END CASE;
  END IF;

  -- Block hidden (disabled) games from being played
  IF EXISTS (
    SELECT 1 FROM public.app_settings
    WHERE key = 'game_enabled_' || p_game_type AND value = 'false'
  ) THEN
    RETURN json_build_object('error', 'This game is currently unavailable');
  END IF;

  -- Get cooldown from settings
  SELECT (value)::INT INTO v_cooldown_days
  FROM public.app_settings WHERE key = 'game_cooldown_' || p_game_type;
  IF v_cooldown_days IS NULL THEN
    CASE p_game_type
      WHEN 'burger_catch' THEN v_cooldown_days := 7;
      WHEN 'coffee_shooter' THEN v_cooldown_days := 7;
      WHEN 'grand_wheel' THEN v_cooldown_days := 30;
      WHEN 'predict_match' THEN v_cooldown_days := 7;
      WHEN 'shoot_target' THEN v_cooldown_days := 7;
      WHEN 'lucky_scratch' THEN v_cooldown_days := 3;
      ELSE v_cooldown_days := 7;
    END CASE;
  END IF;

  -- Check cooldown
  SELECT played_at INTO v_last_play
  FROM public.game_history
  WHERE customer_id = p_customer_id AND game_type = p_game_type
  ORDER BY played_at DESC LIMIT 1;

  IF v_last_play IS NOT NULL THEN
    v_cooldown_ms := v_cooldown_days * 24 * 60 * 60 * 1000;
    v_time_since := EXTRACT(EPOCH FROM (NOW() - v_last_play)) * 1000;
    IF v_time_since < v_cooldown_ms THEN
      v_remaining_hours := CEIL((v_cooldown_ms - v_time_since) / 3600000.0);
      RETURN json_build_object(
        'error', 'Cooldown active. Try again in ' || v_remaining_hours || ' hours',
        'cooldown_remaining', v_cooldown_ms - v_time_since
      );
    END IF;
  END IF;

  -- Check sufficient points
  IF NOT EXISTS (SELECT 1 FROM public.customers WHERE id = p_customer_id AND points >= v_entry_cost) THEN
    RETURN json_build_object('error', 'Insufficient points');
  END IF;

  -- Deduct entry cost
  UPDATE public.customers
  SET points = points - v_entry_cost, updated_at = NOW()
  WHERE id = p_customer_id;

  -- Record game
  INSERT INTO public.game_history (id, customer_id, game_type, entry_cost, winnings)
  VALUES (gen_random_uuid(), p_customer_id, p_game_type, v_entry_cost, p_winnings)
  RETURNING id INTO v_game_id;

  -- Add winnings
  IF p_winnings > 0 THEN
    UPDATE public.customers
    SET points = points + p_winnings, updated_at = NOW()
    WHERE id = p_customer_id;
  END IF;

  -- Get new balance
  SELECT points INTO v_new_points FROM public.customers WHERE id = p_customer_id;

  RETURN json_build_object(
    'game_id', v_game_id,
    'entry_cost', v_entry_cost,
    'winnings', p_winnings,
    'new_points_balance', v_new_points
  );
END;
$$;

-- REDEEM REWARD: Redeem a reward for a customer (STAFF ONLY - admin/employee)
CREATE OR REPLACE FUNCTION public.redeem_reward(
  p_customer_id UUID,
  p_reward_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reward_name TEXT;
  v_points_cost INT;
  v_customer_points INT;
  v_new_points INT;
  v_redemption_id UUID;
BEGIN
  -- Only admin or employee can redeem rewards (customers cannot redeem themselves)
  IF NOT public.is_admin_or_employee() THEN
    RETURN json_build_object('error', 'Only staff can redeem rewards. Please ask an employee.');
  END IF;

  -- Get reward details
  SELECT name, points_cost INTO v_reward_name, v_points_cost
  FROM public.rewards WHERE id = p_reward_id AND available = true;

  IF v_reward_name IS NULL THEN
    RETURN json_build_object('error', 'Reward not available');
  END IF;

  -- Check sufficient points
  SELECT points INTO v_customer_points
  FROM public.customers WHERE id = p_customer_id;

  IF v_customer_points < v_points_cost THEN
    RETURN json_build_object('error', 'Insufficient points');
  END IF;

  -- Deduct points
  UPDATE public.customers
  SET points = points - v_points_cost, updated_at = NOW()
  WHERE id = p_customer_id;

  -- Create redemption
  INSERT INTO public.reward_redemptions (id, customer_id, reward_id, points_cost)
  VALUES (gen_random_uuid(), p_customer_id, p_reward_id, v_points_cost)
  RETURNING id INTO v_redemption_id;

  -- Get new balance
  SELECT points INTO v_new_points FROM public.customers WHERE id = p_customer_id;

  RETURN json_build_object(
    'redemption_id', v_redemption_id,
    'new_points_balance', v_new_points,
    'reward_name', v_reward_name
  );
END;
$$;

-- CLAIM DAILY SIGN-IN: Award daily sign-in points
CREATE OR REPLACE FUNCTION public.claim_daily_sign_in(
  p_customer_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_points_awarded INT;
  v_new_points INT;
  v_sign_in_id UUID;
  v_streak INT;
  v_already_claimed BOOLEAN;
BEGIN
  -- Get points amount from settings (default 5)
  SELECT (value)::INT INTO v_points_awarded
  FROM public.app_settings WHERE key = 'daily_sign_in_points';
  IF v_points_awarded IS NULL THEN
    v_points_awarded := 5;
  END IF;

  -- Check if already claimed today
  SELECT EXISTS (
    SELECT 1 FROM public.daily_sign_ins
    WHERE customer_id = p_customer_id AND sign_in_date = CURRENT_DATE
  ) INTO v_already_claimed;

  IF v_already_claimed THEN
    RETURN json_build_object('error', 'Already claimed today');
  END IF;

  -- Calculate streak (consecutive days)
  SELECT COUNT(*) INTO v_streak
  FROM public.daily_sign_ins
  WHERE customer_id = p_customer_id
    AND sign_in_date >= CURRENT_DATE - INTERVAL '6 days'
    AND sign_in_date < CURRENT_DATE;

  -- Insert sign-in record
  INSERT INTO public.daily_sign_ins (id, customer_id, sign_in_date, points_awarded)
  VALUES (gen_random_uuid(), p_customer_id, CURRENT_DATE, v_points_awarded)
  RETURNING id INTO v_sign_in_id;

  -- Award points
  UPDATE public.customers
  SET points = points + v_points_awarded, updated_at = NOW()
  WHERE id = p_customer_id;

  -- Get new balance
  SELECT points INTO v_new_points FROM public.customers WHERE id = p_customer_id;

  RETURN json_build_object(
    'sign_in_id', v_sign_in_id,
    'points_awarded', v_points_awarded,
    'new_points_balance', v_new_points,
    'streak', v_streak + 1
  );
END;
$$;

-- Approve or reject a pending customer signup (staff/admin only)
-- SECURITY DEFINER bypasses RLS so staff can update ANOTHER user's status row.
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
  -- Only staff/admin can call this
  IF NOT public.is_admin_or_employee() THEN
    RETURN json_build_object('success', false, 'error', 'Only staff can approve or reject signups');
  END IF;

  -- Validate status
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

-- =============================================
-- 6. SEED DATA
-- =============================================

-- App Settings
INSERT INTO public.app_settings (key, value) VALUES
  ('points_per_currency', '1'),
  ('game_cost_burger_catch', '50'),
  ('game_cost_coffee_shooter', '50'),
  ('game_cost_grand_wheel', '100'),
  ('game_cost_predict_match', '60'),
  ('game_cost_shoot_target', '60'),
  ('game_cost_lucky_scratch', '40'),
  ('game_cooldown_burger_catch', '7'),
  ('game_cooldown_coffee_shooter', '7'),
  ('game_cooldown_grand_wheel', '30'),
  ('game_cooldown_predict_match', '7'),
  ('game_cooldown_shoot_target', '7'),
  ('game_cooldown_lucky_scratch', '3'),
  ('game_enabled_burger_catch', 'true'),
  ('game_enabled_coffee_shooter', 'true'),
  ('game_enabled_grand_wheel', 'true'),
  ('game_enabled_predict_match', 'true'),
  ('game_enabled_shoot_target', 'true'),
  ('game_enabled_lucky_scratch', 'true'),
  ('mission_target_visit_5', '5'),
  ('mission_target_visit_10', '10'),
  ('mission_target_spend_200', '200'),
  ('daily_sign_in_points', '5')
ON CONFLICT (key) DO NOTHING;

-- Menu Categories (admin-managed; customer MenuView reads these to render the filter bar + icons)
INSERT INTO public.menu_categories (name, display_name, icon, color, sort_order, visible) VALUES
  ('Main',     'Main',     'UtensilsCrossed', 'from-amber-500/20 to-orange-500/20',  0, true),
  ('Burgers',  'Burgers',  'Beef',            'from-amber-500/20 to-orange-500/20',  1, true),
  ('Coffee',   'Coffee',   'Coffee',          'from-amber-700/20 to-yellow-600/20', 2, true),
  ('Salads',   'Salads',   'Salad',           'from-green-500/20 to-emerald-500/20', 3, true),
  ('Sides',    'Sides',    'Flame',           'from-orange-500/20 to-red-500/20',    4, true),
  ('Desserts', 'Desserts', 'Cake',            'from-pink-500/20 to-rose-500/20',     5, true)
ON CONFLICT (name) DO NOTHING;

-- Menu Items
INSERT INTO public.menu_items (name, description, price, category) VALUES
  ('Classic Burger', 'Juicy beef patty with lettuce, tomato, and special sauce', 12.99, 'Burgers'),
  ('Cheese Burger', 'Classic burger with melted cheddar cheese', 14.99, 'Burgers'),
  ('Bacon Burger', 'Classic burger with crispy bacon strips', 16.99, 'Burgers'),
  ('Veggie Burger', 'Plant-based patty with fresh vegetables', 13.99, 'Burgers'),
  ('Espresso', 'Rich and bold single shot espresso', 4.99, 'Coffee'),
  ('Cappuccino', 'Espresso with steamed milk foam', 5.99, 'Coffee'),
  ('Latte', 'Espresso with steamed milk', 6.49, 'Coffee'),
  ('Mocha', 'Espresso with chocolate and steamed milk', 6.99, 'Coffee'),
  ('Caesar Salad', 'Fresh romaine with caesar dressing and croutons', 10.99, 'Salads'),
  ('Greek Salad', 'Mixed greens with feta and olives', 9.99, 'Salads'),
  ('French Fries', 'Crispy golden fries with sea salt', 5.99, 'Sides'),
  ('Onion Rings', 'Beer-battered onion rings', 6.99, 'Sides'),
  ('Chocolate Cake', 'Rich chocolate layer cake', 8.99, 'Desserts'),
  ('Cheesecake', 'New York style cheesecake', 7.99, 'Desserts')
ON CONFLICT DO NOTHING;

-- =============================================
-- 7. STORAGE BUCKETS & POLICIES
-- =============================================

-- Create the menu-images storage bucket automatically (public bucket).
-- This runs inside the SQL editor and creates the bucket via storage.buckets.
-- If you prefer, you can also create it via Dashboard → Storage → New bucket.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'menu-images',
  'menu-images',
  true,
  5242880,  -- 5 MB file size limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for the menu-images bucket:

-- Allow public read access to menu images
CREATE POLICY "Public read menu images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'menu-images');

-- Allow admins to upload menu images
CREATE POLICY "Admins can upload menu images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'menu-images' AND public.is_admin());

-- Allow admins to update menu images
CREATE POLICY "Admins can update menu images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'menu-images' AND public.is_admin());

-- Allow admins to delete menu images
CREATE POLICY "Admins can delete menu images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'menu-images' AND public.is_admin());

-- Rewards
INSERT INTO public.rewards (name, description, points_cost) VALUES
  ('Free Espresso', 'Enjoy a free espresso on us!', 100),
  ('Free Cappuccino', 'A complimentary cappuccino', 150),
  ('Free French Fries', 'Crispy fries for free', 200),
  ('$5 Off Your Order', 'Get $5 discount on any order', 250),
  ('Free Caesar Salad', 'Fresh caesar salad on the house', 350),
  ('Free Classic Burger', 'Our signature burger for free', 500),
  ('Free Dessert', 'Choose any dessert from our menu', 300),
  ('Buy 1 Get 1 Coffee', 'Get two coffees for the price of one', 180),
  ('$10 Off Your Order', 'Get $10 discount on any order', 500),
  ('VIP Experience', 'Priority seating + free appetizer', 1000)
ON CONFLICT DO NOTHING;
