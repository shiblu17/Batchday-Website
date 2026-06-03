-- ===================================================
-- 29 CARD GAME PROFILES & STATS SQL SCHEMA MIGRATION
-- ===================================================
-- Instructions:
-- 1. Go to your Supabase Dashboard -> SQL Editor
-- 2. Paste all this code and click "Run"
-- ===================================================

CREATE TABLE IF NOT EXISTS public.twenty_nine_profiles (
    id VARCHAR(150) PRIMARY KEY,
    is_verified BOOLEAN DEFAULT false NOT NULL,
    name TEXT NOT NULL,
    department TEXT,
    hall TEXT,
    games_played INT DEFAULT 0 NOT NULL, -- online multiplayer games played
    games_won INT DEFAULT 0 NOT NULL,    -- online multiplayer games won
    single_hands_tried INT DEFAULT 0 NOT NULL,
    single_hands_won INT DEFAULT 0 NOT NULL,
    highest_bid_won INT DEFAULT 0 NOT NULL,
    practice_played INT DEFAULT 0 NOT NULL, -- offline/practice AI games played
    practice_won INT DEFAULT 0 NOT NULL,    -- offline/practice AI games won
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.twenty_nine_profiles ENABLE ROW LEVEL SECURITY;

-- Create public RLS policies
CREATE POLICY "Allow public select on profiles" ON public.twenty_nine_profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert on profiles" ON public.twenty_nine_profiles FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update on profiles" ON public.twenty_nine_profiles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Enable realtime replication
ALTER PUBLICATION supabase_realtime ADD TABLE public.twenty_nine_profiles;
