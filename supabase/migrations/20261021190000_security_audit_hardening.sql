-- ====================================================================
-- JU 52nd BATCH DAY - SECURITY AUDIT & HARDENING MIGRATION
-- Generated from Security Audit (Cloudflare Edge & Supabase RLS)
-- ====================================================================

-- 1. SECURE STUDENT VOTER DATABASE (batch52_students)
-- Prevent unauthenticated users from editing or deleting batch-52 students
ALTER TABLE IF EXISTS public.batch52_students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view batch52_students" ON public.batch52_students;
DROP POLICY IF EXISTS "Allow anon delete" ON public.batch52_students;
DROP POLICY IF EXISTS "Allow anon update" ON public.batch52_students;

CREATE POLICY "Public can view batch52_students"
  ON public.batch52_students
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 2. SECURE DEPARTMENTS AND HALLS TABLES
ALTER TABLE IF EXISTS public.departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read departments" ON public.departments;
CREATE POLICY "Public can read departments"
  ON public.departments
  FOR SELECT
  TO anon, authenticated
  USING (true);

ALTER TABLE IF EXISTS public.halls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read halls" ON public.halls;
CREATE POLICY "Public can read halls"
  ON public.halls
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 3. SECURE BKASH TRANSACTIONS
-- Clean up test probe row
DELETE FROM public.bkash_transactions WHERE trx_id = 'AUDIT_TEST_PROBE';

-- 4. SECURE ADMIN RPC FUNCTIONS
-- Enables admin panel updates to persist directly to Supabase cloud
-- and broadcast to all connected devices in real time.

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
  -- Validate super admin session token
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
  -- Validate super admin session token
  IF p_auth_token <> 'c145831c695ff21cffa243accd032d3f93db4708ea9582b7501efbfb513a1bd5' THEN
    RAISE EXCEPTION 'Unauthorized admin token';
  END IF;

  UPDATE public.site_settings
  SET
    event_date = COALESCE((p_settings->>'event_date')::TIMESTAMPTZ, event_date),
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

-- Grant execution to anon and authenticated
GRANT EXECUTE ON FUNCTION public.secure_admin_update_status TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.secure_admin_update_settings TO anon, authenticated;

-- Ensure Realtime publication is active on core tables
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
