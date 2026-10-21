-- ====================================================================
-- JU 52nd BATCH DAY - SECURITY AUDIT & HARDENING (FINAL REVISED)
-- ====================================================================

-- 1. DYNAMICALLY PURGE ALL OLD POLICIES & LOCK DOWN SENSITIVE TABLES
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN ('batch52_students', 'departments', 'halls')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- Enable RLS and set STRICT READ-ONLY for anonymous users
ALTER TABLE IF EXISTS public.batch52_students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read only batch52_students"
  ON public.batch52_students
  FOR SELECT
  TO anon, authenticated
  USING (true);

ALTER TABLE IF EXISTS public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read only departments"
  ON public.departments
  FOR SELECT
  TO anon, authenticated
  USING (true);

ALTER TABLE IF EXISTS public.halls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read only halls"
  ON public.halls
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 2. ENSURE REGISTRATIONS TABLE HAS UPDATED_AT COLUMN
ALTER TABLE IF EXISTS public.registrations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 3. SECURE ADMIN RPC FUNCTIONS (FOR 100% RELIABLE DB SYNC)
CREATE OR REPLACE FUNCTION public.secure_admin_update_status(
  p_reg_id UUID,
  p_status TEXT,
  p_auth_token TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify super admin session token
  IF p_auth_token <> 'c145831c695ff21cffa243accd032d3f93db4708ea9582b7501efbfb513a1bd5' THEN
    RAISE EXCEPTION 'Unauthorized admin token';
  END IF;

  IF p_status NOT IN ('pending', 'verified', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  UPDATE public.registrations
  SET status = p_status,
      updated_at = now()
  WHERE id = p_reg_id;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.secure_admin_update_settings(
  p_settings JSONB,
  p_auth_token TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify super admin session token
  IF p_auth_token <> 'c145831c695ff21cffa243accd032d3f93db4708ea9582b7501efbfb513a1bd5' THEN
    RAISE EXCEPTION 'Unauthorized admin token';
  END IF;

  UPDATE public.site_settings
  SET
    event_date = COALESCE(p_settings->>'event_date', event_date),
    registration_open = COALESCE((p_settings->>'registration_open')::BOOLEAN, registration_open),
    registration_fee = COALESCE((p_settings->>'registration_fee')::NUMERIC, registration_fee),
    bkash_number = COALESCE(p_settings->>'bkash_number', bkash_number),
    nagad_number = COALESCE(p_settings->>'nagad_number', nagad_number),
    event_location_name = COALESCE(p_settings->>'event_location_name', event_location_name),
    event_location_detail = COALESCE(p_settings->>'event_location_detail', event_location_detail),
    hero_title = COALESCE(p_settings->>'hero_title', hero_title),
    hero_subtitle = COALESCE(p_settings->>'hero_subtitle', hero_subtitle),
    hero_description = COALESCE(p_settings->>'hero_description', hero_description),
    sponsor_video_url = COALESCE(p_settings->>'sponsor_video_url', sponsor_video_url),
    sponsor_video_url_2 = COALESCE(p_settings->>'sponsor_video_url_2', sponsor_video_url_2),
    sponsor_video_url_3 = COALESCE(p_settings->>'sponsor_video_url_3', sponsor_video_url_3),
    sponsor_video_url_4 = COALESCE(p_settings->>'sponsor_video_url_4', sponsor_video_url_4),
    sponsor_video_url_5 = COALESCE(p_settings->>'sponsor_video_url_5', sponsor_video_url_5),
    features = COALESCE(p_settings->'features', features)
  WHERE id = 1;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.secure_admin_update_status TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.secure_admin_update_settings TO anon, authenticated;

-- 4. REALTIME BROADCAST CONFIRMATION
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.registrations;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
