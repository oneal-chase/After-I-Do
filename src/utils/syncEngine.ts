import { get, set } from "idb-keyval";
import { getWeddingConfig } from "../config/wedding.config";
import { isSupabaseConfigured } from "../lib/supabase";
import { getDriveToken, uploadImageToDrive } from "../lib/googleDrive";

export interface PhotoRecord {
  id: string;
  imageBase64: string;
  transcript?: string;
  phaseName: string;
  weddingSlug?: string;
  status: "pending" | "uploading" | "synced" | "failed";
  timestamp: number;
  retries: number;
  nextAttemptAt?: number;
  // legacy — kept for reading old queue entries, not written for new photos
  audioBase64?: string;
  audioMimeType?: string;
}

const QUEUE_KEY = "wedding-photo-queue";
const SYNC_KEY = "wedding-sync-active";

async function getQueue(): Promise<PhotoRecord[]> {
  return (await get<PhotoRecord[]>(QUEUE_KEY)) ?? [];
}

async function saveQueue(queue: PhotoRecord[]): Promise<void> {
  await set(QUEUE_KEY, queue);
}

async function emitChange() {
  window.dispatchEvent(new CustomEvent("sync-queue-changed"));
}

export function onQueueChange(cb: () => void) {
  window.addEventListener("sync-queue-changed", cb);
  return () => window.removeEventListener("sync-queue-changed", cb);
}

export async function enqueuePhoto(record: Omit<PhotoRecord, "id" | "status" | "timestamp" | "retries">): Promise<PhotoRecord> {
  const queue = await getQueue();
  const entry: PhotoRecord = {
    ...record,
    id: crypto.randomUUID(),
    status: "pending",
    timestamp: Date.now(),
    retries: 0,
  };
  queue.push(entry);
  await saveQueue(queue);
  await emitChange();
  processQueue();
  return entry;
}

export async function getPendingCount(): Promise<number> {
  const queue = await getQueue();
  return queue.filter((r) => r.status !== "synced").length;
}

export async function getQueueStatus(): Promise<{
  total: number;
  pending: number;
  uploading: number;
  synced: number;
  failed: number;
}> {
  const queue = await getQueue();
  return {
    total: queue.length,
    pending: queue.filter((r) => r.status === "pending").length,
    uploading: queue.filter((r) => r.status === "uploading").length,
    synced: queue.filter((r) => r.status === "synced").length,
    failed: queue.filter((r) => r.status === "failed").length,
  };
}

export async function purgeSynced(): Promise<void> {
  const queue = await getQueue();
  const now = Date.now();
  const filtered = queue.filter(
    (r) => r.status !== "synced" || now - r.timestamp < 2 * 60 * 1000,
  );
  if (filtered.length !== queue.length) {
    await saveQueue(filtered);
    await emitChange();
  }
}

let inMemorySyncing = false;

async function processQueue() {
  if (inMemorySyncing) return;
  const isAlreadySyncing = await get<boolean>(SYNC_KEY);
  if (isAlreadySyncing) return;
  inMemorySyncing = true;
  await set(SYNC_KEY, true);

  try {
    const queue = await getQueue();
    const now = Date.now();
    const pending = queue.filter((r) => r.status === "pending" && (!r.nextAttemptAt || r.nextAttemptAt <= now));

    for (const record of pending) {
      if (!navigator.onLine) break;

      record.status = "uploading";
      await saveQueue(queue);
      await emitChange();

      try {
        const cfg = getWeddingConfig();
        const weddingSlug = record.weddingSlug ?? cfg.slug ?? "";

        // Helper: last-resort direct upload to Supabase Storage + photos row (so live wall always works even if Drive/Edge fails)
        // If bucket is missing (404 NoSuchBucket), we still insert the photo as a data URL so the wall isn't empty.
        const fallbackToStorage = async (): Promise<{ imageUrl: string; fileId: string }> => {
          if (!isSupabaseConfigured) throw new Error("No Supabase configured for storage fallback");
          const { supabase } = await import("../lib/supabase");
          if (!supabase) throw new Error("Supabase client missing");
          const path = `${weddingSlug}/${record.phaseName || "00_General"}/PHOTO_${Date.now()}_${record.id.slice(0, 6)}.jpg`;
          try {
            const b64 = record.imageBase64.includes(",") ? record.imageBase64.split(",")[1] : record.imageBase64;
            const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
            const { error: upErr } = await supabase.storage.from("wedding-photos").upload(path, bytes, { contentType: "image/jpeg", upsert: false });
            if (upErr) throw upErr;
            const { data: pub } = supabase.storage.from("wedding-photos").getPublicUrl(path);
            const imageUrl = pub.publicUrl;
            const { error: insErr } = await supabase.from("photos").insert({
              wedding_slug: weddingSlug,
              phase: record.phaseName,
              image_url: imageUrl,
              transcript: (record.transcript || "").slice(0, 280),
              file_id: path,
            });
            if (insErr) throw insErr;
            return { imageUrl, fileId: path };
          } catch (e) {
            const msg = (e as Error).message || String(e);
            const isBucketMissing = msg.includes("Bucket not found") || msg.includes("NoSuchBucket");
            if (isBucketMissing) {
              console.warn("Storage bucket missing — inserting photo as data URL for live wall. Create bucket wedding-photos in Supabase Storage to use URLs:", e);
              // Fallback: store the image as a data URL directly (works for < ~1MB stamped photos; wall will show it)
              const dataUrl = record.imageBase64.startsWith("data:") ? record.imageBase64 : `data:image/jpeg;base64,${record.imageBase64}`;
              const { error: insErr2 } = await supabase.from("photos").insert({
                wedding_slug: weddingSlug,
                phase: record.phaseName,
                image_url: dataUrl,
                transcript: (record.transcript || "").slice(0, 280),
                file_id: `data-url:${record.id}`,
              });
              if (insErr2) throw insErr2;
              return { imageUrl: dataUrl, fileId: `data-url:${record.id}` };
            }
            throw e;
          }
        };

        // 1) If couple connected Drive via one-click OAuth (non-technical happy path), upload directly to Drive
        const driveToken = getDriveToken();
        if (driveToken) {
          try {
            const { fileId, imageUrl } = await uploadImageToDrive({
              token: driveToken.token,
              weddingSlug,
              phaseName: record.phaseName,
              imageBase64: record.imageBase64,
            });
            if (isSupabaseConfigured) {
              try {
                const { supabase } = await import("../lib/supabase");
                if (supabase) {
                  await supabase.from("photos").insert({
                    wedding_slug: weddingSlug,
                    phase: record.phaseName,
                    image_url: imageUrl,
                    transcript: (record.transcript || "").slice(0, 280),
                    file_id: fileId,
                  });
                }
              } catch { /* non-fatal */ }
            }
            record.status = "synced";
            record.nextAttemptAt = undefined;
          } catch (driveErr) {
            console.warn("Drive direct upload failed, falling back to Supabase Storage:", driveErr);
            // fallback so live wall still works even if Drive token expired/revoked
            const { imageUrl } = await fallbackToStorage();
            console.warn("Fallback Storage succeeded:", imageUrl);
            record.status = "synced";
            record.nextAttemptAt = undefined;
          }
        } else if (isSupabaseConfigured) {
          // Try Edge Function (does Drive server-side if service account configured, else Storage)
          try {
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
                phaseName: record.phaseName,
                weddingSlug,
                token: cfg.gasToken || undefined,
              }),
            });
            if (!resp.ok) throw new Error(`Edge Function HTTP ${resp.status}`);
            const body = await resp.json().catch(() => ({ status: "success" }));
            if (body.status === "error") throw new Error(body.message || "Upload rejected");
            record.status = "synced";
            record.nextAttemptAt = undefined;
          } catch (edgeErr) {
            console.warn("Edge Function failed, falling back to direct Storage:", edgeErr);
            await fallbackToStorage();
            record.status = "synced";
            record.nextAttemptAt = undefined;
          }
        } else {
          const endpoint = cfg.gasEndpoint;
          if (!endpoint) throw new Error("No sync endpoint configured (set VITE_SUPABASE_URL or VITE_GAS_WEBHOOK_URL)");
          const payload: Record<string, string> = {
            image: record.imageBase64,
            transcript: record.transcript ?? "",
            phaseName: record.phaseName,
            weddingSlug,
          };
          if (cfg.gasToken) payload.token = cfg.gasToken;
          const resp = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload),
          });
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          const body = await resp.json().catch(() => ({ status: "success" }));
          if (body.status === "error") throw new Error(body.message || "Upload rejected");
          record.status = "synced";
          record.nextAttemptAt = undefined;
        }
      } catch (err) {
        record.retries += 1;
        if (record.retries >= 5) {
          record.status = "failed";
        } else {
          record.status = "pending";
          const jitter = Math.random() * 1000;
          const delay = Math.pow(2, record.retries) * 1000 + jitter;
          record.nextAttemptAt = Date.now() + delay;
        }
        console.error("Upload failed:", err);
      }

      await saveQueue(queue);
      await emitChange();
    }
  } finally {
    await set(SYNC_KEY, false);
    inMemorySyncing = false;
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    void processQueue();
  });
}

export { processQueue };
