import { useRef, useCallback } from "react";
import { Upload, X } from "lucide-react";
import { useDesignSystem } from "../../context/DesignSystemContext";

function ImageUploader({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (dataUrl: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => onChange(reader.result as string);
      reader.readAsDataURL(file);
    },
    [onChange],
  );

  return (
    <div>
      <label className="block font-body text-xs font-medium text-navy mb-1">{label}</label>
      <p className="font-body text-[10px] text-parchment mb-2">{description}</p>

      {value ? (
        <div className="relative inline-block">
          <img src={value} alt={label} className="w-32 h-32 object-contain rounded-xl border border-parchment bg-white" />
          <button
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-navy text-cream flex items-center justify-center hover:bg-navy/80 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-32 h-32 rounded-xl border-2 border-dashed border-parchment hover:border-gold/50 cursor-pointer transition-colors bg-cream/30">
          <Upload className="w-6 h-6 text-parchment mb-1" />
          <span className="font-body text-[10px] text-parchment text-center px-2">Upload image</span>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
      )}
    </div>
  );
}

export default function ImageStep() {
  const { config, updateConfig } = useDesignSystem();

  return (
    <div className="max-w-sm mx-auto space-y-6">
      <div>
        <h3 className="font-display text-sm text-navy mb-1">Monogram / Logo</h3>
        <p className="font-body text-[10px] text-parchment mb-3">
          Optional. Upload a custom monogram or logo to appear on the Polaroid frame bottom bezel.
          If not uploaded, your auto-generated initials will be used.
        </p>
        <ImageUploader
          label="Monogram"
          description="Recommended: transparent PNG, 200×200px"
          value={config.images.monogram}
          onChange={(v) => updateConfig({ images: { ...config.images, monogram: v } })}
        />
      </div>

      <div>
        <h3 className="font-display text-sm text-navy mb-1">Background Pattern</h3>
        <p className="font-body text-[10px] text-parchment mb-3">
          Optional. Upload a subtle pattern or texture for the page background.
          Leave empty for a solid color background.
        </p>
        <ImageUploader
          label="Background"
          description="Recommended: tileable pattern, light opacity"
          value={config.images.background}
          onChange={(v) => updateConfig({ images: { ...config.images, background: v } })}
        />
      </div>

      {/* Preview */}
      <div className="p-4 rounded-xl border border-parchment bg-cream/50">
        <p className="font-body text-[10px] text-parchment mb-2">Preview</p>
        <div
          className="w-full h-32 rounded-lg border border-parchment flex items-center justify-center"
          style={{
            backgroundColor: config.colors.cream,
            backgroundImage: config.images.background ? `url(${config.images.background})` : undefined,
            backgroundSize: "cover",
          }}
        >
          {config.images.monogram ? (
            <img src={config.images.monogram} alt="Monogram" className="w-16 h-16 object-contain" />
          ) : (
            <span className="font-display text-2xl text-gold">{config.monogram}</span>
          )}
        </div>
      </div>
    </div>
  );
}
