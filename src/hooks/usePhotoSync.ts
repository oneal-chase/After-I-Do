import { useState, useEffect, useCallback } from "react";
import {
  enqueuePhoto,
  getQueueStatus,
  onQueueChange,
  processQueue,
} from "../utils/syncEngine";
import { getCurrentPhase } from "../config/wedding.config";
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
    refreshStatus();
    const unsub = onQueueChange(refreshStatus);

    const handleOnline = () => {
      refreshStatus();
      processQueue();
    };
    const handleOffline = () => refreshStatus();

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
      options?: { audioBlob?: Blob; audioMimeType?: string; transcript?: string },
    ) => {
      const stamped = await stampPolaroidFrame(imageBlob, getCurrentPhase());

      const toBase64 = (b: Blob) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(b);
        });

      const imageBase64 = await toBase64(stamped);
      let audioBase64: string | undefined;
      if (options?.audioBlob) {
        audioBase64 = await toBase64(options.audioBlob);
      }

      const record = await enqueuePhoto({
        imageBase64,
        audioBase64,
        audioMimeType: options?.audioMimeType,
        transcript: options?.transcript,
        phaseName: getCurrentPhase(),
      });

      await refreshStatus();
      return record;
    },
    [refreshStatus],
  );

  return { status, uploadPhoto };
}
