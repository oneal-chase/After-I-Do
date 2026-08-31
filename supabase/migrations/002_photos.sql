-- 002_photos.sql — now PRIMARY (GAS removed). Photos live in same Supabase DB as weddings; images still go to Drive by default via Edge Function.
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

-- Storage bucket for fallback when Drive not configured (Edge Function will use Drive first)
insert into storage.buckets (id, name, public) values ('wedding-photos', 'wedding-photos', true)
  on conflict (id) do nothing;

-- Storage RLS (run in dashboard if needed — Storage policies live in storage schema)
-- Realtime for live wall
alter publication supabase_realtime add table public.photos;
