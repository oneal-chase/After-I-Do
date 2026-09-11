import { getWeddingConfig } from "../config/wedding.config";
import { isSupabaseConfigured } from "../lib/supabase";
import { getDriveToken, uploadImageToDrive } from "../lib/googleDrive";

// Zero persistent storage: the upload queue is an in-memory array. Photos are
// uploaded directly; a failed photo stays in memory for retry while the page
// is open. Nothing is written to localStorage/IndexedDB.

export interface PhotoRecord {
  id: string;
  imageBase64: string;
  transcript?: string;
  guestName?: string;
  phaseName: string;
  weddingSlug?: string;
  status: "pending" | "uploading" | "synced" | "failed";
  timestamp: number;
  retries: number;
  error?: string;
}

const MAX_RETRIES = 3;
const records: PhotoRecord[] = [];
let syncing = false;

async function emitChange() {
  window.dispatchEvent(new CustomEvent("sync-queue-changed"));
}

export function onQueueChange(cb: () => void) {
  window.addEventListener("sync-queue-changed", cb);
  return () => window.removeEventListener("sync-queue-changed", cb);
}

export async function enqueuePhoto(record: Omit<PhotoRecord, "id" | "status" | "timestamp" | "retries">): Promise<PhotoRecord> {
  const entry: PhotoRecord = {
    ...record,
    id: crypto.randomUUID(),
    status: "pending",
    timestamp: Date.now(),
    retries: 0,
  };
  records.push(entry);
  await emitChange();
  void processQueue();
  return entry;
}

export function getQueueStatus(): {
  total: number;
  pending: number;
  uploading: number;
  synced: number;
  failed: number;
} {
  return {
    total: records.length,
    pending: records.filter((r) => r.status === "pending").length,
    uploading: records.filter((r) => r.status === "uploading").length,
    synced: records.filter((r) => r.status === "synced").length,
    failed: records.filter((r) => r.status === "failed").length,
  };
}

export function retryFailed(): void {
  for (const r of records) {
    if (r.status === "failed") {
      r.status = "pending";
      r.retries = 0;
      r.error = undefined;
    }
  }
  void processQueue();
}

async function ensureWeddingRow(supabase: NonNullable<Awaited<ReturnType<typeof import("../lib/supabase").getSupabaseClient>>>, slug: string, coupleNames: string): Promise<void> {
  const { data: existing } = await supabase.from("weddings").select("slug").eq("slug", slug).maybeSingle();
  if (!existing) {
    await supabase.from("weddings").insert({
      slug,
      wedding_id: slug,
      couple_names: coupleNames || slug,
      config: { slug, weddingId: slug, coupleNames: coupleNames || slug },
      published: true,
    });
  }
}

async function fallbackToStorage(supabase: NonNullable<Awaited<ReturnType<typeof import("../lib/supabase").getSupabaseClient>>>, record: PhotoRecord, weddingSlug: string): Promise<{ imageUrl: string; fileId: string }> {
  const path = `${weddingSlug}/${record.phaseName || "00_General"}/PHOTO_${Date.now()}_${record.id.slice(0, 6)}.jpg`;
  try {
    const b64 = record.imageBase64.includes(",") ? record.imageBase64.split(",")[1] : record.imageBase64;
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const { error: upErr } = await supabase.storage.from("wedding-photos").upload(path, bytes, { contentType: "image/jpeg", upsert: false });
    if (upErr) throw upErr;
    const { data: pub } = supabase.storage.from("wedding-photos").getPublicUrl(path);
    return { imageUrl: pub.publicUrl, fileId: path };
  } catch (e) {
    const msg = (e as Error).message || String(e);
    if (msg.includes("Bucket not found") || msg.includes("NoSuchBucket")) {
      // Bucket missing: store the image inline so the wall still shows it.
      const dataUrl = record.imageBase64.startsWith("data:") ? record.imageBase64 : `data:image/jpeg;base64,${record.imageBase64}`;
      return { imageUrl: dataUrl, fileId: `data-url:${record.id}` };
    }
    throw e;
  }
}

async function insertPhotoRow(supabase: NonNullable<Awaited<ReturnType<typeof import("../lib/supabase").getSupabaseClient>>>, record: PhotoRecord, weddingSlug: string, imageUrl: string, fileId: string): Promise<void> {
  const cfg = getWeddingConfig();
  await ensureWeddingRow(supabase, weddingSlug, cfg.coupleNames);
  const payload: Record<string, unknown> = {
    wedding_slug: weddingSlug,
    phase: record.phaseName,
    image_url: imageUrl,
    transcript: (record.transcript || "").slice(0, 280),
    file_id: fileId,
  };
  if (record.guestName) payload.guest_name = record.guestName.slice(0, 40);
  let { error } = await supabase.from("photos").insert(payload);
  // Graceful fallback: if the guest_name column hasn't been added yet, retry without it
  if (error && payload.guest_name && /guest_name/i.test(error.message)) {
    delete payload.guest_name;
    ({ error } = await supabase.from("photos").insert(payload));
  }
  if (error) throw new Error(`photos insert: ${error.message}`);
}

async function uploadRecord(record: PhotoRecord): Promise<void> {
  const cfg = getWeddingConfig();
  const weddingSlug = record.weddingSlug ?? cfg.slug ?? "";

  // 1) Couple's browser with Drive connected → direct upload, then record row
  const driveToken = getDriveToken();
  if (driveToken) {
    const { fileId, imageUrl } = await uploadImageToDrive({
      token: driveToken.token,
      weddingSlug,
      phaseName: record.phaseName,
      imageBase64: record.imageBase64,
    });
    if (isSupabaseConfigured) {
      const { getSupabaseClient } = await import("../lib/supabase");
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          await insertPhotoRow(supabase, record, weddingSlug, imageUrl, fileId);
        } catch (e) {
          console.warn("Drive upload succeeded but row insert failed, saving to Storage:", e);
          const stored = await fallbackToStorage(supabase, record, weddingSlug);
          await insertPhotoRow(supabase, record, weddingSlug, stored.imageUrl, stored.fileId);
        }
      }
    }
    return;
  }

  // 2) Guests (no Drive token) → Edge Function (Drive via service account, else Storage)
  if (isSupabaseConfigured) {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-photo`;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        image: record.imageBase64,
        transcript: record.transcript ?? "",
        guestName: record.guestName || undefined,
        phaseName: record.phaseName,
        weddingSlug,
      }),
    });
    if (!resp.ok) throw new Error(`Upload service HTTP ${resp.status}`);
    const body = await resp.json().catch(() => ({ status: "success" }));
    if (body.status === "error") throw new Error(body.message || "Upload rejected");
    return;
  }

  throw new Error("No upload backend configured (VITE_SUPABASE_URL missing)");
}

export async function processQueue(): Promise<void> {
  if (syncing) return;
  syncing = true;
  try {
    for (const record of records) {
      if (record.status !== "pending") continue;
      if (!navigator.onLine) break;

      record.status = "uploading";
      await emitChange();

      try {
        await uploadRecord(record);
        record.status = "synced";
        record.error = undefined;
      } catch (err) {
        record.retries += 1;
        record.error = (err as Error).message;
        if (record.retries >= MAX_RETRIES) {
          record.status = "failed";
        } else {
          record.status = "pending";
        }
        console.error("Upload failed:", err);
      }
      await emitChange();
    }
  } finally {
    syncing = false;
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    void processQueue();
  });
}
