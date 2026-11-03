-- Migration: Add timeline_locked to site_settings and update secure_admin_update_settings
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS timeline_locked BOOLEAN DEFAULT false;

-- Update the secure admin RPC function to handle timeline_locked
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
    timeline_locked = COALESCE((p_settings->>'timeline_locked')::BOOLEAN, timeline_locked),
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

GRANT EXECUTE ON FUNCTION public.secure_admin_update_settings TO anon, authenticated;

-- Ensure site_settings is in realtime publication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
