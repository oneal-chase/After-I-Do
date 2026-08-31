import { get, set } from "idb-keyval";
import { getWeddingConfig } from "../config/wedding.config";

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
        const endpoint = record.weddingSlug
          ? cfg.gasEndpoint // per-wedding endpoint is same deployment; slug is folder key — keep simple for now
          : cfg.gasEndpoint;
        if (!endpoint) throw new Error("No sync endpoint configured");

        const payload: Record<string, string> = {
          image: record.imageBase64,
          transcript: record.transcript ?? "",
          phaseName: record.phaseName,
          weddingSlug: record.weddingSlug ?? cfg.slug ?? "",
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
