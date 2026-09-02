import { useDesignSystem } from "../../context/DesignSystemContext";
import GoogleDriveConnect from "../../components/GoogleDriveConnect";
import { HardDrive } from "lucide-react";

export default function DriveStep() {
  const { config } = useDesignSystem();

  return (
    <div className="max-w-sm mx-auto space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-3">
          <HardDrive className="w-6 h-6 text-gold" />
        </div>
        <h3 className="font-display text-lg font-semibold text-navy">Save to Google Drive</h3>
        <p className="font-body text-xs text-floral-slate mt-1">
          For <span className="text-navy font-medium">{config.coupleNames || "your wedding"}</span> · <span className="font-mono text-navy">/w/{config.slug}</span>
        </p>
      </div>

      <GoogleDriveConnect />

      <div className="p-3 rounded-xl border border-parchment bg-cream/30">
        <p className="font-body text-xs font-medium text-navy">How it works</p>
        <ul className="font-body text-xs text-floral-slate list-disc ml-4 mt-2 space-y-1">
          <li>Tap <span className="text-navy font-medium">Connect Google Drive</span> — grant <span className="font-mono">drive.file</span> (we only create our own files).</li>
          <li>We auto-create <span className="font-mono text-navy">My Drive / Wedding Capture / {config.slug || "your-slug"}</span> with phase subfolders.</li>
          <li>Every guest photo saves to your Drive <em>and</em> the live wall. No folder IDs to paste.</li>
        </ul>
      </div>

      <p className="font-body text-[11px] text-parchment text-center">
        You can skip this — photos will still go to secure cloud storage and appear on the live wall. Connect anytime from your dashboard.
      </p>
    </div>
  );
}
