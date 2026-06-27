-- =============================================================
-- Migration: Add 3 new games + per-game Show/Hide visibility
-- =============================================================
-- Run this in the Supabase SQL Editor if you already deployed
-- the app before the "more games + hide/show" update.
-- Safe to re-run (uses IF NOT EXISTS / ON CONFLICT / OR REPLACE).
--
-- What this does:
--   1. Re-creates play_game() so it knows about the 3 new games
--      (predict_match, shoot_target, lucky_scratch) and blocks
--      plays of games the admin has hidden.
--   2. Inserts default app_settings rows for the new games
--      (cost, cooldown, enabled=true).
--   3. Inserts enabled='true' for the 3 original games so the
--      Show/Hide toggle has a baseline for them too.
-- =============================================================

-- 1) Updated play_game() with the new game types + hide-check
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
    'success', TRUE,
    'game_type', p_game_type,
    'entry_cost', v_entry_cost,
    'winnings', p_winnings,
    'net', p_winnings - v_entry_cost,
    'new_points_balance', v_new_points,
    'game_id', v_game_id
  );
END;
$$;

-- 2) Default settings for the 3 NEW games (cost / cooldown / enabled)
INSERT INTO public.app_settings (key, value) VALUES
  ('game_cost_predict_match', '60'),
  ('game_cost_shoot_target', '60'),
  ('game_cost_lucky_scratch', '40'),
  ('game_cooldown_predict_match', '7'),
  ('game_cooldown_shoot_target', '7'),
  ('game_cooldown_lucky_scratch', '3')
ON CONFLICT (key) DO NOTHING;

-- 3) enabled='true' baseline for ALL six games (so the toggle works everywhere)
INSERT INTO public.app_settings (key, value) VALUES
  ('game_enabled_burger_catch', 'true'),
  ('game_enabled_coffee_shooter', 'true'),
  ('game_enabled_grand_wheel', 'true'),
  ('game_enabled_predict_match', 'true'),
  ('game_enabled_shoot_target', 'true'),
  ('game_enabled_lucky_scratch', 'true')
ON CONFLICT (key) DO NOTHING;

-- Done. Refresh the app — you will now see 6 games in the customer
-- Games hub and 6 Show/Hide toggles in Admin → Settings → Game Settings.
