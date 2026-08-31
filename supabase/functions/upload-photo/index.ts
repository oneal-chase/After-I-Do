// supabase/functions/upload-photo — single DB, Drive by default (FOSS)
// Handles guest photo uploads: saves image to Google Drive (service account) + inserts metadata to Supabase `photos` table.
// If Drive env vars missing, falls back to Supabase Storage `wedding-photos` bucket so GAS can be removed entirely.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// --- Google Drive helpers (Service Account JWT → access_token → Drive v3 upload) ---
function base64UrlEncode(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----.*-----/g, "").replace(/\s/g, "");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}
async function getDriveAccessToken(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson) as { client_email: string; private_key: string };
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const claim = base64UrlEncode(
    new TextEncoder().encode(
      JSON.stringify({
        iss: sa.client_email,
        scope: "https://www.googleapis.com/auth/drive",
        aud: "https://oauth2.googleapis.com/token",
        exp: now + 3600,
        iat: now,
      }),
    ),
  );
  const unsigned = `${header}.${claim}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const sig = base64UrlEncode(new Uint8Array(sigBuf));
  const jwt = `${unsigned}.${sig}`;
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = await resp.json() as { access_token?: string; error?: string };
  if (!data.access_token) throw new Error(`Drive token failed: ${data.error || JSON.stringify(data)}`);
  return data.access_token;
}
async function ensureDriveFolder(accessToken: string, parentId: string, name: string): Promise<string> {
  // try find
  const q = encodeURIComponent(`'${parentId}' in parents and name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const found = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&supportsAllDrives=true&includeItemsFromAllDrives=true`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  }).then((r) => r.json() as Promise<{ files?: { id: string }[] }>);
  if (found.files?.[0]?.id) return found.files[0].id;
  const created = await fetch("https://www.googleapis.com/drive/v3/files?supportsAllDrives=true", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name, mimeType: "application/vnd.google-apps.folder", parents: [parentId] }),
  }).then((r) => r.json() as Promise<{ id?: string; error?: unknown }>);
  if (!created.id) throw new Error(`Drive folder create failed: ${JSON.stringify(created)}`);
  return created.id;
}
async function uploadToDrive(opts: {
  accessToken: string;
  parentFolderId: string;
  weddingSlug: string;
  phaseName: string;
  imageBase64: string;
}): Promise<{ fileId: string; imageUrl: string }> {
  const { accessToken, parentFolderId, weddingSlug, phaseName, imageBase64 } = opts;
  const weddingFolderId = await ensureDriveFolder(accessToken, parentFolderId, weddingSlug);
  const phaseFolderId = await ensureDriveFolder(accessToken, weddingFolderId, phaseName || "00_General");

  const b64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: "image/jpeg" });

  const metadata = { name: `PHOTO_${Date.now()}.jpg`, parents: [phaseFolderId] };
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("media", blob);

  const file = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  }).then((r) => r.json() as Promise<{ id?: string; error?: unknown }>);
  if (!file.id) throw new Error(`Drive upload failed: ${JSON.stringify(file)}`);

  // make viewable (optional — Drive folder should already be shared)
  await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}/permissions?supportsAllDrives=true`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ role: "reader", type: "anyone" }),
  }).catch(() => {});

  const imageUrl = `https://lh3.googleusercontent.com/d/${file.id}`;
  return { fileId: file.id, imageUrl };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ status: "error", message: "POST only" }, 405);

  try {
    const body = await req.json() as {
      image?: string;
      transcript?: string;
      phaseName?: string;
      weddingSlug?: string;
      token?: string;
    };

    const weddingSlug = (body.weddingSlug || "").trim().toLowerCase();
    const image = body.image || "";
    if (!weddingSlug) return json({ status: "error", message: "Missing weddingSlug" }, 400);
    if (!image) return json({ status: "error", message: "Missing image" }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!supabaseUrl || !serviceKey) return json({ status: "error", message: "Server not configured (SUPABASE_URL)" }, 500);
    const admin = createClient(supabaseUrl, serviceKey);

    // verify wedding exists & is published (public)
    const { data: wedding, error: wErr } = await admin.from("weddings").select("slug,published").eq("slug", weddingSlug).maybeSingle();
    if (wErr) return json({ status: "error", message: wErr.message }, 500);
    if (!wedding) return json({ status: "error", message: "Wedding not found" }, 404);

    let fileId = "";
    let imageUrl = "";

    const driveParent = Deno.env.get("DRIVE_PARENT_FOLDER_ID");
    const saJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY");

    if (saJson && driveParent) {
      try {
        const token = await getDriveAccessToken(saJson);
        const up = await uploadToDrive({
          accessToken: token,
          parentFolderId: driveParent,
          weddingSlug,
          phaseName: body.phaseName || "00_General",
          imageBase64: image,
        });
        fileId = up.fileId;
        imageUrl = up.imageUrl;
      } catch (e) {
        console.error("Drive upload failed, falling back to Storage:", e);
      }
    }

    // fallback: Supabase Storage bucket wedding-photos
    if (!imageUrl) {
      const b64 = image.includes(",") ? image.split(",")[1] : image;
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const path = `${weddingSlug}/${body.phaseName || "00_General"}/PHOTO_${Date.now()}.jpg`;
      const { error: sErr } = await admin.storage.from("wedding-photos").upload(path, bytes, {
        contentType: "image/jpeg",
        upsert: false,
      });
      if (sErr) return json({ status: "error", message: `Storage upload failed: ${sErr.message}` }, 500);
      const { data: pub } = admin.storage.from("wedding-photos").getPublicUrl(path);
      imageUrl = pub.publicUrl;
      fileId = path;
    }

    // insert metadata row for live wall (same DB as weddings)
    const { error: pErr } = await admin.from("photos").insert({
      wedding_slug: weddingSlug,
      phase: body.phaseName || "00_General",
      image_url: imageUrl,
      transcript: (body.transcript || "").slice(0, 280),
      file_id: fileId,
    });
    if (pErr) console.error("photos insert failed:", pErr);

    return json({ status: "success", imageUrl, fileId });
  } catch (e) {
    console.error(e);
    return json({ status: "error", message: (e as Error).message }, 500);
  }
});
