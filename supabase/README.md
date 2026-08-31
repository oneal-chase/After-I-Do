# Supabase — FOSS Postgres for Wedding Isolation

This project uses **Supabase** (FOSS, self-hostable Postgres + Auth + Storage + Realtime) as the primary DB. Guests stay visually unchanged — only the data layer gains isolation per `slug`.

## 1. Create project (2 min)

1. Go to https://supabase.com → New project (or `supabase init` locally — 100% FOSS)
2. Note `Project URL` and `anon key` (Settings → API)

## 2. Configure env

Add to `.env` (and to Cloudflare Pages / Vercel dashboard):

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
# keep existing for photo uploads until you migrate fully to Storage
VITE_GAS_WEBHOOK_URL=https://script.google.com/macros/s/.../exec
VITE_SITE_URL=https://kendraanddiego.me
```

See `.env.example`.

If `VITE_SUPABASE_*` are *not* set, the app falls back to the local `weddingStore` (localStorage + GAS) — guest flow still works, just without central DB.

## 3. Run migrations

In Supabase Dashboard → SQL Editor, run in order:

1. `supabase/migrations/001_weddings.sql`
2. `supabase/migrations/002_photos.sql` (optional if you keep Drive)

Or with CLI:

```bash
npm i -g supabase
supabase link --project-ref YOUR_REF
supabase db push
```

## 4. Auth

The app uses `supabase.auth` with email/password per couple. RLS in `001_weddings.sql` lets:

* public `SELECT` where `published = true` (guest splash/camera reads by `slug`)
* owner `INSERT/UPDATE/DELETE` where `auth.uid() = owner_id`

No guest auth required.

## 5. Verify

```bash
npm run build
npm run dev
# Create a wedding at /onboard -> check Supabase Dashboard -> Table Editor -> weddings has your slug
# Scan QR -> /w/your-slug/camera — guest sees your theme, isolated
```

## Self-hosted FOSS alternative

Same SQL works on any Postgres. Run `supabase` locally via Docker (`supabase start`), or use PocketBase/Appwrite with the same `weddings` shape. The app only needs `VITE_SUPABASE_URL` pointed at your instance.
