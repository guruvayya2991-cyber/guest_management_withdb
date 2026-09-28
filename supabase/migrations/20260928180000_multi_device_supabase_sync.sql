/*
# Unlimited Fun - Multi-Computer Guest Timing Management System
# Complete Schema, Row Level Security, Storage & Realtime Migration
*/

-- ============================================================
-- 1. guests table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number integer NOT NULL,
  guest_name text NOT NULL,
  photo_url text,
  in_time timestamptz NOT NULL,
  expected_out_time timestamptz NOT NULL,
  actual_out_time timestamptz,
  duration_minutes integer NOT NULL,
  status text NOT NULL DEFAULT 'active',
  remarks text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure photo_url column exists if table already existed
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS photo_url text;

CREATE INDEX IF NOT EXISTS idx_guests_created_at ON public.guests (created_at);
CREATE INDEX IF NOT EXISTS idx_guests_status ON public.guests (status);
CREATE INDEX IF NOT EXISTS idx_guests_in_time ON public.guests (in_time);
CREATE INDEX IF NOT EXISTS idx_guests_serial_number ON public.guests (serial_number);

ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

-- Allow anon and authenticated full access for live operations
DROP POLICY IF EXISTS "public_select_guests" ON public.guests;
CREATE POLICY "public_select_guests" ON public.guests FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_guests" ON public.guests;
CREATE POLICY "public_insert_guests" ON public.guests FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_guests" ON public.guests;
CREATE POLICY "public_update_guests" ON public.guests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_delete_guests" ON public.guests;
CREATE POLICY "public_delete_guests" ON public.guests FOR DELETE TO anon, authenticated USING (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guests_touch ON public.guests;
CREATE TRIGGER trg_guests_touch BEFORE UPDATE ON public.guests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- 2. extensions table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.extensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  extension_minutes integer NOT NULL,
  previous_out_time timestamptz NOT NULL,
  new_out_time timestamptz NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_extensions_guest_id ON public.extensions (guest_id);

ALTER TABLE public.extensions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_extensions" ON public.extensions;
CREATE POLICY "public_select_extensions" ON public.extensions FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_extensions" ON public.extensions;
CREATE POLICY "public_insert_extensions" ON public.extensions FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_extensions" ON public.extensions;
CREATE POLICY "public_update_extensions" ON public.extensions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_delete_extensions" ON public.extensions;
CREATE POLICY "public_delete_extensions" ON public.extensions FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 3. settings table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  park_name text NOT NULL DEFAULT 'Unlimited Fun',
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  ending_soon_minutes integer NOT NULL DEFAULT 10,
  notification_sound boolean NOT NULL DEFAULT true,
  browser_notifications boolean NOT NULL DEFAULT false,
  theme text NOT NULL DEFAULT 'light',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_settings" ON public.settings;
CREATE POLICY "public_read_settings" ON public.settings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_update_settings" ON public.settings;
CREATE POLICY "public_update_settings" ON public.settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO public.settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. Storage Bucket for Guest Profile Photos
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('guest-photos', 'guest-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Read Guest Photos" ON storage.objects;
CREATE POLICY "Public Read Guest Photos" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'guest-photos');

DROP POLICY IF EXISTS "Public Insert Guest Photos" ON storage.objects;
CREATE POLICY "Public Insert Guest Photos" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'guest-photos');

DROP POLICY IF EXISTS "Public Update Guest Photos" ON storage.objects;
CREATE POLICY "Public Update Guest Photos" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'guest-photos');

DROP POLICY IF EXISTS "Public Delete Guest Photos" ON storage.objects;
CREATE POLICY "Public Delete Guest Photos" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'guest-photos');

-- ============================================================
-- 5. Realtime Publication
-- ============================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.guests;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.extensions;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication
  END;
END $$;
