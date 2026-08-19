import { get, set } from "idb-keyval";
import { getWeddingConfig } from "../config/wedding.config";

export interface PhotoRecord {
  id: string;
  imageBase64: string;
  audioBase64?: string;
  audioMimeType?: string;
  transcript?: string;
  phaseName: string;
  status: "pending" | "uploading" | "synced" | "failed";
  timestamp: number;
  retries: number;
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

async function processQueue() {
  const isAlreadySyncing = await get<boolean>(SYNC_KEY);
  if (isAlreadySyncing) return;
  await set(SYNC_KEY, true);

  try {
    const queue = await getQueue();
    const pending = queue.filter((r) => r.status === "pending");

    for (const record of pending) {
      if (!navigator.onLine) break;

      record.status = "uploading";
      await saveQueue(queue);
      await emitChange();

      try {
        const endpoint = getWeddingConfig().gasEndpoint;
        if (!endpoint) throw new Error("No GAS endpoint configured");

        const payload = {
          image: record.imageBase64,
          audio: record.audioBase64 ?? "",
          audioMimeType: record.audioMimeType ?? "audio/webm",
          transcript: record.transcript ?? "",
          phaseName: record.phaseName,
        };

        const resp = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload),
        });

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

        record.status = "synced";
      } catch (err) {
        record.retries += 1;
        if (record.retries >= 5) {
          record.status = "failed";
        }
        console.error("Upload failed:", err);
      }

      await saveQueue(queue);
      await emitChange();
    }
  } finally {
    await set(SYNC_KEY, false);
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    processQueue();
  });
}

export { processQueue };
