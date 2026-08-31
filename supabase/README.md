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

## 3b. Drive for non-technical couples — one-click (recommended)

No service account needed for couples:

1. **You (site owner) once:** https://console.cloud.google.com → APIs & Services → Credentials → Create → OAuth client ID → Web application → Authorized JavaScript origins: `https://yourdomain.me`, `http://localhost:5173` → Copy Client ID → set `VITE_GOOGLE_CLIENT_ID` in `.env` + Cloudflare.
2. **Couple:** Dashboard → **Connect Google Drive** → Grant `drive.file` (app can only create its own files, not read whole Drive) → we auto-create `My Drive / Wedding Capture / {slug} / {phase}` and save every photo there. Button shows “Drive connected” + link to folder.
3. **If they skip:** photos still go to Supabase Storage `wedding-photos` + `photos` table and appear on the live wall; they can connect later.

**Legacy service-account mode (still works):** If you prefer a server-owned Drive (no per-couple OAuth), set in Supabase Edge Secrets `GOOGLE_SERVICE_ACCOUNT_KEY` + `DRIVE_PARENT_FOLDER_ID` and deploy `supabase functions deploy upload-photo --no-verify-jwt`. Couples then need no button at all. Client OAuth takes precedence when a token exists.

You can now **delete the Apps Script project** and clear `VITE_GAS_WEBHOOK_URL`. The GAS code in `docs/BACKEND_SETUP.md` is kept only as legacy reference.

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
