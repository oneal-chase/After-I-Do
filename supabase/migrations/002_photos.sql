-- 002_photos.sql — optional: store photo metadata in Supabase (FOSS replacement for Sheets)
-- If you keep GAS/Drive for images, you can skip this and just use weddings table.
-- If you want full Supabase, create storage bucket + this table and use Realtime for live wall.

-- Photos: one row per guest upload, isolated by wedding slug
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  wedding_slug text not null references public.weddings(slug) on delete cascade,
  phase text not null,
  image_url text not null,
  transcript text,
  file_id text,
  created_at timestamptz not null default now()
);
create index if not exists photos_wedding_slug_idx on public.photos (wedding_slug, created_at desc);

alter table public.photos enable row level security;

drop policy if exists "Public can read photos by wedding" on public.photos;
create policy "Public can read photos by wedding"
  on public.photos for select
  using (true);

drop policy if exists "Anyone can insert photos (guest upload)" on public.photos;
create policy "Anyone can insert photos (guest upload)"
  on public.photos for insert
  with check (true);

-- Storage bucket for images (run once)
-- insert into storage.buckets (id, name, public) values ('wedding-photos', 'wedding-photos', true)
--   on conflict (id) do nothing;
-- Then add storage policies in Dashboard > Storage > wedding-photos > Policies:
--   Allow public read, allow anon insert where bucket_id = 'wedding-photos'

-- Realtime for live wall (optional)
-- alter publication supabase_realtime add table public.photos;
