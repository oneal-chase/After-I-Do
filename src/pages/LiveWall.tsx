import { useState, useEffect, useCallback, useRef } from "react";
import { QrCode, Maximize, Minimize } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useDesignSystem } from "../context/DesignSystemContext";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

interface FeedItem {
  timestamp: string;
  phase: string;
  imageUrl: string;
  fileId: string;
  transcript: string;
  // legacy field — old records may have it, new text-only uploads leave empty
  audioFileId?: string;
}

export default function LiveWall() {
  const { config } = useDesignSystem();
  const params = useParams<{ slug: string }>();
  const weddingSlug = params.slug || config.slug;
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchFeed = useCallback(async () => {
    // Prefer Supabase (single DB, Drive still default on server via Edge Function)
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("photos")
          .select("created_at,phase,image_url,file_id,transcript")
          .eq("wedding_slug", weddingSlug)
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) throw error;
        const mapped: FeedItem[] = (data || []).map((r: { created_at: string; phase: string; image_url: string; file_id: string; transcript: string | null }) => ({
          timestamp: r.created_at,
          phase: r.phase,
          imageUrl: r.image_url,
          fileId: r.file_id || "",
          transcript: r.transcript || "",
        }));
        setFeed(mapped);
        return;
      } catch (err) {
        console.error("Supabase feed failed, falling back to GAS:", err);
      }
    }
    const endpoint = config.gasEndpoint;
    if (!endpoint) return;
    try {
      const resp = await fetch(endpoint);
      const data = await resp.json();
      if (data.status === "success" && data.feed) {
        // filter to this wedding if GAS supports weddingSlug
        const raw = data.feed as FeedItem[];
        const filtered = weddingSlug ? raw.filter((f) => !f.phase || f.phase) : raw; // keep all for legacy single-wedding GAS
        setFeed(filtered);
      }
    } catch (err) {
      console.error("Failed to fetch feed:", err);
    }
  }, [config.gasEndpoint, weddingSlug]);

  useEffect(() => {
    fetchFeed();
    intervalRef.current = setInterval(fetchFeed, 10000);

    // Realtime: instant wall update when Supabase is primary (no poll lag)
    let channel: ReturnType<NonNullable<typeof supabase>["channel"]> | null = null;
    if (isSupabaseConfigured && supabase) {
      channel = supabase
        .channel(`photos-${weddingSlug}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "photos", filter: `wedding_slug=eq.${weddingSlug}` }, () => {
          void fetchFeed();
        })
        .subscribe();
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (channel && supabase) void supabase.removeChannel(channel);
    };
  }, [fetchFeed, weddingSlug]);

  // Clamp index when feed shrinks (poll can return fewer items)
  useEffect(() => {
    if (feed.length === 0) return;
    setCurrentIndex((prev) => (prev >= feed.length ? 0 : prev));
  }, [feed.length]);

  useEffect(() => {
    if (feed.length === 0) return;

    const cycle = setInterval(() => {
      setTransitioning(true);
      setShowTranscript(false);

      setTimeout(() => {
        setCurrentIndex((prev) => {
          const next = (prev + 1) % feed.length;
          const item = feed[next];
          if (item?.transcript) {
            setTimeout(() => setShowTranscript(true), 1200);
          }
          return next;
        });
        setTransitioning(false);
      }, 800);
    }, 6000);

    return () => clearInterval(cycle);
  }, [feed]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const wallRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement && wallRef.current) {
        await wallRef.current.requestFullscreen();
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen failed:", err);
    }
  }, []);

  const currentItem = feed[currentIndex];

  return (
    <div ref={wallRef} className="fixed inset-0 bg-navy overflow-hidden">
      {/* Ambient glow gradients */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-floral-slate/8 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gold/6 rounded-full blur-[100px] translate-x-1/4 translate-y-1/4" />
      </div>

      {feed.length === 0 ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="font-script text-3xl text-gold/60">{config.coupleNames}</div>
          <p className="font-body text-sm text-cream/40">Waiting for guest photos…</p>
          <p className="font-body text-[11px] text-cream/25">Wall is live for <span className="font-mono text-cream/40">/w/{weddingSlug}</span> · {isSupabaseConfigured ? "Supabase Realtime" : "GAS poll"}</p>
          {!isSupabaseConfigured && !config.gasEndpoint && (
            <p className="font-body text-xs text-mauve bg-mauve/10 border border-mauve/20 rounded-xl px-4 py-2 mt-2">
              No sync endpoint configured. Connect Supabase or set VITE_GAS_WEBHOOK_URL.
            </p>
          )}
          <div className="w-8 h-8 border-2 border-cream/20 border-t-cream/50 rounded-full animate-spin mt-4" />
        </div>
      ) : (
        <>
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${transitioning ? "opacity-0" : "opacity-100"}`}>
            <div className="relative w-full h-full">
              <img
                src={currentItem?.imageUrl}
                alt="Guest photo"
                className="w-full h-full object-contain"
                style={{ animation: transitioning ? "none" : "kenBurns 6s ease-in-out infinite alternate" }}
                onError={(e) => {
                  console.error("LiveWall image failed:", currentItem?.imageUrl);
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {showTranscript && currentItem?.transcript && (
            <div className="absolute bottom-0 left-0 right-0 z-10">
              <div className="bg-gradient-to-t from-navy/90 via-navy/60 to-transparent pt-20 pb-12 px-8">
                <div className="max-w-2xl mx-auto text-center animate-fade-in-up">
                  <p className="font-script text-2xl md:text-3xl text-cream/90 leading-relaxed">
                    &ldquo;{currentItem.transcript}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="absolute top-6 right-6 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-navy/40 backdrop-blur-sm border border-cream/10">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            <span className="font-body text-[10px] text-cream/70 font-medium">{currentItem?.phase?.replace(/_/g, " ")}</span>
          </div>

          <div className="absolute bottom-6 right-6 z-10">
            <Link to="/" className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-navy/50 backdrop-blur-sm border border-cream/10 hover:bg-navy/60 transition-colors">
              <QrCode className="w-6 h-6 text-cream/60" />
              <span className="font-body text-[8px] text-cream/40 text-center leading-tight">Scan to open<br />camera</span>
            </Link>
          </div>

          <div className="absolute top-6 left-6 z-10 flex items-center gap-3">
            <span className="font-script text-xl text-cream/30">{config.coupleNames}</span>
            <button
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              className="p-2 rounded-full bg-navy/40 backdrop-blur-sm border border-cream/10 text-cream/70 hover:text-cream hover:bg-navy/60 transition-colors"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </>
      )}

      <style>{`
        @keyframes kenBurns {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.06) translate(-1%, -0.5%); }
        }
      `}</style>
    </div>
  );
}
