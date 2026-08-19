import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, SwitchCamera, X, Volume2 } from "lucide-react";

interface CameraViewfinderProps {
  onCapture: (blob: Blob) => void;
  phaseName: string;
}

export default function CameraViewfinder({ onCapture, phaseName }: CameraViewfinderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [preview, setPreview] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Attach stream to video element whenever streamRef changes
  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (video && stream) {
      video.srcObject = stream;
      video.play().then(() => setCameraReady(true)).catch(() => {});
    }
  }, [cameraReady]);

  const startCamera = useCallback(async (facingMode: "environment" | "user") => {
    try {
      // Stop previous stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setCameraReady(false);

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = newStream;

      // Attach to video if ref is ready
      const video = videoRef.current;
      if (video) {
        video.srcObject = newStream;
        await video.play();
        setCameraReady(true);
      }
    } catch {
      setError("Camera access denied. Please allow camera permission or use the upload button.");
    }
  }, []);

  useEffect(() => {
    startCamera(facing);
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [facing, startCamera]);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);

    if (navigator.vibrate) navigator.vibrate(50);

    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setPreview(url);
      }
    }, "image/jpeg", 0.95);
  }, []);

  const confirmCapture = useCallback(() => {
    if (!preview) return;
    fetch(preview)
      .then((r) => r.blob())
      .then((blob) => {
        onCapture(blob);
        setPreview(null);
        URL.revokeObjectURL(preview);
      });
  }, [preview, onCapture]);

  const toggleCamera = useCallback(() => {
    setFacing((f) => (f === "environment" ? "user" : "environment"));
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        setPreview(url);
      }
    },
    [],
  );

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-navy/5 px-6 text-center">
        <Camera className="w-16 h-16 text-parchment mb-4" strokeWidth={1} />
        <p className="font-display text-lg text-navy mb-2">Camera Unavailable</p>
        <p className="font-body text-sm text-floral-slate mb-6">{error}</p>
        <label className="cursor-pointer px-6 py-3 bg-navy text-cream rounded-full font-body text-sm font-medium hover:bg-navy/90 transition-colors">
          Upload a Photo Instead
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileInput}
          />
        </label>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {!preview && (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />

          {flash && <div className="absolute inset-0 bg-white z-30 animate-pulse" />}

          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-mauve/25 backdrop-blur-sm">
              <Volume2 className="w-3.5 h-3.5 text-mauve" />
              <span className="text-xs font-body font-medium text-mauve">{phaseName}</span>
            </div>
            <button
              onClick={toggleCamera}
              className="p-2.5 rounded-full bg-white/15 backdrop-blur-sm text-white hover:bg-white/25 transition-colors"
            >
              <SwitchCamera className="w-5 h-5" />
            </button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-6 p-6 pb-10 bg-gradient-to-t from-black/60 to-transparent">
            <label className="cursor-pointer p-3 rounded-full bg-white/15 backdrop-blur-sm text-white hover:bg-white/25 transition-colors">
              <Camera className="w-6 h-6" />
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileInput}
              />
            </label>

            <button
              onClick={captureFrame}
              disabled={!cameraReady}
              className="relative w-[72px] h-[72px] rounded-full border-[3px] border-white/80 flex items-center justify-center group hover:border-gold transition-colors"
            >
              <div className="w-[60px] h-[60px] rounded-full bg-white group-hover:bg-gold/90 transition-all group-active:scale-90" />
            </button>
          </div>
        </>
      )}

      {preview && (
        <div className="absolute inset-0 z-40 bg-navy flex flex-col">
          <div className="flex-1 flex items-center justify-center p-4">
            <img
              src={preview}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg polaroid-shadow"
            />
          </div>
          <div className="flex items-center justify-center gap-6 p-6 pb-10">
            <button
              onClick={() => {
                setPreview(null);
                URL.revokeObjectURL(preview);
              }}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/15 text-white font-body text-sm font-medium hover:bg-white/25 transition-colors"
            >
              <X className="w-4 h-4" />
              Retake
            </button>
            <button
              onClick={confirmCapture}
              className="flex items-center gap-2 px-8 py-3 rounded-full bg-gold text-navy font-body text-sm font-semibold hover:bg-gold/90 transition-colors"
            >
              Use Photo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
