-- =============================================
-- Migration: Add admin-managed Menu Categories
-- Safe to re-run (idempotent). For EXISTING deployments only.
-- Fresh installs already include this in supabase/schema.sql.
--
-- What this adds:
--   1. `public.menu_categories` table — admin-managed category metadata
--      (name, display_name, icon, color, sort_order, visible)
--   2. Indexes on sort_order and visible
--   3. RLS: public read + admin manage
--   4. Seed rows for the 6 default categories (Main, Burgers, Coffee, Salads, Sides, Desserts)
--
-- After running this, the admin's Menu Management page gains a "Menu Categories"
-- card where they can add / rename / recolor / re-icon / show-hide / reorder / delete
-- categories. The customer MenuView (and the public menu preview) will only show
-- items that belong to a VISIBLE category, and the filter bar uses the configured
-- sort order, display names, icons, and colors.
-- =============================================

-- 1. TABLE ----------------------------------------------------
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

-- 2. INDEXES --------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_menu_categories_sort ON public.menu_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_menu_categories_visible ON public.menu_categories(visible);

-- 3. ROW LEVEL SECURITY --------------------------------------
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

-- Public read access (so anonymous menu-preview users can see categories too)
DO $$ BEGIN
  CREATE POLICY "Public read menu categories"
    ON public.menu_categories FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can insert menu categories"
    ON public.menu_categories FOR INSERT
    WITH CHECK (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update menu categories"
    ON public.menu_categories FOR UPDATE
    USING (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can delete menu categories"
    ON public.menu_categories FOR DELETE
    USING (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. SEED DEFAULT CATEGORIES ---------------------------------
-- Each row's `name` must match the `category` text stored on existing menu_items.
-- `display_name` is what customers see in the menu (can differ from internal name).
-- `icon` is a lucide-react icon name. `color` is tailwind gradient classes.
INSERT INTO public.menu_categories (name, display_name, icon, color, sort_order, visible) VALUES
  ('Main',     'Main',     'UtensilsCrossed', 'from-amber-500/20 to-orange-500/20',  0, true),
  ('Burgers',  'Burgers',  'Beef',            'from-amber-500/20 to-orange-500/20',  1, true),
  ('Coffee',   'Coffee',   'Coffee',          'from-amber-700/20 to-yellow-600/20', 2, true),
  ('Salads',   'Salads',   'Salad',           'from-green-500/20 to-emerald-500/20', 3, true),
  ('Sides',    'Sides',    'Flame',           'from-orange-500/20 to-red-500/20',    4, true),
  ('Desserts', 'Desserts', 'Cake',            'from-pink-500/20 to-rose-500/20',     5, true)
ON CONFLICT (name) DO NOTHING;

-- Done. The admin can now manage categories from the Menu Management page.
