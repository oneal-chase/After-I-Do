import { useState, useEffect, useCallback } from "react";
import {
  enqueuePhoto,
  getQueueStatus,
  onQueueChange,
  processQueue,
} from "../utils/syncEngine";
import { getCurrentPhase, getWeddingConfig } from "../config/wedding.config";
import { stampPolaroidFrame } from "../utils/frameProcessor";

export interface SyncStatus {
  total: number;
  pending: number;
  uploading: number;
  synced: number;
  failed: number;
  isOnline: boolean;
}

export function usePhotoSync() {
  const [status, setStatus] = useState<SyncStatus>({
    total: 0,
    pending: 0,
    uploading: 0,
    synced: 0,
    failed: 0,
    isOnline: navigator.onLine,
  });

  const refreshStatus = useCallback(async () => {
    const s = await getQueueStatus();
    setStatus({ ...s, isOnline: navigator.onLine });
  }, []);

  useEffect(() => {
    void refreshStatus();
    const unsub = onQueueChange(() => { void refreshStatus(); });

    const handleOnline = () => {
      void refreshStatus();
      void processQueue();
    };
    const handleOffline = () => { void refreshStatus(); };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      unsub();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [refreshStatus]);

  const uploadPhoto = useCallback(
    async (
      imageBlob: Blob,
      options?: { transcript?: string },
    ) => {
      const imageToUpload = imageBlob;
      const MAX_RAW_BYTES = 8 * 1024 * 1024;
      if (imageToUpload.size > MAX_RAW_BYTES) {
        throw new Error("Photo is too large. Try retaking with a lower resolution.");
      }

      const stamped = await stampPolaroidFrame(imageToUpload, getCurrentPhase());

      const toBase64 = (b: Blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Failed to read image"));
          reader.readAsDataURL(b);
        });

      const imageBase64 = await toBase64(stamped);
      const phaseName = getCurrentPhase();
      const weddingSlug = (() => {
        try { return getWeddingConfig().slug || ""; } catch { return ""; }
      })();

      const record = await enqueuePhoto({
        imageBase64,
        transcript: options?.transcript?.slice(0, 280),
        phaseName,
        weddingSlug: weddingSlug || undefined,
      });

      await refreshStatus();
      return record;
    },
    [refreshStatus],
  );

  return { status, uploadPhoto };
}
