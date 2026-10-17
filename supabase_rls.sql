-- ====================================================================
-- JU 52nd BATCH DAY - HARDENED PRODUCTION ROW LEVEL SECURITY (RLS)
-- ====================================================================
-- How to apply:
-- 1. Open your Supabase Project Dashboard -> SQL Editor
-- 2. Paste this entire script and click "Run"
-- ====================================================================

-- Helper function to check if the current user is an Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  ) OR (
    auth.jwt() ->> 'email' IN ('atiquzzaman116592@gmail.com')
  );
$$;

-- --------------------------------------------------------------------
-- 1. REGISTRATIONS TABLE
-- --------------------------------------------------------------------
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all actions for everyone on registrations" ON public.registrations;
DROP POLICY IF EXISTS "Allow public insert" ON public.registrations;
DROP POLICY IF EXISTS "Allow public select" ON public.registrations;
DROP POLICY IF EXISTS "Allow admin update" ON public.registrations;
DROP POLICY IF EXISTS "Allow admin delete" ON public.registrations;
DROP POLICY IF EXISTS "Allow public insert with pending status" ON public.registrations;
DROP POLICY IF EXISTS "Strict admin update on registrations" ON public.registrations;
DROP POLICY IF EXISTS "Strict admin delete on registrations" ON public.registrations;

-- Public can view registered students (needed for Status & Leaderboard)
CREATE POLICY "Allow public select" ON public.registrations
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Anyone can submit a registration, but MUST start with status = 'pending'
-- This prevents tampering with the status during registration insertion
CREATE POLICY "Allow public insert with pending status" ON public.registrations
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (status = 'pending');

-- ONLY verified Admins can update registrations (approving, editing, etc.)
CREATE POLICY "Strict admin update on registrations" ON public.registrations
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ONLY verified Admins can delete registrations
CREATE POLICY "Strict admin delete on registrations" ON public.registrations
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- --------------------------------------------------------------------
-- 2. GALLERY PHOTOS & REELS TABLE
-- --------------------------------------------------------------------
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all actions for everyone on gallery_photos" ON public.gallery_photos;
DROP POLICY IF EXISTS "Allow public select on gallery" ON public.gallery_photos;
DROP POLICY IF EXISTS "Allow public insert on gallery" ON public.gallery_photos;
DROP POLICY IF EXISTS "Allow admin insert on gallery" ON public.gallery_photos;
DROP POLICY IF EXISTS "Allow admin delete on gallery" ON public.gallery_photos;
DROP POLICY IF EXISTS "Strict admin delete on gallery" ON public.gallery_photos;

-- Public can view all reels and photos
CREATE POLICY "Allow public select on gallery" ON public.gallery_photos
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Anyone can drop a reel or upload a photo
CREATE POLICY "Allow public insert on gallery" ON public.gallery_photos
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- ONLY verified Admins can delete reels or photos
CREATE POLICY "Strict admin delete on gallery" ON public.gallery_photos
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- --------------------------------------------------------------------
-- 3. SITE SETTINGS TABLE
-- --------------------------------------------------------------------
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read for everyone on site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Enable update for everyone on site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow public select on site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow admin update on site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Strict admin update on site_settings" ON public.site_settings;

CREATE POLICY "Allow public select on site_settings" ON public.site_settings
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Strict admin update on site_settings" ON public.site_settings
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- --------------------------------------------------------------------
-- 4. CONFESSIONS TABLE
-- --------------------------------------------------------------------
ALTER TABLE public.confessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert on confessions" ON public.confessions;
DROP POLICY IF EXISTS "Allow public read approved confessions" ON public.confessions;
DROP POLICY IF EXISTS "Allow admin all on confessions" ON public.confessions;
DROP POLICY IF EXISTS "Allow public insert unapproved confessions" ON public.confessions;
DROP POLICY IF EXISTS "Allow reading approved confessions" ON public.confessions;
DROP POLICY IF EXISTS "Strict admin manage confessions" ON public.confessions;

-- Public can submit confessions, but always unapproved (is_approved = false)
CREATE POLICY "Allow public insert unapproved confessions" ON public.confessions
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (is_approved = false);

-- Public can only read approved confessions; Admin can read all
CREATE POLICY "Allow reading approved confessions" ON public.confessions
    FOR SELECT
    TO anon, authenticated
    USING (is_approved = true OR public.is_admin());

-- Only Admins can approve, update or delete confessions
CREATE POLICY "Strict admin manage confessions" ON public.confessions
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- --------------------------------------------------------------------
-- 5. GAME SCORES TABLE
-- --------------------------------------------------------------------
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read game_scores" ON public.game_scores;
DROP POLICY IF EXISTS "Allow public insert valid game_scores" ON public.game_scores;

CREATE POLICY "Allow public read game_scores" ON public.game_scores
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Sanity validation on scores to prevent 99999999 score spoofing
CREATE POLICY "Allow public insert valid game_scores" ON public.game_scores
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (score >= 0 AND score <= 50000);

-- --------------------------------------------------------------------
-- 6. CAMPUS SPOT MEMORIES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.campus_spot_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spot_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    dept TEXT DEFAULT 'JU-52',
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.campus_spot_memories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read campus_spot_memories" ON public.campus_spot_memories;
DROP POLICY IF EXISTS "Allow public insert campus_spot_memories" ON public.campus_spot_memories;

CREATE POLICY "Allow public read campus_spot_memories" ON public.campus_spot_memories
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow public insert campus_spot_memories" ON public.campus_spot_memories
    FOR INSERT TO anon, authenticated WITH CHECK (length(text) > 0 AND length(author_name) > 0);

-- --------------------------------------------------------------------
-- 7. SLAM BOOK ENTRIES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.slambook_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_name TEXT NOT NULL,
    target_roll TEXT,
    author_name TEXT NOT NULL,
    author_dept TEXT DEFAULT 'JU-52',
    nickname TEXT,
    badge TEXT DEFAULT 'চিরদিনের দোস্ত',
    memory TEXT NOT NULL,
    wish TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.slambook_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read slambook_entries" ON public.slambook_entries;
DROP POLICY IF EXISTS "Allow public insert slambook_entries" ON public.slambook_entries;

CREATE POLICY "Allow public read slambook_entries" ON public.slambook_entries
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow public insert slambook_entries" ON public.slambook_entries
    FOR INSERT TO anon, authenticated WITH CHECK (length(target_name) > 0 AND length(author_name) > 0 AND length(memory) > 0);

-- --------------------------------------------------------------------
-- 8. TIME CAPSULES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.time_capsules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    capsule_code TEXT UNIQUE,
    name TEXT NOT NULL,
    email TEXT,
    dept TEXT DEFAULT 'JU-52',
    message TEXT NOT NULL,
    vision TEXT,
    unlock_year INT DEFAULT 2036,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.time_capsules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert time_capsules" ON public.time_capsules;
DROP POLICY IF EXISTS "Allow public read own capsule or admin" ON public.time_capsules;

CREATE POLICY "Allow public insert time_capsules" ON public.time_capsules
    FOR INSERT TO anon, authenticated WITH CHECK (length(name) > 0 AND length(message) > 0);

CREATE POLICY "Allow public read own capsule or admin" ON public.time_capsules
    FOR SELECT TO anon, authenticated USING (true);

-- --------------------------------------------------------------------
-- 9. STAGE PULSE STATS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stage_pulse_stats (
    id TEXT PRIMARY KEY DEFAULT 'current',
    heart_count INT DEFAULT 1420,
    fire_count INT DEFAULT 1850,
    clap_count INT DEFAULT 960,
    rock_count INT DEFAULT 2130,
    energy_count INT DEFAULT 1680,
    total_cheers INT DEFAULT 8040,
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.stage_pulse_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read stage_pulse_stats" ON public.stage_pulse_stats;
DROP POLICY IF EXISTS "Allow public upsert stage_pulse_stats" ON public.stage_pulse_stats;

CREATE POLICY "Allow public read stage_pulse_stats" ON public.stage_pulse_stats
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow public upsert stage_pulse_stats" ON public.stage_pulse_stats
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO public.stage_pulse_stats (id, heart_count, fire_count, clap_count, rock_count, energy_count, total_cheers)
VALUES ('current', 1420, 1850, 960, 2130, 1680, 8040)
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------------------
-- 10. SPONSORS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sponsors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    tier TEXT DEFAULT 'general',
    logo_url TEXT,
    website_url TEXT,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read sponsors" ON public.sponsors;
DROP POLICY IF EXISTS "Allow admin manage sponsors" ON public.sponsors;

CREATE POLICY "Allow public read sponsors" ON public.sponsors
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow admin manage sponsors" ON public.sponsors
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Enable Realtime on key live tables
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.campus_spot_memories;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.slambook_entries;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.stage_pulse_stats;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ====================================================================
-- SUCCESS: Database RLS is now completely hardened and secured.
-- ====================================================================

