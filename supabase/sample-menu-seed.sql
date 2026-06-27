-- =============================================
--  OPTIONAL Sample Menu & Rewards (white-label)
-- =============================================
--  schema.sql already seeds a generic starter menu. Run THIS file only
--  if you want a slightly larger neutral sample to demo with, or as a
--  template to copy when you add your real items.
--
--  In production you normally DON'T run this — you add your real menu,
--  categories and rewards from the in-app Admin panel (no SQL needed).
--
--  Safe to re-run: uses ON CONFLICT DO NOTHING where possible.
-- =============================================

-- ---------- Categories ----------
INSERT INTO public.menu_categories (name, display_name, icon, color, sort_order, visible) VALUES
  ('Coffee',   'Coffee',   'Coffee',          'from-emerald-500/20 to-teal-500/20',  1, true),
  ('Drinks',   'Drinks',   'CupSoda',         'from-teal-500/20 to-cyan-500/20',     2, true),
  ('Food',     'Food',     'UtensilsCrossed', 'from-amber-500/20 to-yellow-500/20',  3, true),
  ('Bakery',   'Bakery',   'Croissant',       'from-amber-500/20 to-orange-500/20',  4, true),
  ('Desserts', 'Desserts', 'IceCream',        'from-rose-500/20 to-amber-500/20',    5, true)
ON CONFLICT (name) DO NOTHING;

-- ---------- Menu items ----------
INSERT INTO public.menu_items (name, description, price, category, available) VALUES
  ('Espresso',          'Single shot, freshly pulled',                 2.50, 'Coffee',   true),
  ('Cappuccino',        'Espresso with steamed milk and foam',         3.75, 'Coffee',   true),
  ('Flat White',        'Smooth double shot with microfoam',           4.00, 'Coffee',   true),
  ('Cold Brew',         'Slow-steeped 18 hours, over ice',             4.25, 'Coffee',   true),
  ('Fresh Lemonade',    'House-made, lightly sweetened',               3.50, 'Drinks',   true),
  ('Iced Tea',          'Black tea, choice of flavor',                 3.00, 'Drinks',   true),
  ('Sparkling Water',   'Chilled, with a slice of citrus',             2.00, 'Drinks',   true),
  ('Club Sandwich',     'Triple-stack with fries',                     9.50, 'Food',     true),
  ('Garden Salad',      'Seasonal greens, house dressing',             7.00, 'Food',     true),
  ('Margherita Flatbread','Tomato, mozzarella, basil',                 8.50, 'Food',     true),
  ('Butter Croissant',  'Baked fresh each morning',                    3.25, 'Bakery',   true),
  ('Blueberry Muffin',  'Loaded with real blueberries',                3.00, 'Bakery',   true),
  ('Chocolate Brownie', 'Rich, fudgy, walnut topping',                 3.75, 'Desserts', true),
  ('Cheesecake Slice',  'New York style with berry coulis',            5.00, 'Desserts', true)
ON CONFLICT DO NOTHING;

-- ---------- Rewards ----------
INSERT INTO public.rewards (name, description, points_cost, available) VALUES
  ('Free Espresso',        'Redeem for one complimentary espresso',           200,  true),
  ('Free Cappuccino',      'Redeem for one complimentary cappuccino',         350,  true),
  ('Free Pastry',          'Any item from the bakery, on the house',          400,  true),
  ('$5 Off Your Order',    'Five dollars off any purchase',                   500,  true),
  ('Free Dessert',         'Any dessert of your choice',                      600,  true),
  ('Buy 1 Get 1 Coffee',   'Bring a friend — second coffee free',             750,  true),
  ('$10 Off Your Order',   'Ten dollars off any purchase',                    1000, true),
  ('Free Lunch Combo',     'Sandwich or salad plus a drink',                  1200, true),
  ('VIP Member Status',    'Perks, priority and a surprise gift',             2500, true)
ON CONFLICT DO NOTHING;
