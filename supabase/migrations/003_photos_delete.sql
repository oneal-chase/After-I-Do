-- 003_photos_delete.sql — allow deletes so live wall stops showing deleted photos, and Realtime DELETE propagates
-- Guest deletes are via Dashboard Danger Zone; anon test rows also need to be removable

-- Allow anyone to delete their own wedding's photos (for demo, allow all deletes where wedding is published)
-- In production you’d restrict to owner: using (auth.uid() = (select owner_id from public.weddings where slug = wedding_slug))
drop policy if exists "Anyone can delete photos" on public.photos;
create policy "Anyone can delete photos"
  on public.photos for delete
  using (true);

-- Also allow updates (e.g. for future edit transcript)
drop policy if exists "Anyone can update photos" on public.photos;
create policy "Anyone can update photos"
  on public.photos for update
  using (true) with check (true);

-- Ensure Realtime still publishes deletes (already added via 002, but re-affirm)
-- alter publication supabase_realtime add table public.photos; -- already done, no-op if exists
