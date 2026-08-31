import { useState, useCallback } from "react";
import { Check, RotateCcw, ArrowLeft, MessageCircle } from "lucide-react";
import { useDesignSystem } from "../context/DesignSystemContext";

interface TextGuestbookProps {
  onComplete: (text: string) => void;
  onCancel: () => void;
  initialText?: string;
}

const MAX_LEN = 280;

export default function TextGuestbook({ onComplete, onCancel, initialText = "" }: TextGuestbookProps) {
  const { config } = useDesignSystem();
  const [text, setText] = useState(initialText);

  const remaining = MAX_LEN - text.length;
  const trimmed = text.trim();

  const handleSubmit = useCallback(() => {
    onComplete(trimmed);
  }, [onComplete, trimmed]);

  return (
    <div className="flex flex-col items-center gap-6 py-8 w-full max-w-sm mx-auto px-4">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-mauve/10 border border-mauve/20 flex items-center justify-center mx-auto mb-3">
          <MessageCircle className="w-6 h-6 text-mauve" />
        </div>
        <h3 className="font-display text-xl text-navy mb-1">Leave a Note</h3>
        <p className="font-body text-sm text-floral-slate">
          For {config.coupleNames} — up to {MAX_LEN} characters.
        </p>
      </div>

      <div className="w-full">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
          placeholder={`Dear ${config.coupleNames.split("&")[0]?.trim() || "you two"},\nSo happy for you…`}
          rows={4}
          autoFocus
          className="w-full min-h-[110px] px-4 py-3 rounded-2xl border border-parchment bg-cream/60 font-body text-sm text-navy placeholder:text-parchment/70 resize-none focus:outline-none focus:border-gold focus:bg-cream transition-colors"
        />
        <div className="flex justify-between mt-1.5 px-1">
          <span className={`font-body text-[11px] ${remaining < 20 ? "text-mauve" : "text-parchment"}`}>
            {remaining} left
          </span>
          <span className="font-script text-xs text-navy/40 hidden sm:inline">Your note appears on the live wall</span>
        </div>
      </div>

      <div className="flex flex-col w-full gap-3">
        <button
          onClick={handleSubmit}
          disabled={!trimmed}
          className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-full bg-gold text-navy font-body text-sm font-semibold hover:bg-gold/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Check className="w-4 h-4" />
          Attach to Photo
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => setText("")}
            disabled={!text}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-parchment text-floral-slate font-body text-sm hover:bg-parchment/30 transition-colors disabled:opacity-30"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear
          </button>
          <button
            onClick={onCancel}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-parchment text-floral-slate font-body text-sm hover:bg-parchment/30 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
        </div>
        <p className="font-body text-[11px] text-parchment text-center">
          You can also skip — your photo will still be saved.
        </p>
      </div>
    </div>
  );
}
