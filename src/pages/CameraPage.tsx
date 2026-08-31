import { useState, useCallback, useEffect, useRef } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { Link } from "react-router-dom";
import CameraViewfinder from "../components/CameraViewfinder";
import TextGuestbook from "../components/TextGuestbook";
import SyncHUD from "../components/SyncHUD";
import { usePhotoSync } from "../hooks/usePhotoSync";
import { getCurrentPhase, getPhaseDisplayName } from "../config/wedding.config";

type AppPhase = "capture" | "note" | "uploading" | "done";

export default function CameraPage() {
  const [appPhase, setAppPhase] = useState<AppPhase>("capture");
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [skipNote, setSkipNote] = useState(false);
  const { uploadPhoto } = usePhotoSync();
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const phase = getCurrentPhase();
  const displayName = getPhaseDisplayName(phase);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (capturedPreview) URL.revokeObjectURL(capturedPreview);
    };
  }, [capturedPreview]);

  const handleCapture = useCallback((blob: Blob) => {
    setCapturedPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(blob);
    });
    setCapturedBlob(blob);
    setAppPhase("note");
  }, []);

  const doUpload = useCallback(
    async (text: string | null) => {
      if (!capturedBlob) return;
      await uploadPhoto(capturedBlob, { transcript: text || undefined });
      setAppPhase("done");
      resetTimerRef.current = setTimeout(() => {
        setCapturedBlob(null);
        setCapturedPreview((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
        setNote(null);
        setSkipNote(false);
        setAppPhase("capture");
      }, 3000);
    },
    [capturedBlob, uploadPhoto],
  );

  const handleNoteComplete = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      setNote(trimmed || null);
      setAppPhase("uploading");
      void doUpload(trimmed || null);
    },
    [doUpload],
  );

  const handleSkipNote = useCallback(() => {
    setSkipNote(true);
    setAppPhase("uploading");
    void doUpload(null);
  }, [doUpload]);

  return (
    <div className="min-h-dvh flex flex-col bg-cream">
      <SyncHUD />

      <div className="flex items-center justify-between px-4 py-3 bg-navy text-cream z-10">
        <Link to="/" className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-mauve animate-pulse" />
          <span className="font-body text-xs font-medium">{displayName}</span>
        </div>
        <div className="w-9" />
      </div>

      <div className="flex-1 flex flex-col">
        {appPhase === "capture" && (
          <div className="flex-1 flex flex-col min-h-0">
            <CameraViewfinder onCapture={handleCapture} phaseName={displayName} />
          </div>
        )}

        {appPhase === "note" && (
          <div className="flex-1 flex flex-col">
            {capturedPreview && (
              <div className="flex items-center gap-3 px-4 py-3 bg-cream border-b border-parchment">
                <img src={capturedPreview} alt="Captured photo thumbnail" className="w-14 h-14 rounded-lg object-cover border border-gold/20" />
                <div className="flex-1">
                  <p className="font-body text-xs text-floral-slate">Photo captured</p>
                  <p className="font-body text-sm text-navy font-medium">Add a note?</p>
                </div>
                <button onClick={handleSkipNote} aria-label="Skip note and upload photo" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-parchment text-floral-slate font-body text-xs hover:bg-parchment/40 transition-colors">
                  Skip
                  <Check className="w-3 h-3" />
                </button>
              </div>
            )}
            <div className="flex-1 flex items-center justify-center overflow-y-auto">
              <TextGuestbook onComplete={handleNoteComplete} onCancel={() => setAppPhase("capture")} initialText={note || ""} />
            </div>
          </div>
        )}

        {appPhase === "uploading" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
            {capturedPreview && (
              <img src={capturedPreview} alt="Uploading preview" className="w-40 h-40 rounded-xl object-cover polaroid-shadow border-2 border-gold/20" />
            )}
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
              <span className="font-body text-sm text-navy">Saving your moment…</span>
            </div>
            {note && (
              <p className="font-script text-lg text-navy/60 text-center max-w-xs italic">
                &ldquo;{note}&rdquo;
              </p>
            )}
          </div>
        )}

        {appPhase === "done" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 animate-fade-in-up">
            <div className="w-16 h-16 rounded-full bg-floral-slate/15 flex items-center justify-center">
              <Check className="w-8 h-8 text-floral-slate" />
            </div>
            <h2 className="font-display text-xl text-navy">Photo Saved!</h2>
            <p className="font-body text-sm text-floral-slate text-center">
              {!skipNote && note ? "Your photo & note will appear on the live wall" : "Your photo will appear on the live wall"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
