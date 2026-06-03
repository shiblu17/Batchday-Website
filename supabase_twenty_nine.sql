-- ===================================================
-- 29 CARD GAME MULTIPLAYER SQL SCHEMA MIGRATION
-- ===================================================
-- Instructions:
-- 1. Go to your Supabase Dashboard -> SQL Editor
-- 2. Paste all this code and click "Run"
-- ===================================================

-- 1. Drop existing tables if they exist (for clean installation)
DROP TABLE IF EXISTS public.twenty_nine_hands;
DROP TABLE IF EXISTS public.twenty_nine_players;
DROP TABLE IF EXISTS public.twenty_nine_rooms;

-- 2. Create Rooms Table
CREATE TABLE public.twenty_nine_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_code VARCHAR(6) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'waiting' NOT NULL, -- 'waiting', 'playing', 'finished'
    creator_id UUID NOT NULL, -- Host's client-side user_id
    phase VARCHAR(50) DEFAULT 'lobby' NOT NULL,
    active_bidder VARCHAR(20),
    turn VARCHAR(20),
    current_bid INT DEFAULT 15,
    bid_winner VARCHAR(20),
    highest_bidder VARCHAR(20),
    trump_suit VARCHAR(20),
    hidden_trump_card JSONB,
    trump_revealed BOOLEAN DEFAULT false,
    trump_revealer VARCHAR(20),
    pair_revealed_by VARCHAR(20),
    pair_points_added BOOLEAN DEFAULT false,
    is_doubled BOOLEAN DEFAULT false,
    is_redoubled BOOLEAN DEFAULT false,
    is_single_hand BOOLEAN DEFAULT false,
    game_message TEXT,
    current_trick JSONB DEFAULT '{"leadPlayer": null, "leadSuit": null, "cards": {"bottom": null, "left": null, "top": null, "right": null}, "winner": null, "points": 0}'::jsonb,
    last_trick JSONB,
    tricks_won JSONB DEFAULT '{"bottom": [], "left": [], "top": [], "right": []}'::jsonb,
    scores JSONB DEFAULT '{"team1": 0, "team2": 0}'::jsonb,
    round_points JSONB DEFAULT '{"team1": 0, "team2": 0}'::jsonb,
    passed_players JSONB DEFAULT '[]'::jsonb,
    bidding_queue JSONB DEFAULT '[]'::jsonb,
    duel_defender VARCHAR(20),
    challenger VARCHAR(20),
    card_counts JSONB DEFAULT '{"bottom": 0, "left": 0, "top": 0, "right": 0}'::jsonb,
    remaining_deck JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Players Table
CREATE TABLE public.twenty_nine_players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES public.twenty_nine_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- Client-side generated user_id
    name TEXT NOT NULL,
    position VARCHAR(20) NOT NULL, -- 'bottom', 'left', 'top', 'right'
    is_ai BOOLEAN DEFAULT false NOT NULL, -- Tracks if this slot is filled by an AI bot
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_room_position UNIQUE (room_id, position),
    CONSTRAINT unique_room_user UNIQUE (room_id, user_id)
);

-- 4. Create Hands Table
CREATE TABLE public.twenty_nine_hands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES public.twenty_nine_rooms(id) ON DELETE CASCADE,
    position VARCHAR(20) NOT NULL, -- 'bottom', 'left', 'top', 'right'
    user_id UUID NOT NULL,
    cards JSONB DEFAULT '[]'::jsonb NOT NULL,
    CONSTRAINT unique_room_player_hand UNIQUE (room_id, position)
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.twenty_nine_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.twenty_nine_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.twenty_nine_hands ENABLE ROW LEVEL SECURITY;

-- 6. Create Public Access Policies
-- Enable SELECT, INSERT, UPDATE, DELETE for rooms
CREATE POLICY "Allow public select on rooms" ON public.twenty_nine_rooms FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert on rooms" ON public.twenty_nine_rooms FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update on rooms" ON public.twenty_nine_rooms FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on rooms" ON public.twenty_nine_rooms FOR DELETE TO anon, authenticated USING (true);

-- Enable SELECT, INSERT, UPDATE, DELETE for players
CREATE POLICY "Allow public select on players" ON public.twenty_nine_players FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert on players" ON public.twenty_nine_players FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update on players" ON public.twenty_nine_players FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on players" ON public.twenty_nine_players FOR DELETE TO anon, authenticated USING (true);

-- Enable SELECT, INSERT, UPDATE, DELETE for hands
CREATE POLICY "Allow public select on hands" ON public.twenty_nine_hands FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert on hands" ON public.twenty_nine_hands FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update on hands" ON public.twenty_nine_hands FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on hands" ON public.twenty_nine_hands FOR DELETE TO anon, authenticated USING (true);

-- 7. Enable Realtime Replication for these tables
-- Run this to make sure Supabase broadcasts updates in real-time
ALTER PUBLICATION supabase_realtime ADD TABLE public.twenty_nine_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.twenty_nine_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.twenty_nine_hands;

