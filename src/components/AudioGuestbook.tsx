import { useState, useRef, useCallback } from "react";
import { Mic, MicOff, Play, Pause, Check, RotateCcw } from "lucide-react";
import {
  AudioGuestbookEngine,
  isSpeechSupported,
  isMediaRecorderSupported,
} from "../utils/audioGuestbook";

interface AudioGuestbookProps {
  onComplete: (result: {
    audioBlob: Blob | null;
    audioMimeType: string;
    transcript: string;
  }) => void;
  onCancel: () => void;
}

export default function AudioGuestbook({ onComplete }: AudioGuestbookProps) {
  const [phase, setPhase] = useState<"idle" | "recording" | "review">("idle");
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioMimeType, setAudioMimeType] = useState("audio/webm");
  const [isPlaying, setIsPlaying] = useState(false);
  const [editableTranscript, setEditableTranscript] = useState("");
  const engineRef = useRef<AudioGuestbookEngine | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const maxSeconds = 15;
  const progress = (elapsed / maxSeconds) * 100;

  const startRecording = useCallback(async () => {
    if (!isMediaRecorderSupported()) {
      alert("Your browser doesn't support audio recording. Please try a different browser.");
      return;
    }

    const engine = new AudioGuestbookEngine();
    engineRef.current = engine;
    setTranscript("");
    setInterimText("");
    setElapsed(0);
    setPhase("recording");

    await engine.start(
      (result) => {
        if (result.isFinal) {
          setTranscript((prev) => (prev + " " + result.transcript).trim());
          setInterimText("");
        } else {
          setInterimText(result.transcript);
        }
      },
      (seconds) => setElapsed(seconds),
    );

    // Auto-stop after max duration
    const { audioBlob: blob, mimeType } = await engine.stop();
    setAudioBlob(blob);
    setAudioMimeType(mimeType);
    setPhase("review");
    setEditableTranscript((prev) => (prev + " " + interimText).trim());
  }, [interimText]);

  const stopRecording = useCallback(async () => {
    if (engineRef.current?.isRecording) {
      const { audioBlob: blob, mimeType } = await engineRef.current.stop();
      setAudioBlob(blob);
      setAudioMimeType(mimeType);
      setPhase("review");
      setEditableTranscript(transcript);
    }
  }, [transcript]);

  const togglePlayback = useCallback(() => {
    if (!audioBlob) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
      return;
    }
    const url = URL.createObjectURL(audioBlob);
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play();
    setIsPlaying(true);
    audio.onended = () => {
      setIsPlaying(false);
      audioRef.current = null;
      URL.revokeObjectURL(url);
    };
  }, [audioBlob]);

  const confirm = useCallback(() => {
    onComplete({
      audioBlob,
      audioMimeType,
      transcript: editableTranscript,
    });
  }, [audioBlob, audioMimeType, editableTranscript, onComplete]);

  const retake = useCallback(() => {
    setPhase("idle");
    setTranscript("");
    setInterimText("");
    setElapsed(0);
    setAudioBlob(null);
    setEditableTranscript("");
    setIsPlaying(false);
    audioRef.current = null;
  }, []);

  // Idle state — prompt to record
  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center gap-6 py-10">
        <div className="text-center">
          <h3 className="font-display text-xl text-navy mb-2">Voice Guestbook</h3>
          <p className="font-body text-sm text-floral-slate max-w-xs">
            Leave a recorded message for Kendra & Diego — up to {maxSeconds} seconds.
          </p>
          {!isSpeechSupported() && (
            <p className="font-body text-xs text-mauve mt-2">
              Note: Live transcription not available on this browser. Audio will still be recorded.
            </p>
          )}
        </div>
        <button
          onClick={startRecording}
          className="group relative flex items-center justify-center w-20 h-20 rounded-full bg-mauve/15 border-2 border-mauve/30 hover:bg-mauve/25 transition-all"
        >
          <span className="absolute inset-0 rounded-full bg-mauve/10 animate-pulse-ring" />
          <Mic className="w-8 h-8 text-mauve group-active:scale-90 transition-transform" />
        </button>
        <span className="font-body text-xs text-parchment">Tap to start recording</span>
      </div>
    );
  }

  // Recording state
  if (phase === "recording") {
    return (
      <div className="flex flex-col items-center gap-6 py-10">
        {/* Timer ring */}
        <div className="relative w-28 h-28">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="#E8DEC8" strokeWidth="4" />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="#C59B9B"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={276.46}
              strokeDashoffset={276.46 * (1 - progress / 100)}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display text-2xl text-navy">{elapsed}s</span>
          </div>
        </div>

        {/* Live transcript */}
        {(isSpeechSupported() || transcript || interimText) && (
          <div className="w-full max-w-sm px-4">
            <p className="font-script text-lg text-navy/70 text-center leading-relaxed min-h-[3rem]">
              {transcript}
              {interimText && (
                <span className="text-navy/40 italic">{interimText}</span>
              )}
            </p>
          </div>
        )}

        <button
          onClick={stopRecording}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-mauve text-white font-body text-sm font-medium hover:bg-mauve/90 transition-colors"
        >
          <MicOff className="w-4 h-4" />
          Stop Recording
        </button>
      </div>
    );
  }

  // Review state
  return (
    <div className="flex flex-col items-center gap-5 py-8">
      <h3 className="font-display text-lg text-navy">Review Your Message</h3>

      {/* Audio playback */}
      <button
        onClick={togglePlayback}
        className="flex items-center gap-3 px-5 py-3 rounded-full bg-parchment/60 border border-gold/20 text-navy font-body text-sm hover:bg-parchment transition-colors"
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 text-mauve" />
        ) : (
          <Play className="w-4 h-4 text-floral-slate" />
        )}
        {isPlaying ? "Pause" : "Play back"}
      </button>

      {/* Editable transcript */}
      <div className="w-full max-w-sm">
        <label className="font-body text-xs text-floral-slate mb-1 block">Transcript</label>
        <textarea
          value={editableTranscript}
          onChange={(e) => setEditableTranscript(e.target.value)}
          className="w-full h-24 px-4 py-3 rounded-xl border border-parchment bg-cream/50 font-body text-sm text-navy resize-none focus:outline-none focus:border-gold transition-colors"
          placeholder="Edit transcript if needed…"
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={retake}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-parchment text-floral-slate font-body text-sm hover:bg-parchment/40 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Retake
        </button>
        <button
          onClick={confirm}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gold text-navy font-body text-sm font-semibold hover:bg-gold/90 transition-colors"
        >
          <Check className="w-4 h-4" />
          Attach to Photo
        </button>
      </div>
    </div>
  );
}
