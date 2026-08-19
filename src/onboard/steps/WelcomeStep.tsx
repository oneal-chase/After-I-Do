import { useDesignSystem } from "../../context/DesignSystemContext";
import { generateMonogram } from "../../config/designTokens";
import { useCallback } from "react";

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

  const handleNameChange = useCallback(
    (value: string) => {
      updateConfig({
        coupleNames: value,
        monogram: generateMonogram(value),
      });
    },
    [updateConfig],
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

      <div>
        <label className="block font-body text-xs font-medium text-navy mb-1.5">GAS Webhook URL</label>
        <input
          type="url"
          value={config.gasEndpoint}
          onChange={(e) => updateConfig({ gasEndpoint: e.target.value })}
          placeholder="https://script.google.com/macros/s/.../exec"
          className="w-full px-4 py-3 rounded-xl border border-parchment bg-cream/50 font-body text-sm text-navy focus:outline-none focus:border-gold transition-colors"
        />
      </div>
    </div>
  );
}
