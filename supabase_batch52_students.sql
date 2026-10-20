-- ==============================================================================
-- 🏛️ Jahangirnagar University 52nd Batch (Session 2022-2023) Master Student Table
-- Run this script in the Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/enebjlvbaipggzswnzme/sql
-- ==============================================================================

-- 1. Create the persistent batch52_students table
CREATE TABLE IF NOT EXISTS public.batch52_students (
  id TEXT PRIMARY KEY,
  sl_no INTEGER,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  hall TEXT NOT NULL,
  reg_no TEXT,
  roll_no TEXT,
  session TEXT DEFAULT '2022-2023',
  is_batch52 BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Indexes for instant searching by Department, Hall, Name, Reg, and Roll
CREATE INDEX IF NOT EXISTS idx_batch52_students_dept ON public.batch52_students (department);
CREATE INDEX IF NOT EXISTS idx_batch52_students_hall ON public.batch52_students (hall);
CREATE INDEX IF NOT EXISTS idx_batch52_students_name ON public.batch52_students (name);
CREATE INDEX IF NOT EXISTS idx_batch52_students_reg ON public.batch52_students (reg_no);
CREATE INDEX IF NOT EXISTS idx_batch52_students_roll ON public.batch52_students (roll_no);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.batch52_students ENABLE ROW LEVEL SECURITY;

-- 4. Set RLS policies allowing public read, insert, update, and delete
DROP POLICY IF EXISTS "Allow public read on batch52_students" ON public.batch52_students;
CREATE POLICY "Allow public read on batch52_students" 
  ON public.batch52_students FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on batch52_students" ON public.batch52_students;
CREATE POLICY "Allow public insert on batch52_students" 
  ON public.batch52_students FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on batch52_students" ON public.batch52_students;
CREATE POLICY "Allow public update on batch52_students" 
  ON public.batch52_students FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete on batch52_students" ON public.batch52_students;
CREATE POLICY "Allow public delete on batch52_students" 
  ON public.batch52_students FOR DELETE USING (true);

-- 5. Enable Realtime broadcast on this table for instant push notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.batch52_students;
