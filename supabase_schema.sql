-- 1. Create registrations table
CREATE TABLE public.registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    roll TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    department TEXT NOT NULL,
    hall TEXT NOT NULL,
    tshirt_size TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    tx_id TEXT NOT NULL,
    sender_number TEXT NOT NULL,
    photo_url TEXT,
    status TEXT DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create gallery_photos table
CREATE TABLE public.gallery_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    url TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create site_settings table
CREATE TABLE public.site_settings (
    id INTEGER PRIMARY KEY,
    event_date TEXT NOT NULL,
    registration_open BOOLEAN DEFAULT true NOT NULL,
    bkash_number TEXT NOT NULL,
    nagad_number TEXT NOT NULL
);

-- Insert initial settings row
INSERT INTO public.site_settings (id, event_date, registration_open, bkash_number, nagad_number)
VALUES (1, '2025-06-15T10:00:00+06:00', true, '01700000000', '01600000000');

-- 4. Enable Row Level Security (RLS) but make them fully public for now (matching local setup)
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all actions for everyone on registrations" ON public.registrations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all actions for everyone on gallery_photos" ON public.gallery_photos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable read for everyone on site_settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Enable update for everyone on site_settings" ON public.site_settings FOR UPDATE USING (true);
