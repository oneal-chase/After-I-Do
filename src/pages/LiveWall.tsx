import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { QrCode, Maximize, Minimize } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useDesignSystem } from "../context/DesignSystemContext";
import { supabase, isSupabaseConfigured, APP_BUILD } from "../lib/supabase";

interface FeedItem {
  timestamp: string;
  phase: string;
  imageUrl: string;
  fileId: string;
  transcript: string;
  // legacy field — old records may have it, new text-only uploads leave empty
  audioFileId?: string;
}

const GROUP_SIZE = 3; // up to 3 photos visible at once
const SLIDE_MS = 8000; // time each batch is shown
const FADE_MS = 700;

// Deterministic slight tilt per photo — scattered-on-the-table feel
function tiltFor(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 1000;
  return (h / 1000) * 4 - 2; // ±2deg
}

function PhotoCard({ item, solo, index }: { item: FeedItem; solo: boolean; index: number }) {
  // Big, projector-scale polaroids: solo near-full height, batches ~2× the old size
  const cardH = solo ? "h-[70vh] md:h-[74vh]" : "h-[52vh] md:h-[55vh]";
  const tilt = solo ? 0 : tiltFor(item.fileId || `${index}`);

  return (
    <div
      className="flex flex-col items-center gap-4 animate-fade-in-up"
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <img
        src={item.imageUrl}
        alt="Guest photo"
        referrerPolicy="no-referrer"
        className={`${cardH} w-auto rounded-xl polaroid-shadow`}
        onError={(e) => {
          console.error("LiveWall image failed:", item.imageUrl);
          (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
        }}
      />
      {/* Note directly underneath the Polaroid */}
      {item.transcript && (
        <p className={`${solo ? "max-w-lg text-3xl md:text-4xl" : "max-w-[14rem] text-2xl md:text-3xl"} font-script text-cream/90 leading-snug text-center break-words px-2`}>
          &ldquo;{item.transcript}&rdquo;
        </p>
      )}
    </div>
  );
}

// Batches of 3 on desktop; one big card per slide on small screens
function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => setIsDesktop(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return isDesktop;
}

export default function LiveWall() {
  const { config } = useDesignSystem();
  const params = useParams<{ slug: string }>();
  const weddingSlug = params.slug || config.slug;
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [groupIndex, setGroupIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
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
        setFeed(data.feed as FeedItem[]);
      }
    } catch (err) {
      console.error("Failed to fetch feed:", err);
    }
  }, [config.gasEndpoint, weddingSlug]);

  useEffect(() => {
    fetchFeed();
    intervalRef.current = setInterval(fetchFeed, 10000);

    // Realtime: instant wall update on INSERT or DELETE (no poll lag)
    let channel: ReturnType<NonNullable<typeof supabase>["channel"]> | null = null;
    if (isSupabaseConfigured && supabase) {
      channel = supabase
        .channel(`photos-${weddingSlug}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "photos", filter: `wedding_slug=eq.${weddingSlug}` }, () => {
          void fetchFeed();
        })
        .on("postgres_changes", { event: "DELETE", schema: "public", table: "photos", filter: `wedding_slug=eq.${weddingSlug}` }, () => {
          void fetchFeed();
        })
        .subscribe();
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (channel && supabase) void supabase.removeChannel(channel);
    };
  }, [fetchFeed, weddingSlug]);

  // Chunk newest-first feed into batches of up to GROUP_SIZE (1 on small screens)
  const isDesktop = useIsDesktop();
  const groupSize = isDesktop ? GROUP_SIZE : 1;
  const groups = useMemo(() => {
    const size = Math.min(groupSize, Math.max(1, feed.length));
    const out: FeedItem[][] = [];
    for (let i = 0; i < feed.length; i += size) out.push(feed.slice(i, i + size));
    return out;
  }, [feed, groupSize]);

  // Reset to newest batch when the feed or layout changes
  useEffect(() => {
    setGroupIndex(0);
  }, [feed.length, isDesktop]);

  // Rotate batches
  useEffect(() => {
    if (groups.length <= 1) return;
    const cycle = setInterval(() => {
      setTransitioning(true);
      setTimeout(() => {
        setGroupIndex((prev) => (prev + 1) % groups.length);
        setTransitioning(false);
      }, FADE_MS);
    }, SLIDE_MS);
    return () => clearInterval(cycle);
  }, [groups.length]);

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

  const currentGroup = groups[Math.min(groupIndex, Math.max(0, groups.length - 1))] ?? [];
  const currentPhase = currentGroup[0]?.phase;

  return (
    <div ref={wallRef} className="fixed inset-0 bg-navy overflow-hidden">
      {/* Ambient glow gradients + warm spotlight behind the polaroids */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-floral-slate/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gold/10 rounded-full blur-[100px] translate-x-1/4 translate-y-1/4" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vh] h-[90vh] rounded-full bg-gold/8 blur-[130px]" />
      </div>

      {groups.length === 0 ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="font-script text-3xl text-gold/60">{config.coupleNames}</div>
          <p className="font-body text-sm text-cream/40">Waiting for guest photos…</p>
          <p className="font-body text-[11px] text-cream/25">Wall is live for <span className="font-mono text-cream/40">/w/{weddingSlug}</span> · {isSupabaseConfigured ? "Supabase Realtime" : "GAS poll"} · build {APP_BUILD}</p>
          {!isSupabaseConfigured && !config.gasEndpoint && (
            <p className="font-body text-xs text-mauve bg-mauve/10 border border-mauve/20 rounded-xl px-4 py-2 mt-2">
              No sync endpoint configured. Connect Supabase or set VITE_GAS_WEBHOOK_URL.
            </p>
          )}
          {isSupabaseConfigured && (
            <p className="font-body text-[11px] text-cream/25 max-w-sm">
              Taken a photo but don&apos;t see it? Reopen the camera page once — queued photos retry automatically — or check the Dashboard diagnostics.
            </p>
          )}
          <div className="w-8 h-8 border-2 border-cream/20 border-t-cream/50 rounded-full animate-spin mt-4" />
        </div>
      ) : (
        <>
          <div
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${transitioning ? "opacity-0" : "opacity-100"}`}
          >
            <div className="relative z-10 flex flex-wrap items-start justify-center gap-8 md:gap-14 px-6 max-h-full py-16">
              {currentGroup.map((item, i) => (
                <PhotoCard key={`${item.fileId}-${item.timestamp}-${i}`} item={item} solo={currentGroup.length === 1} index={i} />
              ))}
            </div>
          </div>

          <div className="absolute top-6 right-6 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-navy/40 backdrop-blur-sm border border-cream/10">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            <span className="font-body text-[10px] text-cream/70 font-medium">{currentPhase?.replace(/_/g, " ")}</span>
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
    </div>
  );
}
