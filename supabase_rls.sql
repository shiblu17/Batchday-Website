-- ==========================================
-- BATCH DAY - SUPABASE RLS SECURITY SCRIPT
-- ==========================================
-- Instructions: 
-- 1. Go to your Supabase Dashboard -> SQL Editor
-- 2. Paste all this code and hit "Run"
-- ==========================================

-- 1. Enable RLS on all tables
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public insert" ON registrations;
DROP POLICY IF EXISTS "Allow public select" ON registrations;
DROP POLICY IF EXISTS "Allow admin update" ON registrations;
DROP POLICY IF EXISTS "Allow admin delete" ON registrations;

DROP POLICY IF EXISTS "Allow public select on gallery" ON gallery_photos;
DROP POLICY IF EXISTS "Allow admin insert on gallery" ON gallery_photos;
DROP POLICY IF EXISTS "Allow admin delete on gallery" ON gallery_photos;

-- 3. REGISTRATIONS TABLE POLICIES --
-- Allow anyone to insert a registration (needed for the public form)
CREATE POLICY "Allow public insert" ON registrations
    FOR INSERT 
    TO anon, authenticated
    WITH CHECK (true);

-- Allow anyone to read registrations (needed for Status check and Leaderboard)
CREATE POLICY "Allow public select" ON registrations
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- ONLY Authenticated users (Admins) can Update or Delete
CREATE POLICY "Allow admin update" ON registrations
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow admin delete" ON registrations
    FOR DELETE
    TO authenticated
    USING (true);


-- 4. GALLERY PHOTOS POLICIES --
-- Allow anyone to view gallery photos
CREATE POLICY "Allow public select on gallery" ON gallery_photos
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Allow anyone to insert photos (because students upload photos during registration)
CREATE POLICY "Allow public insert on gallery" ON gallery_photos
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- ONLY Admins can delete from gallery
CREATE POLICY "Allow admin delete on gallery" ON gallery_photos
    FOR DELETE
    TO authenticated
    USING (true);

-- Done! Your database is now secured against unauthorized deletes and updates.
