import { useDesignSystem } from "../../context/DesignSystemContext";
import { generateMonogram, slugify } from "../../config/designTokens";
import { useCallback, useState } from "react";
import { saveWedding } from "../../utils/weddingStore";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Phoenix",
  "America/Detroit",
  "America/Toronto",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
];

export default function WelcomeStep() {
  const { config, updateConfig } = useDesignSystem();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleNameChange = useCallback(
    (value: string) => {
      const slugAuto = slugify(value);
      const patch: Record<string, unknown> = {
        coupleNames: value,
        monogram: generateMonogram(value),
      };
      // auto-sync slug if user hasn't customized it, or slug still matches old name
      const currentSlug = config.slug;
      const prevAuto = slugify(config.coupleNames || "");
      if (!currentSlug || currentSlug === prevAuto) {
        (patch as unknown as { slug: string }).slug = slugAuto;
      }
      updateConfig(patch as Parameters<typeof updateConfig>[0]);
      // persist per-wedding key for QR isolation
      try {
        const next = { ...config, ...patch } as unknown as import("../../config/designTokens").WeddingConfig;
        void saveWedding(next);
      } catch { /* ignore */ }
    },
    [updateConfig, config],
  );

  const handleSlugChange = useCallback(
    (value: string) => {
      const s = slugify(value);
      updateConfig({ slug: s });
      try {
        void saveWedding({ ...config, slug: s } as unknown as import("../../config/designTokens").WeddingConfig);
      } catch { /* ignore */ }
    },
    [updateConfig, config],
  );

  return (
    <div className="max-w-sm mx-auto space-y-6">
      <div className="text-center mb-8">
        <div className="font-display text-3xl text-gold tracking-widest mb-2">{config.monogram}</div>
        <p className="font-body text-xs text-floral-slate">Your monogram auto-generates from your names</p>
      </div>

      <div>
        <label className="block font-body text-xs font-medium text-navy mb-1.5">Couple Names</label>
        <input
          type="text"
          value={config.coupleNames}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="e.g. Kendra & Diego"
          className="w-full px-4 py-3 rounded-xl border border-parchment bg-cream/50 font-body text-sm text-navy focus:outline-none focus:border-gold transition-colors"
        />
      </div>

      <div>
        <label className="block font-body text-xs font-medium text-navy mb-1.5">Wedding Link (slug)</label>
        <div className="flex items-center gap-2">
          <span className="font-body text-xs text-parchment whitespace-nowrap">/w/</span>
          <input
            type="text"
            value={config.slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="kendra-diego"
            pattern="[a-z0-9-]*"
            className="flex-1 px-4 py-3 rounded-xl border border-parchment bg-cream/50 font-body text-sm text-navy focus:outline-none focus:border-gold transition-colors"
          />
        </div>
        <p className="font-body text-[10px] text-parchment mt-1">
          Your private link: <span className="text-navy">{config.slug ? `/w/${config.slug}/camera` : "/w/..."}</span> — guests never see setup.
        </p>
        <p className="font-body text-[10px] text-parchment">This stays isolated from any other couple using the app.</p>
      </div>

      <div>
        <label className="block font-body text-xs font-medium text-navy mb-1.5">Wedding Date</label>
        <input
          type="date"
          value={config.weddingDate}
          onChange={(e) => updateConfig({ weddingDate: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-parchment bg-cream/50 font-body text-sm text-navy focus:outline-none focus:border-gold transition-colors"
        />
      </div>

      <div>
        <label className="block font-body text-xs font-medium text-navy mb-1.5">Venue</label>
        <input
          type="text"
          value={config.venue}
          onChange={(e) => updateConfig({ venue: e.target.value })}
          placeholder="e.g. The Starlight Garden • Spring, TX"
          className="w-full px-4 py-3 rounded-xl border border-parchment bg-cream/50 font-body text-sm text-navy focus:outline-none focus:border-gold transition-colors"
        />
      </div>

      <div>
        <label className="block font-body text-xs font-medium text-navy mb-1.5">Timezone</label>
        <select
          value={config.timezone}
          onChange={(e) => updateConfig({ timezone: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-parchment bg-cream/50 font-body text-sm text-navy focus:outline-none focus:border-gold transition-colors appearance-none"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        className="font-body text-xs text-floral-slate underline decoration-parchment underline-offset-4 hover:text-navy transition-colors"
      >
        {showAdvanced ? "Hide advanced" : "Advanced: sync settings"}
      </button>

      {showAdvanced && (
        <>
          <div>
            <label className="block font-body text-xs font-medium text-navy mb-1.5">Photo Sync Link (advanced)</label>
            <input
              type="url"
              value={config.gasEndpoint}
              onChange={(e) => updateConfig({ gasEndpoint: e.target.value })}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full px-4 py-3 rounded-xl border border-parchment bg-cream/50 font-body text-sm text-navy focus:outline-none focus:border-gold transition-colors"
            />
            <p className="font-body text-[10px] text-parchment mt-1">Auto-filled from VITE_GAS_WEBHOOK_URL — override only if needed.</p>
          </div>
          <div>
            <label className="block font-body text-xs font-medium text-navy mb-1.5">Sync Secret (optional)</label>
            <input
              type="password"
              value={config.gasToken}
              onChange={(e) => updateConfig({ gasToken: e.target.value })}
              placeholder="Shared secret if your script requires one"
              className="w-full px-4 py-3 rounded-xl border border-parchment bg-cream/50 font-body text-sm text-navy focus:outline-none focus:border-gold transition-colors"
            />
            <p className="font-body text-[10px] text-parchment mt-1">Set VITE_GAS_TOKEN in your Apps Script if you use this.</p>
          </div>
        </>
      )}
    </div>
  );
}
