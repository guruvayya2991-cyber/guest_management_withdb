/*
  # Add Play Area, Socks Size, and Guest Type columns to guests table

  ## Context:
  Adds required guest details columns to `public.guests`:
  - `play_area`: 'trampoline' | 'soft_play'
  - `socks_size`: 'small' | 'medium' | 'large'
  - `guest_type`: 'new' | 'existing'

  Existing records remain completely valid as nullable columns.
*/

-- 1. Add columns if they do not exist (nullable for existing rows)
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS play_area text;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS socks_size text;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS guest_type text;

-- 2. Add CHECK constraints
ALTER TABLE public.guests DROP CONSTRAINT IF EXISTS chk_guests_play_area;
ALTER TABLE public.guests ADD CONSTRAINT chk_guests_play_area 
  CHECK (play_area IS NULL OR play_area IN ('trampoline', 'soft_play'));

ALTER TABLE public.guests DROP CONSTRAINT IF EXISTS chk_guests_socks_size;
ALTER TABLE public.guests ADD CONSTRAINT chk_guests_socks_size 
  CHECK (socks_size IS NULL OR socks_size IN ('small', 'medium', 'large'));

ALTER TABLE public.guests DROP CONSTRAINT IF EXISTS chk_guests_guest_type;
ALTER TABLE public.guests ADD CONSTRAINT chk_guests_guest_type 
  CHECK (guest_type IS NULL OR guest_type IN ('new', 'existing'));

-- 3. Create indexes for quick filtering
CREATE INDEX IF NOT EXISTS idx_guests_play_area ON public.guests (play_area);
CREATE INDEX IF NOT EXISTS idx_guests_socks_size ON public.guests (socks_size);
CREATE INDEX IF NOT EXISTS idx_guests_guest_type ON public.guests (guest_type);
