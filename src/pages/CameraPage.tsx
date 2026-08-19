import { useState, useCallback } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { Link } from "react-router-dom";
import CameraViewfinder from "../components/CameraViewfinder";
import AudioGuestbook from "../components/AudioGuestbook";
import SyncHUD from "../components/SyncHUD";
import { usePhotoSync } from "../hooks/usePhotoSync";
import { getCurrentPhase, getPhaseDisplayName } from "../config/wedding.config";

type AppPhase = "capture" | "voice" | "uploading" | "done";

export default function CameraPage() {
  const [appPhase, setAppPhase] = useState<AppPhase>("capture");
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [voiceResult, setVoiceResult] = useState<{
    audioBlob: Blob | null;
    audioMimeType: string;
    transcript: string;
  } | null>(null);
  const [skipVoice, setSkipVoice] = useState(false);
  const { uploadPhoto } = usePhotoSync();

  const phase = getCurrentPhase();
  const displayName = getPhaseDisplayName(phase);

  const handleCapture = useCallback((blob: Blob) => {
    setCapturedBlob(blob);
    setCapturedPreview(URL.createObjectURL(blob));
    setAppPhase("voice");
  }, []);

  const doUpload = useCallback(
    async (voice: { audioBlob: Blob | null; audioMimeType: string; transcript: string } | null) => {
      if (!capturedBlob) return;
      await uploadPhoto(capturedBlob, voice ? { audioBlob: voice.audioBlob ?? undefined, audioMimeType: voice.audioMimeType, transcript: voice.transcript } : undefined);
      setAppPhase("done");
      setTimeout(() => {
        setCapturedBlob(null);
        setCapturedPreview(null);
        setVoiceResult(null);
        setSkipVoice(false);
        setAppPhase("capture");
      }, 3000);
    },
    [capturedBlob, uploadPhoto],
  );

  const handleVoiceComplete = useCallback(
    (result: { audioBlob: Blob | null; audioMimeType: string; transcript: string }) => {
      setVoiceResult(result);
      setAppPhase("uploading");
      doUpload(result);
    },
    [doUpload],
  );

  const handleSkipVoice = useCallback(() => {
    setSkipVoice(true);
    setAppPhase("uploading");
    doUpload(null);
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
          <div className="flex-1">
            <CameraViewfinder onCapture={handleCapture} phaseName={displayName} />
          </div>
        )}

        {appPhase === "voice" && (
          <div className="flex-1 flex flex-col">
            {capturedPreview && (
              <div className="flex items-center gap-3 px-4 py-3 bg-cream border-b border-parchment">
                <img src={capturedPreview} alt="Captured" className="w-14 h-14 rounded-lg object-cover border border-gold/20" />
                <div className="flex-1">
                  <p className="font-body text-xs text-floral-slate">Photo captured</p>
                  <p className="font-body text-sm text-navy font-medium">Add a voice message?</p>
                </div>
                <button onClick={handleSkipVoice} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-parchment text-floral-slate font-body text-xs hover:bg-parchment/40 transition-colors">
                  Skip
                  <Check className="w-3 h-3" />
                </button>
              </div>
            )}
            <div className="flex-1 flex items-center justify-center">
              <AudioGuestbook onComplete={handleVoiceComplete} onCancel={() => setAppPhase("capture")} />
            </div>
          </div>
        )}

        {appPhase === "uploading" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
            {capturedPreview && (
              <img src={capturedPreview} alt="Uploading" className="w-40 h-40 rounded-xl object-cover polaroid-shadow border-2 border-gold/20" />
            )}
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
              <span className="font-body text-sm text-navy">Saving your moment…</span>
            </div>
            {voiceResult?.transcript && (
              <p className="font-script text-lg text-navy/60 text-center max-w-xs italic">
                &ldquo;{voiceResult.transcript}&rdquo;
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
              {!skipVoice ? "Your photo & voice message will appear on the live wall" : "Your photo will appear on the live wall"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
