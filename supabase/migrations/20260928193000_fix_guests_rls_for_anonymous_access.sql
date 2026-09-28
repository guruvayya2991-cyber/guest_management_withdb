/*
  # Fix Supabase Row Level Security (RLS) Policies for Guest Timing Management System

  ## Context:
  The Admin Portal access control has been simplified to allow direct access without login.
  This migration configures RLS policies on `public.guests`, `public.extensions`, and `public.settings`
  so that requests using the anonymous role (`anon`) and authenticated role (`authenticated`) can
  SELECT, INSERT, UPDATE, and DELETE (for data clearing operations) without encountering RLS violations.

  ## Instructions to apply:
  1. Open your Supabase Dashboard (https://supabase.com/dashboard).
  2. Go to the SQL Editor.
  3. Paste and run this SQL script.
*/

-- ============================================================
-- 1. guests table RLS Policies
-- ============================================================
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

-- Allow anon and authenticated to SELECT guests
DROP POLICY IF EXISTS "public_select_guests" ON public.guests;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.guests;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.guests;
CREATE POLICY "public_select_guests" ON public.guests 
  FOR SELECT TO anon, authenticated 
  USING (true);

-- Allow anon and authenticated to INSERT guests
DROP POLICY IF EXISTS "public_insert_guests" ON public.guests;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.guests;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.guests;
CREATE POLICY "public_insert_guests" ON public.guests 
  FOR INSERT TO anon, authenticated 
  WITH CHECK (true);

-- Allow anon and authenticated to UPDATE guests (Mark Out, Extend, Edit)
DROP POLICY IF EXISTS "public_update_guests" ON public.guests;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.guests;
DROP POLICY IF EXISTS "Allow authenticated update" ON public.guests;
CREATE POLICY "public_update_guests" ON public.guests 
  FOR UPDATE TO anon, authenticated 
  USING (true) 
  WITH CHECK (true);

-- Allow anon and authenticated to DELETE guests (Clear Today / Clear All Data)
DROP POLICY IF EXISTS "public_delete_guests" ON public.guests;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.guests;
DROP POLICY IF EXISTS "Allow authenticated delete" ON public.guests;
CREATE POLICY "public_delete_guests" ON public.guests 
  FOR DELETE TO anon, authenticated 
  USING (true);


-- ============================================================
-- 2. extensions table RLS Policies
-- ============================================================
ALTER TABLE public.extensions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_extensions" ON public.extensions;
CREATE POLICY "public_select_extensions" ON public.extensions 
  FOR SELECT TO anon, authenticated 
  USING (true);

DROP POLICY IF EXISTS "public_insert_extensions" ON public.extensions;
CREATE POLICY "public_insert_extensions" ON public.extensions 
  FOR INSERT TO anon, authenticated 
  WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_extensions" ON public.extensions;
CREATE POLICY "public_update_extensions" ON public.extensions 
  FOR UPDATE TO anon, authenticated 
  USING (true) 
  WITH CHECK (true);

DROP POLICY IF EXISTS "public_delete_extensions" ON public.extensions;
CREATE POLICY "public_delete_extensions" ON public.extensions 
  FOR DELETE TO anon, authenticated 
  USING (true);


-- ============================================================
-- 3. settings table RLS Policies
-- ============================================================
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_settings" ON public.settings;
CREATE POLICY "public_read_settings" ON public.settings 
  FOR SELECT TO anon, authenticated 
  USING (true);

DROP POLICY IF EXISTS "public_update_settings" ON public.settings;
CREATE POLICY "public_update_settings" ON public.settings 
  FOR UPDATE TO anon, authenticated 
  USING (true) 
  WITH CHECK (true);
