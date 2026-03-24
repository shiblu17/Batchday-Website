
-- Allow updates on registrations (for admin to verify/reject and mark attendance)
CREATE POLICY "Anyone can update registrations"
  ON public.registrations FOR UPDATE
  USING (true)
  WITH CHECK (true);
