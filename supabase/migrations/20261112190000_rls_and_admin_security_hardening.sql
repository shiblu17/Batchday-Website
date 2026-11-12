-- ============================================================================
-- JU 52nd BATCH DAY - PRODUCTION SECURITY & EVENT DAY HARDENING MIGRATION
-- Run in Supabase Dashboard -> SQL Editor AFTER enabling Supabase Auth admin users
-- ============================================================================

-- 1. Event-day delivery token columns on registrations (idempotent)
ALTER TABLE IF EXISTS public.registrations
  ADD COLUMN IF NOT EXISTS tshirt_claimed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS food_claimed BOOLEAN NOT NULL DEFAULT false;

-- 2. Move moderator credentials OUT of public gallery_photos into a locked table
CREATE TABLE IF NOT EXISTS public.admin_moderators (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role_title TEXT NOT NULL,
  allowed_sections TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_moderators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage admin_moderators" ON public.admin_moderators;
CREATE POLICY "Admins manage admin_moderators"
  ON public.admin_moderators
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Remove legacy public system moderator row from gallery_photos if present
DELETE FROM public.gallery_photos WHERE url = 'system://admin_moderators';

-- 3. Restrict direct anonymous reads on registrations & payment_gateways
--    Keep public registration INSERT while preventing anonymous bulk PII scraping.
DROP POLICY IF EXISTS "Anyone can read registrations" ON public.registrations;
DROP POLICY IF EXISTS "Admins read registrations" ON public.registrations;
CREATE POLICY "Admins read registrations"
  ON public.registrations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Lock down payment_gateways table (never expose app_secret / password via anon SELECT)
DROP POLICY IF EXISTS "Public view gateway status" ON public.payment_gateways;
DROP POLICY IF EXISTS "Admins read payment_gateways" ON public.payment_gateways;
CREATE POLICY "Admins read payment_gateways"
  ON public.payment_gateways
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- 4. Safe public RPCs (return only non-sensitive aggregates / exact roll+phone lookup)
CREATE OR REPLACE FUNCTION public.get_public_leaderboard_stats()
RETURNS TABLE(department TEXT, hall TEXT, status TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT department, hall, status
  FROM public.registrations
  WHERE status = 'verified';
$$;

REVOKE ALL ON FUNCTION public.get_public_leaderboard_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_leaderboard_stats() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.lookup_registration_status(p_roll TEXT, p_phone_last4 TEXT)
RETURNS TABLE(
  id UUID,
  name TEXT,
  department TEXT,
  hall TEXT,
  status TEXT,
  tshirt_size TEXT,
  attended BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, department, hall, status, tshirt_size, attended
  FROM public.registrations
  WHERE roll = trim(p_roll)
    AND length(trim(p_phone_last4)) >= 4
    AND right(regexp_replace(phone, '\D', '', 'g'), 4) = right(regexp_replace(trim(p_phone_last4), '\D', '', 'g'), 4)
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.lookup_registration_status(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_registration_status(TEXT, TEXT) TO anon, authenticated;

-- 5. Lock admin RPCs to verified authenticated Supabase admin users (removes static shared token)
REVOKE ALL ON FUNCTION public.secure_admin_update_status(UUID, TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.secure_admin_update_settings(JSONB, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.secure_admin_manage_student(TEXT, TEXT, JSONB, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.secure_admin_save_gateway(JSONB, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.secure_admin_get_gateway(TEXT, TEXT) FROM anon;
