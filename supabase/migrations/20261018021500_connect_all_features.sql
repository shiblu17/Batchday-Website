-- ====================================================================
-- JU 52nd BATCH DAY - MIGRATION: CONNECT ALL FRONTEND FEATURES TO BACKEND
-- Tables: campus_spot_memories, slambook_entries, time_capsules, stage_pulse_stats, sponsors
-- ====================================================================

-- 1. CAMPUS SPOT MEMORIES
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
DROP POLICY IF EXISTS "Allow admin delete campus_spot_memories" ON public.campus_spot_memories;

CREATE POLICY "Allow public read campus_spot_memories" ON public.campus_spot_memories
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow public insert campus_spot_memories" ON public.campus_spot_memories
    FOR INSERT TO anon, authenticated WITH CHECK (length(text) > 0 AND length(author_name) > 0);

CREATE POLICY "Allow admin delete campus_spot_memories" ON public.campus_spot_memories
    FOR DELETE TO authenticated USING (public.is_admin());


-- 2. SLAM BOOK ENTRIES
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
DROP POLICY IF EXISTS "Allow admin delete slambook_entries" ON public.slambook_entries;

CREATE POLICY "Allow public read slambook_entries" ON public.slambook_entries
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow public insert slambook_entries" ON public.slambook_entries
    FOR INSERT TO anon, authenticated WITH CHECK (length(target_name) > 0 AND length(author_name) > 0 AND length(memory) > 0);

CREATE POLICY "Allow admin delete slambook_entries" ON public.slambook_entries
    FOR DELETE TO authenticated USING (public.is_admin());


-- 3. TIME CAPSULES (10-YEAR SEALED MESSAGES)
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


-- 4. STAGE PULSE STATS
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

-- Insert initial row if not exists
INSERT INTO public.stage_pulse_stats (id, heart_count, fire_count, clap_count, rock_count, energy_count, total_cheers)
VALUES ('current', 1420, 1850, 960, 2130, 1680, 8040)
ON CONFLICT (id) DO NOTHING;


-- 5. SPONSORS TABLE
CREATE TABLE IF NOT EXISTS public.sponsors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    tier TEXT DEFAULT 'general', -- 'title', 'platinum', 'gold', 'silver', 'general'
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
