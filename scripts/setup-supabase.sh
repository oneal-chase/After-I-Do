#!/bin/bash
# scripts/setup-supabase.sh — one-shot backend setup for After I Do
#
# Fixes, in order:
#   1. Creates the `wedding-photos` Storage bucket + anon upload/read policies
#      (guest phones upload here; also the fallback when Drive isn't connected)
#   2. Applies 003_photos_delete.sql (delete/update policies so the live wall
#      stops showing deleted photos)
#   3. Deploys the `upload-photo` Edge Function (auto-creates wedding rows +
#      the bucket at runtime; uses Drive service account if secrets are set)
#
# Usage:
#   export SUPABASE_ACCESS_TOKEN=sbp_...   # supabase.com -> Account -> Access Tokens
#   bash scripts/setup-supabase.sh
#
# Optional (so GUEST photos also land in YOUR Drive — the one-click Drive button
# only covers photos taken in the couple's own browser):
#   export GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
#   export DRIVE_PARENT_FOLDER_ID=your_drive_folder_id

set -euo pipefail

PROJECT_REF="pnydklpoycbxviqmxltr"
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"

if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  echo "❌ SUPABASE_ACCESS_TOKEN not set."
  echo "   Get it: supabase.com -> click your avatar -> Access Tokens -> Generate"
  echo "   Then:   export SUPABASE_ACCESS_TOKEN=sbp_..."
  exit 1
fi

command -v jq >/dev/null || { echo "❌ jq required (brew install jq)"; exit 1; }

echo "==> 1) Creating storage bucket + policies (service role via Management API)"
# The Management API SQL endpoint runs as postgres — bypasses RLS like the SQL Editor.
run_sql() {
  curl -s -X POST "https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query" \
    -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"query\": $(jq -Rn --arg q "$1" '$q')}"
}

run_sql "insert into storage.buckets (id, name, public) values ('wedding-photos','wedding-photos', true) on conflict (id) do nothing;" | head -c 200; echo " (bucket)"

run_sql "drop policy if exists \"Anyone can upload to wedding-photos\" on storage.objects;
create policy \"Anyone can upload to wedding-photos\" on storage.objects for insert with check (bucket_id = 'wedding-photos');" | head -c 200; echo " (storage insert policy)"

run_sql "drop policy if exists \"Public read wedding-photos\" on storage.objects;
create policy \"Public read wedding-photos\" on storage.objects for select using (bucket_id = 'wedding-photos');" | head -c 200; echo " (storage read policy)"

echo "==> 2) Applying photo delete/update policies (003_photos_delete.sql)"
run_sql "drop policy if exists \"Anyone can delete photos\" on public.photos;
create policy \"Anyone can delete photos\" on public.photos for delete using (true);
drop policy if exists \"Anyone can update photos\" on public.photos;
create policy \"Anyone can update photos\" on public.photos for update using (true) with check (true);" | head -c 200; echo " (photo delete policy)"

echo "==> 3) Cleaning broken test rows (dead placeholder URLs)"
run_sql "delete from public.photos where image_url like '%via.placeholder.com%';" | head -c 200; echo " (cleanup)"

echo "==> 4) Deploying Edge Function upload-photo"
cd "$(dirname "$0")/.."
npx supabase functions deploy upload-photo --project-ref "$PROJECT_REF" --no-verify-jwt

# Optional Drive secrets for the Edge Function (so GUEST photos also go to your Drive)
if [ -n "${GOOGLE_SERVICE_ACCOUNT_KEY:-}" ] && [ -n "${DRIVE_PARENT_FOLDER_ID:-}" ]; then
  echo "==> 5) Setting Drive secrets on the Edge Function"
  printf 'GOOGLE_SERVICE_ACCOUNT_KEY=%s\nDRIVE_PARENT_FOLDER_ID=%s\n' "$GOOGLE_SERVICE_ACCOUNT_KEY" "$DRIVE_PARENT_FOLDER_ID" \
    | npx supabase secrets set --project-ref "$PROJECT_REF" --env-file /dev/stdin
  echo "✓ Drive secrets set — guest photos will now save to your Drive"
else
  echo "==> 5) Skipped Drive secrets (GOOGLE_SERVICE_ACCOUNT_KEY / DRIVE_PARENT_FOLDER_ID not set)"
  echo "   Guest photos will save to Supabase Storage and still appear on the live wall."
  echo "   To also mirror them to your Drive: create a service account JSON + Drive folder ID,"
  echo "   then re-run with GOOGLE_SERVICE_ACCOUNT_KEY and DRIVE_PARENT_FOLDER_ID exported."
fi

echo ""
echo "==> Verifying Edge Function"
SMALL_JPEG="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k="
ANON=$(grep '^VITE_SUPABASE_ANON_KEY=' .env | cut -d= -f2)
curl -s -X POST "${SUPABASE_URL}/functions/v1/upload-photo" \
  -H "apikey: ${ANON}" -H "Authorization: Bearer ${ANON}" -H "Content-Type: application/json" \
  -d "{\"weddingSlug\":\"setup-verify\",\"phaseName\":\"00_General\",\"image\":\"${SMALL_JPEG}\",\"transcript\":\"setup verify $(date +%s)\"}" | head -c 300; echo ""

echo ""
echo "✅ Done. Test on your phone: https://after-i-do.app/w/your-slug/camera"
echo "   (Queued photos that failed earlier will auto-retry when the camera page is reopened.)"
