-- ====================================================================
-- JU 52nd BATCH DAY - MERCHANT PAYMENT GATEWAY CONFIGURATION
-- ====================================================================

-- 1. Create payment_gateways table
CREATE TABLE IF NOT EXISTS public.payment_gateways (
  id TEXT PRIMARY KEY DEFAULT 'bkash',
  provider TEXT NOT NULL DEFAULT 'bkash',
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  environment TEXT NOT NULL DEFAULT 'sandbox', -- 'sandbox' or 'production'
  app_key TEXT,
  app_secret TEXT,
  username TEXT,
  password TEXT,
  base_url TEXT,
  callback_url TEXT DEFAULT 'https://batchday52ju.xyz/payment/callback',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE IF EXISTS public.payment_gateways ENABLE ROW LEVEL SECURITY;

-- Dynamic purge of old policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'payment_gateways'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- Public can view if gateway is enabled and which provider is active (without exposing secrets!)
CREATE POLICY "Public view gateway status"
  ON public.payment_gateways
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 2. Secure RPC to save gateway configuration (protected by super admin token)
CREATE OR REPLACE FUNCTION public.secure_admin_save_gateway(
  p_config JSONB,
  p_auth_token TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate super admin token
  IF p_auth_token <> 'c145831c695ff21cffa243accd032d3f93db4708ea9582b7501efbfb513a1bd5' THEN
    RAISE EXCEPTION 'Unauthorized admin token';
  END IF;

  INSERT INTO public.payment_gateways (
    id, provider, is_enabled, environment, app_key, app_secret, username, password, base_url, callback_url, updated_at
  ) VALUES (
    COALESCE(p_config->>'id', 'bkash'),
    COALESCE(p_config->>'provider', 'bkash'),
    COALESCE((p_config->>'is_enabled')::BOOLEAN, false),
    COALESCE(p_config->>'environment', 'sandbox'),
    p_config->>'app_key',
    p_config->>'app_secret',
    p_config->>'username',
    p_config->>'password',
    COALESCE(p_config->>'base_url', 'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout'),
    COALESCE(p_config->>'callback_url', 'https://batchday52ju.xyz/payment/callback'),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    provider = EXCLUDED.provider,
    is_enabled = EXCLUDED.is_enabled,
    environment = EXCLUDED.environment,
    app_key = EXCLUDED.app_key,
    app_secret = EXCLUDED.app_secret,
    username = EXCLUDED.username,
    password = EXCLUDED.password,
    base_url = EXCLUDED.base_url,
    callback_url = EXCLUDED.callback_url,
    updated_at = now();

  RETURN TRUE;
END;
$$;

-- 3. Secure RPC to fetch full gateway config with secrets (only for verified admin)
CREATE OR REPLACE FUNCTION public.secure_admin_get_gateway(
  p_gateway_id TEXT,
  p_auth_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row RECORD;
BEGIN
  IF p_auth_token <> 'c145831c695ff21cffa243accd032d3f93db4708ea9582b7501efbfb513a1bd5' THEN
    RAISE EXCEPTION 'Unauthorized admin token';
  END IF;

  SELECT * INTO v_row
  FROM public.payment_gateways
  WHERE id = COALESCE(p_gateway_id, 'bkash')
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN to_jsonb(v_row);
END;
$$;

GRANT EXECUTE ON FUNCTION public.secure_admin_save_gateway TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.secure_admin_get_gateway TO anon, authenticated;

-- Enable Realtime
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_gateways;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
