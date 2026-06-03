-- ===================================================
-- 29 CARD GAME FUTURE ENHANCEMENTS SQL SCHEMA MIGRATION
-- ===================================================
-- Instructions:
-- 1. Go to your Supabase Dashboard -> SQL Editor
-- 2. Paste all this code and click "Run"
-- ===================================================

-- 1. Add active_reactions column for in-game emojis and messages
ALTER TABLE public.twenty_nine_rooms 
ADD COLUMN IF NOT EXISTS active_reactions JSONB DEFAULT '{}'::jsonb;

-- 2. Add role column to player profiles to support Spectators
ALTER TABLE public.twenty_nine_players 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'player' NOT NULL;

-- 3. Add bids column to twenty_nine_rooms to track bidding history
ALTER TABLE public.twenty_nine_rooms 
ADD COLUMN IF NOT EXISTS bids JSONB DEFAULT '[]'::jsonb;
