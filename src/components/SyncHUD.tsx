import { useEffect, useState } from "react";
import { usePhotoSync } from "../hooks/usePhotoSync";

export default function SyncHUD() {
  const { status } = usePhotoSync();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(status.total > 0);
  }, [status.total]);

  if (!visible) return null;

  const uploading = status.uploading > 0;
  const pending = status.pending > 0;
  const offline = !status.isOnline;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
      <div
        className={`
          flex items-center gap-2.5 px-5 py-2.5 rounded-full shadow-lg
          font-body text-sm font-medium backdrop-blur-sm
          ${offline ? "bg-mauve/20 text-mauve border border-mauve/30" : ""}
          ${uploading ? "bg-navy text-cream border border-floral-slate/30" : ""}
          ${pending && !uploading ? "bg-parchment/80 text-navy border border-gold/30" : ""}
        `}
      >
        {uploading && (
          <>
            <span className="inline-block w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin" />
            <span>Saving photo ({status.uploading} of {status.pending + status.uploading})…</span>
          </>
        )}
        {offline && (
          <>
            <span className="w-2 h-2 rounded-full bg-mauve animate-pulse" />
            <span>Offline • Saved on device, syncing when online</span>
          </>
        )}
        {pending && !uploading && !offline && (
          <>
            <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
            <span>{status.pending} photo{status.pending > 1 ? "s" : ""} queued</span>
          </>
        )}
      </div>
    </div>
  );
}
