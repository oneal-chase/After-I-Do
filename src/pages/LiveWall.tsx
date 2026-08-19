import { useState, useEffect, useCallback, useRef } from "react";
import { QrCode } from "lucide-react";
import { Link } from "react-router-dom";
import { WEDDING_CONFIG } from "../config/wedding.config";

interface FeedItem {
  timestamp: string;
  phase: string;
  imageUrl: string;
  fileId: string;
  transcript: string;
  audioFileId: string;
}

export default function LiveWall() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchFeed = useCallback(async () => {
    const endpoint = WEDDING_CONFIG.gasEndpoint;
    if (!endpoint) return;
    try {
      const resp = await fetch(endpoint);
      const data = await resp.json();
      if (data.status === "success" && data.feed) {
        setFeed(data.feed);
      }
    } catch (err) {
      console.error("Failed to fetch feed:", err);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
    intervalRef.current = setInterval(fetchFeed, 10000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchFeed]);

  // Ken Burns slideshow
  useEffect(() => {
    if (feed.length === 0) return;

    const cycle = setInterval(() => {
      setTransitioning(true);
      setShowTranscript(false);

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % feed.length);
        setTransitioning(false);

        // Show transcript after transition
        const item = feed[(currentIndex + 1) % feed.length];
        if (item?.transcript) {
          setTimeout(() => setShowTranscript(true), 1200);
        }
      }, 800);
    }, 6000);

    return () => clearInterval(cycle);
  }, [feed, currentIndex]);

  const currentItem = feed[currentIndex];

  return (
    <div className="fixed inset-0 bg-navy overflow-hidden">
      {/* Ambient glow gradients */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-floral-slate/8 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gold/6 rounded-full blur-[100px] translate-x-1/4 translate-y-1/4" />
      </div>

      {feed.length === 0 ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <div className="font-script text-3xl text-gold/60">Kendra & Diego</div>
          <p className="font-body text-sm text-cream/40">Waiting for guest photos…</p>
          <div className="w-8 h-8 border-2 border-cream/20 border-t-cream/50 rounded-full animate-spin mt-4" />
        </div>
      ) : (
        <>
          {/* Photo */}
          <div
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${
              transitioning ? "opacity-0" : "opacity-100"
            }`}
          >
            <div className="relative w-full h-full">
              <img
                src={currentItem?.imageUrl}
                alt="Guest photo"
                className="w-full h-full object-contain"
                style={{
                  animation: transitioning ? "none" : "kenBurns 6s ease-in-out infinite alternate",
                }}
              />
            </div>
          </div>

          {/* Transcript overlay */}
          {showTranscript && currentItem?.transcript && (
            <div className="absolute bottom-0 left-0 right-0 z-10">
              <div className="bg-gradient-to-t from-navy/90 via-navy/60 to-transparent pt-20 pb-12 px-8">
                <div className="max-w-2xl mx-auto text-center animate-fade-in-up">
                  {currentItem.audioFileId && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-mauve/20 border border-mauve/30 mb-3">
                      <div className="flex gap-0.5">
                        <span className="w-0.5 h-2 bg-mauve rounded-full animate-pulse" />
                        <span className="w-0.5 h-3 bg-mauve rounded-full animate-pulse" style={{ animationDelay: "0.15s" }} />
                        <span className="w-0.5 h-2 bg-mauve rounded-full animate-pulse" style={{ animationDelay: "0.3s" }} />
                        <span className="w-0.5 h-2.5 bg-mauve rounded-full animate-pulse" style={{ animationDelay: "0.45s" }} />
                      </div>
                      <span className="font-body text-[10px] text-mauve font-medium">Voice note</span>
                    </div>
                  )}
                  <p className="font-script text-2xl md:text-3xl text-cream/90 leading-relaxed">
                    "{currentItem.transcript}"
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Phase badge — top right */}
          <div className="absolute top-6 right-6 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-navy/40 backdrop-blur-sm border border-cream/10">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            <span className="font-body text-[10px] text-cream/70 font-medium">{currentItem?.phase?.replace(/_/g, " ")}</span>
          </div>

          {/* QR badge — bottom right */}
          <div className="absolute bottom-6 right-6 z-10">
            <Link
              to="/"
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-navy/50 backdrop-blur-sm border border-cream/10 hover:bg-navy/60 transition-colors"
            >
              <QrCode className="w-6 h-6 text-cream/60" />
              <span className="font-body text-[8px] text-cream/40 text-center leading-tight">
                Scan to open<br />camera
              </span>
            </Link>
          </div>

          {/* Couple watermark — top left */}
          <div className="absolute top-6 left-6 z-10">
            <span className="font-script text-xl text-cream/30">Kendra & Diego</span>
          </div>
        </>
      )}

      {/* Ken Burns keyframes */}
      <style>{`
        @keyframes kenBurns {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.06) translate(-1%, -0.5%); }
        }
      `}</style>
    </div>
  );
}
