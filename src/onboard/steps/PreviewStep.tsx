import { useState, useCallback } from "react";
import { Download, Upload, RotateCcw } from "lucide-react";
import { useDesignSystem } from "../../context/DesignSystemContext";
import { STORAGE_KEY } from "../../config/designTokens";

export default function PreviewStep() {
  const { config, resetConfig } = useDesignSystem();
  const [importing, setImporting] = useState(false);

  const dateStr = new Date(config.weddingDate + "T12:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const exportConfig = useCallback(() => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `wedding-settings-${config.coupleNames.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }, [config]);

  const importConfig = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".txt,.json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setImporting(true);
      try {
        const text = await file.text();
        const imported = JSON.parse(text);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(imported));
        window.location.reload();
      } catch {
        alert("Could not read that file. Please make sure it was exported from this app.");
      } finally {
        setImporting(false);
      }
    };
    input.click();
  }, []);

  const handleReset = useCallback(() => {
    if (confirm("Reset everything back to the original wedding design?")) {
      resetConfig();
    }
  }, [resetConfig]);

  return (
    <div className="max-w-sm mx-auto space-y-6">
      <div className="text-center">
        <h3 className="font-display text-lg text-navy mb-1">Your Wedding Setup</h3>
        <p className="font-body text-xs text-floral-slate">Review and save your design</p>
      </div>

      {/* Summary card */}
      <div className="p-5 rounded-xl border border-parchment bg-cream/50 space-y-4">
        {/* Preview header */}
        <div className="text-center pb-4 border-b border-parchment">
          {config.images.monogram ? (
            <img src={config.images.monogram} alt="Monogram" className="h-12 w-12 object-contain mx-auto mb-1" />
          ) : (
            <div className="font-display text-2xl text-gold tracking-widest mb-1">{config.monogram}</div>
          )}
          <p className="font-script text-xl text-navy">{config.coupleNames}</p>
          <p className="font-body text-xs text-floral-slate mt-1">{dateStr}</p>
          <p className="font-body text-[10px] text-parchment">{config.venue}</p>
        </div>

        {/* Color swatches */}
        <div>
          <p className="font-body text-[10px] text-parchment mb-1.5">Colors</p>
          <div className="flex gap-1.5">
            {Object.entries(config.colors).map(([key, color]) => (
              <div key={key} className="flex flex-col items-center gap-0.5">
                <div className="w-7 h-7 rounded-md border border-parchment" style={{ backgroundColor: color }} />
                <span className="font-body text-[7px] text-parchment">{key.slice(0, 3)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fonts */}
        <div>
          <p className="font-body text-[10px] text-parchment mb-1">Fonts</p>
          <div className="space-y-0.5">
            <p className="font-body text-xs text-navy">Script: <span className="text-floral-slate">{config.fonts.script}</span></p>
            <p className="font-body text-xs text-navy">Headings: <span className="text-floral-slate">{config.fonts.display}</span></p>
            <p className="font-body text-xs text-navy">Body: <span className="text-floral-slate">{config.fonts.body}</span></p>
          </div>
        </div>

        {/* Images */}
        <div>
          <p className="font-body text-[10px] text-parchment mb-1">Images</p>
          <p className="font-body text-xs text-navy">
            Monogram: <span className="text-floral-slate">{config.images.monogram ? "Custom uploaded" : "Auto-generated from names"}</span>
          </p>
          <p className="font-body text-xs text-navy">
            Background: <span className="text-floral-slate">{config.images.background ? "Custom uploaded" : "Solid color"}</span>
          </p>
        </div>

        {/* Timeline */}
        <div>
          <p className="font-body text-[10px] text-parchment mb-1">Schedule</p>
          {config.timeline.map((phase) => (
            <p key={phase.id} className="font-body text-xs text-navy">
              {phase.name}: <span className="text-floral-slate">{phase.start} – {phase.end}</span>
            </p>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={exportConfig}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-navy text-cream font-body text-sm font-semibold hover:bg-navy/90 transition-colors"
        >
          <Download className="w-4 h-4" />
          Save Settings to File
        </button>

        <button
          onClick={importConfig}
          disabled={importing}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border-2 border-navy/15 text-navy font-body text-sm font-semibold hover:bg-navy/5 transition-colors disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          {importing ? "Loading…" : "Load Settings from File"}
        </button>

        <button
          onClick={handleReset}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border border-parchment text-floral-slate font-body text-sm hover:bg-parchment/30 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Start Over with Defaults
        </button>
      </div>

      <p className="font-body text-[10px] text-parchment text-center">
        Your design is saved automatically in this browser.
        Export it as a backup file to restore your settings on another device.
      </p>
    </div>
  );
}
