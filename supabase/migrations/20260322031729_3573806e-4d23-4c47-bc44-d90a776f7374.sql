
-- Site settings key-value table
CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can read site settings" ON public.site_settings
  FOR SELECT TO public USING (true);

-- Only admins can update
CREATE POLICY "Admins can update site settings" ON public.site_settings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert site settings" ON public.site_settings
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete site settings" ON public.site_settings
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Gallery photos table
CREATE TABLE public.gallery_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  caption text,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view gallery" ON public.gallery_photos
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can insert gallery photos" ON public.gallery_photos
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete gallery photos" ON public.gallery_photos
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Insert default settings
INSERT INTO public.site_settings (key, value) VALUES
  ('event_date', '"2025-06-15T10:00:00+06:00"'),
  ('event_location', '{"name": "জাহাঙ্গীরনগর ক্যাম্পাস", "detail": "সেন্ট্রাল ফিল্ড"}'::jsonb),
  ('hero_title', '"JU-52"'),
  ('hero_subtitle', '"ব্যাচ ডে ২০২৫"'),
  ('hero_description', '"সবচেয়ে বড় পুনর্মিলনী। রেজিস্ট্রেশন করো, স্মৃতি শেয়ার করো, একসাথে উদযাপন করো।"'),
  ('registration_open', 'true'),
  ('registration_fee', '500'),
  ('bkash_number', '"01XXXXXXXXX"'),
  ('nagad_number', '"01XXXXXXXXX"');
