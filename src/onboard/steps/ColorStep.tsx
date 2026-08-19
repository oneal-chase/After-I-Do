import { useState, useCallback, useRef } from "react";
import { Upload, Pipette } from "lucide-react";
import { useDesignSystem } from "../../context/DesignSystemContext";
import { PALETTE_PRESETS, extractColorsFromImage, type ColorTokens } from "../../config/designTokens";

const COLOR_ROLES: { key: keyof ColorTokens; label: string; description: string }[] = [
  { key: "cream", label: "Background", description: "Page background" },
  { key: "navy", label: "Primary", description: "Text & buttons" },
  { key: "floralSlate", label: "Secondary", description: "Borders & accents" },
  { key: "mauve", label: "Accent", description: "Badges & highlights" },
  { key: "gold", label: "Ornament", description: "Gold lines & frames" },
  { key: "parchment", label: "Divider", description: "Cards & outlines" },
];

export default function ColorStep() {
  const { config, updateColors } = useDesignSystem();
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePreset = useCallback(
    (name: string, colors: ColorTokens) => {
      setActivePreset(name);
      updateColors(colors);
    },
    [updateColors],
  );

  const handleHexChange = useCallback(
    (key: keyof ColorTokens, value: string) => {
      setActivePreset(null);
      updateColors({ [key]: value });
    },
    [updateColors],
  );

  const handleImageExtract = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setExtracting(true);
      const url = URL.createObjectURL(file);
      try {
        const extracted = await extractColorsFromImage(url);
        updateColors(extracted);
        setActivePreset(null);
      } finally {
        setExtracting(false);
        URL.revokeObjectURL(url);
      }
    },
    [updateColors],
  );

  return (
    <div className="max-w-sm mx-auto space-y-6">
      {/* Preset palettes */}
      <div>
        <h3 className="font-display text-sm text-navy mb-3">Preset Palettes</h3>
        <div className="grid grid-cols-2 gap-2">
          {PALETTE_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handlePreset(preset.name, preset.colors)}
              className={`
                flex flex-col items-start p-3 rounded-xl border-2 transition-all text-left
                ${activePreset === preset.name
                  ? "border-gold bg-gold/5"
                  : "border-parchment/60 hover:border-parchment bg-cream/30"
                }
              `}
            >
              <div className="flex gap-1 mb-2">
                {Object.values(preset.colors).map((color, i) => (
                  <div key={i} className="w-5 h-5 rounded-full border border-white/50" style={{ backgroundColor: color }} />
                ))}
              </div>
              <span className="font-body text-[11px] text-navy font-medium">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Extract from image */}
      <div>
        <h3 className="font-display text-sm text-navy mb-3">Extract from Image</h3>
        <label className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border-2 border-dashed border-parchment hover:border-gold/50 cursor-pointer transition-colors bg-cream/30">
          <Upload className="w-4 h-4 text-floral-slate" />
          <span className="font-body text-xs text-floral-slate">
            {extracting ? "Extracting colors…" : "Upload an image to extract colors"}
          </span>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageExtract} />
        </label>
      </div>

      {/* Custom color editors */}
      <div>
        <h3 className="font-display text-sm text-navy mb-3">Custom Colors</h3>
        <div className="space-y-3">
          {COLOR_ROLES.map(({ key, label, description }) => (
            <div key={key} className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="color"
                  value={config.colors[key]}
                  onChange={(e) => handleHexChange(key, e.target.value)}
                  className="w-10 h-10 rounded-lg border border-parchment cursor-pointer appearance-none bg-transparent [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-body text-xs font-medium text-navy">{label}</span>
                  <span className="font-body text-[10px] text-parchment">— {description}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Pipette className="w-3 h-3 text-parchment" />
                  <input
                    type="text"
                    value={config.colors[key]}
                    onChange={(e) => {
                      if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                        handleHexChange(key, e.target.value);
                      }
                    }}
                    className="w-20 px-2 py-0.5 rounded border border-parchment/60 font-body text-[11px] text-floral-slate bg-cream/50 focus:outline-none focus:border-gold"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live preview swatch */}
      <div className="p-4 rounded-xl border border-parchment bg-cream/50">
        <p className="font-body text-[10px] text-parchment mb-2">Preview</p>
        <div className="flex gap-3 items-center">
          <div className="w-12 h-12 rounded-lg border border-parchment" style={{ backgroundColor: config.colors.cream }} />
          <div className="w-12 h-12 rounded-lg border border-parchment" style={{ backgroundColor: config.colors.navy }} />
          <div className="w-12 h-12 rounded-lg border border-parchment" style={{ backgroundColor: config.colors.floralSlate }} />
          <div className="w-12 h-12 rounded-lg border border-parchment" style={{ backgroundColor: config.colors.mauve }} />
          <div className="w-12 h-12 rounded-lg border border-parchment" style={{ backgroundColor: config.colors.gold }} />
          <div className="w-12 h-12 rounded-lg border border-parchment" style={{ backgroundColor: config.colors.parchment }} />
        </div>
      </div>
    </div>
  );
}
