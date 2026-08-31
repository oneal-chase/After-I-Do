# Supabase — Single DB for Everything (replaces GAS) — FOSS

This project now uses **one Supabase (FOSS Postgres + Auth + Storage + Realtime + Edge Functions) as the single DB**. Images *still go to Google Drive by default* via the Edge Function, but **Google Apps Script can be deleted** — the `photos` + `weddings` tables are the source of truth.

Guest experience is visually unchanged: `/w/{slug}/camera` + live wall both hit Supabase.

## 1. Create project (2 min)

1. Go to https://supabase.com → New project (or `supabase init` locally — 100% FOSS)
2. Note `Project URL` and `anon key` (Settings → API)

## 2. Configure env (Vite)

Add to `.env` (and to Cloudflare Pages / Vercel dashboard):

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_SITE_URL=https://kendraanddiego.me
# VITE_GAS_WEBHOOK_URL is now legacy — leave empty to cut GAS out
```

If `VITE_SUPABASE_*` are *not* set, the app still builds but falls back to local `weddingStore` (offline demo).

## 3. Run migrations

In Supabase Dashboard → SQL Editor, run in order:

1. `supabase/migrations/001_weddings.sql`
2. `supabase/migrations/002_photos.sql` (now primary — unifies Drive + transcript in same DB)

Or with CLI:

```bash
npm i -g supabase
supabase link --project-ref YOUR_REF
supabase db push
```

## 3b. Keep Drive as image store (no GAS)

The Edge Function `supabase/functions/upload-photo` does Drive *and* DB:

1. Create a Service Account: https://console.cloud.google.com → IAM → Service Accounts → Create → JSON key
2. Create a Drive folder `Kendra-Diego Weddings` → Share it with the service account email (Editor)
3. Copy its folder ID from URL (`.../folders/FOLDER_ID`)
4. In Supabase Dashboard → Edge Functions → Secrets, set:

```
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","private_key":"-----BEGIN PRIVATE KEY-----...","client_email":"..."}
DRIVE_PARENT_FOLDER_ID=YOUR_FOLDER_ID
```

Deploy:

```bash
supabase functions deploy upload-photo --no-verify-jwt
```

From now on, `POST /functions/v1/upload-photo` saves the JPEG to `Drive/{weddingSlug}/{phaseName}/PHOTO_...jpg` (still viewable via `lh3.googleusercontent.com/d/{id}`) **and** inserts `photos` row for the live wall. If those two env vars are *not* set, it falls back to Supabase Storage `wedding-photos`.

You can now **delete the Apps Script project** and clear `VITE_GAS_WEBHOOK_URL`. The GAS code in `docs/BACKEND_SETUP.md` is kept only as a legacy reference.

## 4. Auth + Live wall

* Couples: `supabase.auth` email/password per wedding. RLS in `001_weddings.sql` lets public `SELECT where published=true` (guest splash/camera reads by `slug`), owner `INSERT/UPDATE/DELETE where auth.uid()=owner_id`.
* Guests: no auth. `LiveWall.tsx` queries `supabase.from("photos").select().eq("wedding_slug", slug).order("created_at",desc)` and subscribes via Realtime `photos-{slug}` channel — no polling lag. If Supabase isn’t configured, it falls back to `VITE_GAS_WEBHOOK_URL`.

## 5. Verify

```bash
npm run build
npm run dev
# Create a wedding at /onboard -> check Supabase Dashboard -> Table Editor -> weddings has your slug
# Scan QR -> /w/your-slug/camera — guest sees your theme, isolated
```

## Self-hosted FOSS alternative

Same SQL works on any Postgres. Run `supabase` locally via Docker (`supabase start`), or use PocketBase/Appwrite with the same `weddings` shape. The app only needs `VITE_SUPABASE_URL` pointed at your instance.
