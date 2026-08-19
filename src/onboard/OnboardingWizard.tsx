import { useState, useCallback } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import WelcomeStep from "./steps/WelcomeStep";
import ColorStep from "./steps/ColorStep";
import FontStep from "./steps/FontStep";
import ImageStep from "./steps/ImageStep";
import TimelineStep from "./steps/TimelineStep";
import PreviewStep from "./steps/PreviewStep";

const STEPS = [
  { id: "welcome", label: "Details" },
  { id: "colors", label: "Colors" },
  { id: "fonts", label: "Fonts" },
  { id: "images", label: "Images" },
  { id: "timeline", label: "Timeline" },
  { id: "preview", label: "Launch" },
] as const;

interface OnboardingWizardProps {
  onComplete: () => void;
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);

  const next = useCallback(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), []);
  const prev = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);

  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="min-h-dvh flex flex-col bg-cream">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <h1 className="font-display text-2xl text-navy text-center mb-6">Customize Your Wedding</h1>

        {/* Progress bar */}
        <div className="flex items-center justify-center gap-2 mb-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div
                className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-xs font-body font-semibold
                  transition-all duration-300
                  ${i < step ? "bg-gold text-navy" : ""}
                  ${i === step ? "bg-navy text-cream ring-2 ring-gold/40 ring-offset-2 ring-offset-cream" : ""}
                  ${i > step ? "bg-parchment/60 text-floral-slate" : ""}
                `}
              >
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-6 h-0.5 mx-1 transition-colors duration-300 ${i < step ? "bg-gold" : "bg-parchment"}`} />
              )}
            </div>
          ))}
        </div>
        <p className="text-center font-body text-xs text-floral-slate">{STEPS[step].label}</p>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-6 pb-24">
        {step === 0 && <WelcomeStep />}
        {step === 1 && <ColorStep />}
        {step === 2 && <FontStep />}
        {step === 3 && <ImageStep />}
        {step === 4 && <TimelineStep />}
        {step === 5 && <PreviewStep />}
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-cream/90 backdrop-blur-sm border-t border-parchment px-6 py-4 flex items-center justify-between">
        <button
          onClick={prev}
          disabled={isFirst}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-body text-sm text-floral-slate hover:bg-parchment/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {!isLast ? (
          <button
            onClick={next}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-navy text-cream font-body text-sm font-semibold hover:bg-navy/90 transition-colors"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={onComplete}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gold text-navy font-body text-sm font-semibold hover:bg-gold/90 transition-colors"
          >
            <Check className="w-4 h-4" />
            Save & Launch
          </button>
        )}
      </div>
    </div>
  );
}
