-- ==============================================================================
-- 🏛️ JU 52nd Batch Master Student Table (1,951 Verified Students)
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/enebjlvbaipggzswnzme/sql
-- ==============================================================================

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.batch52_students (
  id TEXT PRIMARY KEY,
  sl_no INTEGER,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  hall TEXT NOT NULL,
  reg_no TEXT NOT NULL UNIQUE,
  roll_no TEXT NOT NULL UNIQUE,
  session TEXT DEFAULT '2022-2023',
  is_batch52 BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Indexes for fast search
CREATE INDEX IF NOT EXISTS idx_batch52_dept ON public.batch52_students (department);
CREATE INDEX IF NOT EXISTS idx_batch52_hall ON public.batch52_students (hall);
CREATE INDEX IF NOT EXISTS idx_batch52_name ON public.batch52_students (name);

-- 3. Row Level Security & Public Policies
ALTER TABLE public.batch52_students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read" ON public.batch52_students;
CREATE POLICY "Allow public read" ON public.batch52_students FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert" ON public.batch52_students;
CREATE POLICY "Allow public insert" ON public.batch52_students FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update" ON public.batch52_students;
CREATE POLICY "Allow public update" ON public.batch52_students FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete" ON public.batch52_students;
CREATE POLICY "Allow public delete" ON public.batch52_students FOR DELETE USING (true);

-- 4. Enable Realtime updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.batch52_students;
