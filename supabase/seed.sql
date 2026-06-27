-- =============================================
-- Loyalty Platform - Seed Demo Users
-- Run this AFTER schema.sql AND after disabling
-- "Confirm email" in Supabase Auth settings
--
-- IMPORTANT: These INSERT into auth.users which
-- requires the service_role key. Run this from
-- the Supabase Dashboard SQL Editor (which uses
-- the postgres role with elevated privileges).
-- =============================================

-- Helper: Create auth user + customer profile
-- We use auth.users directly since Supabase SQL Editor has the needed privileges

-- 1. Admin User (phone: 000000)
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, confirmation_token, email_change, phone_change
) VALUES (
  gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  '000000@yourcafe.local',
  crypt('admin123', gen_salt('bf')),
  NOW(), NOW(), NOW(), '', '', ''
) RETURNING id;

-- Get the admin user ID and create profile
INSERT INTO public.customers (id, phone, email, name, points, total_visits, role)
SELECT id, '000000', '000000@yourcafe.local', 'Admin', 99999, 0, 'admin'
FROM auth.users WHERE email = '000000@yourcafe.local';

-- 2. Employee User (phone: 111111)
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, confirmation_token, email_change, phone_change
) VALUES (
  gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  '111111@yourcafe.local',
  crypt('emp123', gen_salt('bf')),
  NOW(), NOW(), NOW(), '', '', ''
);

INSERT INTO public.customers (id, phone, email, name, points, total_visits, role)
SELECT id, '111111', '111111@yourcafe.local', 'Staff Member', 0, 0, 'employee'
FROM auth.users WHERE email = '111111@yourcafe.local';

-- 3. Customer 1 (phone: 123456)
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, confirmation_token, email_change, phone_change
) VALUES (
  gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  '123456@yourcafe.local',
  crypt('cust123', gen_salt('bf')),
  NOW(), NOW(), NOW(), '', '', ''
);

INSERT INTO public.customers (id, phone, email, name, points, total_visits, role)
SELECT id, '123456', '123456@yourcafe.local', 'John Doe', 500, 3, 'customer'
FROM auth.users WHERE email = '123456@yourcafe.local';

-- 4. Customer 2 (phone: 654321)
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, confirmation_token, email_change, phone_change
) VALUES (
  gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  '654321@yourcafe.local',
  crypt('cust123', gen_salt('bf')),
  NOW(), NOW(), NOW(), '', '', ''
);

INSERT INTO public.customers (id, phone, email, name, points, total_visits, role)
SELECT id, '654321', '654321@yourcafe.local', 'Jane Smith', 320, 5, 'customer'
FROM auth.users WHERE email = '654321@yourcafe.local';

-- Create missions for customers
INSERT INTO public.missions (customer_id, type, title, target, progress, points)
SELECT id, 'visit_5', 'Visit 5 Times', 5, 3, 200
FROM auth.users WHERE email = '123456@yourcafe.local';

INSERT INTO public.missions (customer_id, type, title, target, progress, points)
SELECT id, 'visit_10', 'Visit 10 Times', 10, 3, 500
FROM auth.users WHERE email = '123456@yourcafe.local';

INSERT INTO public.missions (customer_id, type, title, target, progress, points)
SELECT id, 'spend_200', 'Spend $200 Total', 200, 75, 300
FROM auth.users WHERE email = '123456@yourcafe.local';

INSERT INTO public.missions (customer_id, type, title, target, progress, points)
SELECT id, 'visit_5', 'Visit 5 Times', 5, 5, 0
FROM auth.users WHERE email = '654321@yourcafe.local';

INSERT INTO public.missions (customer_id, type, title, target, progress, points)
SELECT id, 'visit_10', 'Visit 10 Times', 10, 5, 500
FROM auth.users WHERE email = '654321@yourcafe.local';

INSERT INTO public.missions (customer_id, type, title, target, progress, points)
SELECT id, 'spend_200', 'Spend $200 Total', 200, 120, 300
FROM auth.users WHERE email = '654321@yourcafe.local';

-- Mark visit_5 as completed for Jane
UPDATE public.missions SET completed = true
WHERE type = 'visit_5' AND customer_id = (
  SELECT id FROM auth.users WHERE email = '654321@yourcafe.local'
);

-- Create sample visits
INSERT INTO public.visits (customer_id, invoice_amount, points_earned, created_by)
SELECT id, 25.99, 25, (SELECT id FROM auth.users WHERE email = '111111@yourcafe.local')
FROM auth.users WHERE email = '123456@yourcafe.local';

INSERT INTO public.visits (customer_id, invoice_amount, points_earned, created_by)
SELECT id, 18.50, 18, (SELECT id FROM auth.users WHERE email = '111111@yourcafe.local')
FROM auth.users WHERE email = '123456@yourcafe.local';

INSERT INTO public.visits (customer_id, invoice_amount, points_earned, created_by)
SELECT id, 32.00, 32, (SELECT id FROM auth.users WHERE email = '111111@yourcafe.local')
FROM auth.users WHERE email = '123456@yourcafe.local';

INSERT INTO public.visits (customer_id, invoice_amount, points_earned, created_by)
SELECT id, 45.00, 45, (SELECT id FROM auth.users WHERE email = '111111@yourcafe.local')
FROM auth.users WHERE email = '654321@yourcafe.local';

INSERT INTO public.visits (customer_id, invoice_amount, points_earned, created_by)
SELECT id, 15.00, 15, (SELECT id FROM auth.users WHERE email = '111111@yourcafe.local')
FROM auth.users WHERE email = '654321@yourcafe.local';
