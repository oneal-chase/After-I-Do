import { useState, useEffect, useCallback } from "react";
import { HardDrive, Check, LogOut, ExternalLink } from "lucide-react";
import { getDriveFolderId, getDriveToken, requestDriveAccess, clearDriveToken } from "../lib/googleDrive";

const hasClientId = Boolean((import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim());

export default function GoogleDriveConnect() {
  const [connected, setConnected] = useState(false);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setConnected(!!getDriveToken());
    setFolderId(getDriveFolderId());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleConnect = async () => {
    setError(null);
    setBusy(true);
    try {
      await requestDriveAccess();
      refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = () => {
    clearDriveToken();
    refresh();
  };

  if (!hasClientId) {
    return (
      <div className="p-4 rounded-xl border border-parchment bg-cream/30">
        <div className="flex items-start gap-3">
          <HardDrive className="w-5 h-5 text-parchment mt-0.5" />
          <div className="flex-1">
            <p className="font-body text-sm font-medium text-navy">Google Drive — not configured</p>
            <p className="font-body text-xs text-floral-slate mt-1">
              The site owner needs to add <span className="font-mono text-navy">VITE_GOOGLE_CLIENT_ID</span> (one-time, 2 min in Google Cloud). Until then photos save to secure cloud storage and still appear on the live wall.
            </p>
            <p className="font-body text-[11px] text-parchment mt-2">Guests are not affected — this is only for your Drive copy.</p>
          </div>
        </div>
      </div>
    );
  }

  if (connected) {
    return (
      <div className="p-4 rounded-xl border border-floral-slate/20 bg-floral-slate/10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-floral-slate/20 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-floral-slate" />
            </div>
            <div>
              <p className="font-body text-sm font-semibold text-navy">Drive connected</p>
              <p className="font-body text-xs text-floral-slate">
                New photos will be saved to your Google Drive automatically.
              </p>
              {folderId && (
                <a href={`https://drive.google.com/drive/folders/${folderId}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-body text-[11px] text-floral-slate underline decoration-parchment mt-1">
                  Open Drive folder <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
          <button onClick={handleDisconnect} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-parchment bg-white text-floral-slate font-body text-xs hover:bg-parchment/20 transition-colors">
            <LogOut className="w-3 h-3" />
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-gold/20 bg-gold/5">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
          <HardDrive className="w-4 h-4 text-gold" />
        </div>
        <div className="flex-1">
          <p className="font-body text-sm font-semibold text-navy">Save a copy to your Google Drive</p>
          <p className="font-body text-xs text-floral-slate mt-1">
            One click — we’ll create a folder <span className="font-mono text-navy">Wedding Capture / your-slug</span> and save every guest photo there. No folder IDs, no service account.
          </p>
          {error && <p className="font-body text-xs text-mauve bg-mauve/10 border border-mauve/20 rounded-lg px-3 py-2 mt-3">{error}</p>}
          <button onClick={handleConnect} disabled={busy} className="mt-3 flex items-center gap-2 px-5 py-2.5 rounded-full bg-navy text-cream font-body text-sm font-medium hover:bg-navy/90 transition-colors disabled:opacity-50">
            {busy ? <span className="w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin" /> : <HardDrive className="w-4 h-4" />}
            {busy ? "Connecting…" : "Connect Google Drive"}
          </button>
          <p className="font-body text-[11px] text-parchment mt-2">You can skip — photos still go to the live wall via secure storage.</p>
        </div>
      </div>
    </div>
  );
}
