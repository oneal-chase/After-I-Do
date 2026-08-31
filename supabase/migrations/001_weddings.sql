-- 001_weddings.sql — FOSS Supabase (Postgres) schema for private wedding isolation
-- Run: supabase db push  or paste into Supabase Dashboard > SQL Editor

-- Weddings: one row per couple, private slug -> isolated photos
create table if not exists public.weddings (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9-]{3,32}$'),
  wedding_id text not null, -- stable id from app makeWeddingId()
  owner_id uuid references auth.users(id) on delete set null,
  couple_names text not null,
  config jsonb not null, -- full WeddingConfig JSON (colors, fonts, timeline, etc.)
  gas_endpoint text,
  gas_token text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists weddings_slug_idx on public.weddings (slug);
create index if not exists weddings_owner_idx on public.weddings (owner_id);

-- keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists weddings_updated_at on public.weddings;
create trigger weddings_updated_at before update on public.weddings
  for each row execute function public.set_updated_at();

-- RLS: public can read published weddings by slug (guest splash/camera), owner can manage own
alter table public.weddings enable row level security;

drop policy if exists "Public can read published weddings" on public.weddings;
create policy "Public can read published weddings"
  on public.weddings for select
  using (published = true);

drop policy if exists "Owners can insert own wedding" on public.weddings;
create policy "Owners can insert own wedding"
  on public.weddings for insert
  with check (auth.uid() = owner_id or owner_id is null);

drop policy if exists "Owners can update own wedding" on public.weddings;
create policy "Owners can update own wedding"
  on public.weddings for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Owners can delete own wedding" on public.weddings;
create policy "Owners can delete own wedding"
  on public.weddings for delete
  using (auth.uid() = owner_id);

-- For local MVP where auth is not yet wired, allow anon insert/select by slug for dev
-- Remove this in production if you want strict owner-only writes:
drop policy if exists "Anon can read any published wedding" on public.weddings;
create policy "Anon can read any published wedding"
  on public.weddings for select
  using (true);
