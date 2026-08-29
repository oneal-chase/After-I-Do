import { useCallback } from "react";
import { useDesignSystem } from "../../context/DesignSystemContext";
import { FONT_OPTIONS, DISPLAY_FONT_OPTIONS, BODY_FONT_OPTIONS, getFontStack } from "../../config/designTokens";

function buildGoogleFontsUrl(fonts: { script: string; display: string; body: string }): string {
  const script = FONT_OPTIONS.find((f) => f.name === fonts.script) ?? FONT_OPTIONS[0];
  const display = DISPLAY_FONT_OPTIONS.find((f) => f.name === fonts.display) ?? DISPLAY_FONT_OPTIONS[0];
  const body = BODY_FONT_OPTIONS.find((f) => f.name === fonts.body) ?? BODY_FONT_OPTIONS[0];

  const families = [script.googleName, `${display.googleName}:wght@400;500;600;700`, `${body.googleName}:wght@300;400;500;600`];
  return `https://fonts.googleapis.com/css2?${families.map((f) => `family=${f}`).join("&")}&display=swap`;
}

export default function FontStep() {
  const { config, updateFonts } = useDesignSystem();

  const handleFontChange = useCallback(
    (type: "script" | "display" | "body", name: string) => {
      updateFonts({ [type]: name });
      // Inject the new Google Fonts link
      const link = document.getElementById("google-fonts") as HTMLLinkElement;
      if (link) {
        link.href = buildGoogleFontsUrl({ ...config.fonts, [type]: name });
      }
    },
    [updateFonts, config.fonts],
  );

  const sampleText = config.coupleNames || "Kendra & Diego";

  return (
    <div className="max-w-sm mx-auto space-y-6">
      {/* Live preview */}
      <div className="p-6 rounded-xl border border-parchment bg-cream/50 text-center">
        <p
          className="text-3xl mb-2 text-navy"
          style={{ fontFamily: getFontStack(config.fonts.script) }}
        >
          {sampleText}
        </p>
        <p
          className="text-lg text-floral-slate"
          style={{ fontFamily: getFontStack(config.fonts.display) }}
        >
          September 11, 2026
        </p>
        <p
          className="text-sm text-parchment mt-2"
          style={{ fontFamily: getFontStack(config.fonts.body) }}
        >
          The Starlight Garden • Spring, TX
        </p>
      </div>

      {/* Script font */}
      <div>
        <h3 className="font-display text-sm text-navy mb-1">Script / Names</h3>
        <p className="font-body text-[10px] text-parchment mb-3">Used for couple names and voice transcripts</p>
        <div className="space-y-2">
          {FONT_OPTIONS.map((font) => (
            <button
              key={font.name}
              onClick={() => handleFontChange("script", font.name)}
              className={`
                w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all
                ${config.fonts.script === font.name
                  ? "border-gold bg-gold/5"
                  : "border-parchment/60 hover:border-parchment bg-cream/30"
                }
              `}
            >
              <span className="text-lg text-navy" style={{ fontFamily: font.stack }}>
                {sampleText}
              </span>
              <span className="font-body text-[10px] text-parchment">{font.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Display font */}
      <div>
        <h3 className="font-display text-sm text-navy mb-1">Display / Headings</h3>
        <p className="font-body text-[10px] text-parchment mb-3">Used for headings, dates, and monogram</p>
        <div className="space-y-2">
          {DISPLAY_FONT_OPTIONS.map((font) => (
            <button
              key={font.name}
              onClick={() => handleFontChange("display", font.name)}
              className={`
                w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all
                ${config.fonts.display === font.name
                  ? "border-gold bg-gold/5"
                  : "border-parchment/60 hover:border-parchment bg-cream/30"
                }
              `}
            >
              <span className="text-lg text-navy" style={{ fontFamily: font.stack }}>
                {sampleText}
              </span>
              <span className="font-body text-[10px] text-parchment">{font.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Body font */}
      <div>
        <h3 className="font-display text-sm text-navy mb-1">Body / UI</h3>
        <p className="font-body text-[10px] text-parchment mb-3">Used for buttons, labels, and body text</p>
        <div className="space-y-2">
          {BODY_FONT_OPTIONS.map((font) => (
            <button
              key={font.name}
              onClick={() => handleFontChange("body", font.name)}
              className={`
                w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all
                ${config.fonts.body === font.name
                  ? "border-gold bg-gold/5"
                  : "border-parchment/60 hover:border-parchment bg-cream/30"
                }
              `}
            >
              <span className="text-sm text-navy" style={{ fontFamily: font.stack }}>
                {sampleText} — Body text sample
              </span>
              <span className="font-body text-[10px] text-parchment">{font.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
