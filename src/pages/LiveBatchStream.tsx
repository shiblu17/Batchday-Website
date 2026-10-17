import React, { useState, useEffect, useRef } from "react";
import {
  Video,
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Flame,
  Share2,
  RefreshCw,
  Film,
  Sparkles,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Smartphone,
  Music2,
  Shield,
  Trash2,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  refreshTelegramFileUrl,
  formatVideoStreamingUrl,
} from "@/utils/streamUploader";
import { getFilterCss } from "@/utils/reelsCustomization";
import { searchAppleMusic } from "@/utils/itunesMusicService";
import ReelsStudioModal from "@/components/stream/ReelsStudioModal";

export interface ReelItem {
  id: string;
  url: string;
  caption?: string;
  uploaderName: string;
  department: string;
  duration?: number;
  telegramMessageId?: number;
  fileId?: string;
  filterId?: string;
  audioType?: "original" | "itunes";
  audioTitle?: string;
  audioArtist?: string;
  audioArtwork?: string;
  audioPreviewUrl?: string;
  origVolume?: number;
  bgVolume?: number;
  created_at: string;
  fire: number;
}

const DEPARTMENTS = [
  "কম্পিউটার সায়েন্স অ্যান্ড ইঞ্জিনিয়ারিং",
  "ইনস্টিটিউট অব ইনফরমেশন টেকনোলজি",
  "নাটক ও নাট্যতত্ত্ব",
  "গণিত",
  "পদার্থবিজ্ঞান",
  "রসায়ন",
  "পরিসংখ্যান ও উপাত্ত বিজ্ঞান",
  "অর্থনীতি",
  "ভূগোল ও পরিবেশ",
  "সরকার ও রাজনীতি",
  "নৃবিজ্ঞান",
  "নগর ও অঞ্চল পরিকল্পনা",
  "লোক প্রশাসন",
  "বাংলা",
  "ইংরেজি",
  "ইতিহাস",
  "দর্শন",
  "প্রত্নতত্ত্ব",
  "আন্তর্জাতিক সম্পর্ক",
  "সাংবাদিকতা ও গণমাধ্যম অধ্যয়ন",
  "চারুকলা",
  "উদ্ভিদবিজ্ঞান",
  "প্রাণিবিদ্যা",
  "ফার্মেসী",
  "প্রাণরসায়ন ও অণুপ্রাণ বিজ্ঞান",
  "অণুজীববিজ্ঞান",
  "বায়োটেকনোলজি অ্যান্ড জেনেটিক ইঞ্জিনিয়ারিং",
  "পাবলিক হেলথ অ্যান্ড ইনফরমেটিক্স",
  "ফিন্যান্স ও ব্যাংকিং",
  "মার্কেটিং",
  "অ্যাকাউন্টিং অ্যান্ড ইনফরমেশন সিস্টেমস",
  "ম্যানেজমেন্ট স্টাডিজ",
  "আইবিএ",
  "আইন ও বিচার",
  "ভূতাত্ত্বিক বিজ্ঞান",
  "পরিবেশ বিজ্ঞান",
];

// In-memory poster cache to guarantee 0ms transitions across re-renders
const globalPosterCache = new Map<string, string>();

export default function LiveBatchStream() {
  const { isAdmin } = useAuth();
  const isLocalAdmin = localStorage.getItem("ju52_admin_login") === "true";
  const hasAdminAccess = isAdmin || isLocalAdmin;

  const [reels, setReels] = useState<ReelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReelId, setActiveReelId] = useState<string | null>(null);
  const [isGlobalMuted, setIsGlobalMuted] = useState(() => {
    return localStorage.getItem("ju_reels_unmuted") !== "true";
  });
  const [viewMode, setViewMode] = useState<"reels" | "grid">("reels");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [isCleanMode, setIsCleanMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync native browser fullscreen status
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(
        !!(document.fullscreenElement || (document as any).webkitFullscreenElement)
      );
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
      const el = document.documentElement as any;
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {});
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen().catch(() => {});
      }
    } else {
      const doc = document as any;
      if (doc.exitFullscreen) {
        doc.exitFullscreen().catch(() => {});
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen().catch(() => {});
      }
    }
  };

  const handleBackToHome = () => {
    if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
      try {
        const doc = document as any;
        if (doc.exitFullscreen) doc.exitFullscreen().catch(() => {});
        else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen().catch(() => {});
      } catch {}
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);

  const handleToggleMute = () => {
    setIsGlobalMuted((prev) => {
      const next = !prev;
      localStorage.setItem("ju_reels_unmuted", next ? "false" : "true");
      return next;
    });
  };

  const handleUnmute = () => {
    setIsGlobalMuted(false);
    localStorage.setItem("ju_reels_unmuted", "true");
  };

  const handleDeleteReel = async (id: string) => {
    if (!window.confirm("আপনি কি নিশ্চিতভাবে এই রিলসটি মুছে ফেলতে চান? এটি স্থায়ীভাবে মুছে যাবে।")) return;
    try {
      const { error } = await supabase.from("gallery_photos").delete().eq("id", id);
      if (error) throw error;
      toast({
        title: "রিলস ডিলিট হয়েছে",
        description: "রিলসটি সফলভাবে মুছে ফেলা হয়েছে।",
      });
      setReels((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      toast({
        title: "মুছে ফেলা ব্যর্থ হয়েছে",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // Fetch reels from Supabase
  const fetchReels = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const { data, error } = await supabase
        .from("gallery_photos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        // Filter ONLY videos & reels (no static photos)
        const videoRows = data.filter((row: any) => {
          const urlLower = (row.url || "").toLowerCase();
          const caption = row.caption || "";
          return (
            caption.startsWith("[REEL") ||
            urlLower.includes(".mp4") ||
            urlLower.includes(".webm") ||
            urlLower.includes("api.telegram.org") ||
            urlLower.includes("t.me")
          );
        });

        const parsed: ReelItem[] = videoRows.map((row: any) => {
          let uploaderName = "ব্যাচমেট";
          let department = "জাহাঙ্গীরনগর বিশ্ববিদ্যালয়";
          let caption = "";

          let fileId: string | undefined;
          let filterId: string = "normal";
          let audioType: "original" | "itunes" = "original";
          let audioTitle: string | undefined;
          let audioArtist: string | undefined;
          let audioArtwork: string | undefined;
          let audioPreviewUrl: string | undefined;
          let origVolume: number = 100;
          let bgVolume: number = 80;

          if (row.caption && row.caption.startsWith("[REEL")) {
            const metaMatch = row.caption.match(/^\[REEL:?([^\]]*)\]/);
            if (metaMatch && metaMatch[1]) {
              const parts = metaMatch[1].split("|");
              fileId = parts[0] || undefined;
              parts.slice(1).forEach((part: string) => {
                const [k, ...vArr] = part.split(":");
                const v = vArr.join(":");
                if (k === "flt") filterId = v;
                if (k === "aud") audioType = v === "itunes" ? "itunes" : "original";
                if (k === "tt") audioTitle = decodeURIComponent(v);
                if (k === "ta") audioArtist = decodeURIComponent(v);
                if (k === "tar") audioArtwork = decodeURIComponent(v);
                if (k === "tp") audioPreviewUrl = decodeURIComponent(v);
                if (k === "ov") origVolume = parseInt(v, 10) || 100;
                if (k === "bv") bgVolume = parseInt(v, 10) || 80;
              });
            }

            // Parse clean uploaderName & department
            const match = row.caption.match(
              /\[REEL(?::[^\]]+)?\]\s*([^(\n:]+?)(?:\s*\(([^)]+?)\))?(?:\s*-\s*\[[^\]]+?\])?(?:\s*:\s*(.*))?$/
            );
            if (match) {
              uploaderName = match[1]?.trim() || uploaderName;
              department = match[2]?.trim() || department;
              caption = match[3]?.trim() || "";
            } else {
              caption = row.caption.replace(/^\[REEL(?::[^\]]+)?\]/, "").trim();
            }
          } else {
            caption = row.caption || "";
          }

          const localFire = parseInt(
            localStorage.getItem(`reel_fire_${row.id}`) || "5"
          );

          return {
            id: row.id,
            url: formatVideoStreamingUrl(row.url),
            caption,
            uploaderName,
            department,
            fileId,
            filterId,
            audioType,
            audioTitle,
            audioArtist,
            audioArtwork,
            audioPreviewUrl,
            origVolume,
            bgVolume,
            created_at: row.created_at,
            fire: localFire,
          };
        });

        setReels((prev) => {
          if (
            prev.length === parsed.length &&
            prev.every((p, i) => p.id === parsed[i].id && p.url === parsed[i].url)
          ) {
            return prev;
          }
          return parsed;
        });

        if (parsed.length > 0) {
          setActiveReelId((curr) => curr || parsed[0].id);
        }
      }
    } catch (err: any) {
      if (!isBackground) {
        console.error("Error fetching reels:", err);
        toast({
          title: "রিলস লোড হতে পারেনি",
          description: err.message,
          variant: "destructive",
        });
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchReels(false);
    const interval = setInterval(() => fetchReels(true), 25000);
    return () => clearInterval(interval);
  }, []);

  // Single FIRE reaction with haptics
  const handleFireReact = (id: string) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate([25, 45]);
      } catch {}
    }
    setReels((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newVal = item.fire + 1;
          localStorage.setItem(`reel_fire_${id}`, String(newVal));
          return { ...item, fire: newVal };
        }
        return item;
      })
    );
  };

  // Scroll to prev/next reel on desktop
  const navigateReel = (direction: "up" | "down") => {
    if (reels.length === 0) return;
    const currentIndex = reels.findIndex((r) => r.id === activeReelId);
    if (direction === "down" && currentIndex < reels.length - 1) {
      const nextId = reels[currentIndex + 1].id;
      setActiveReelId(nextId);
      document.getElementById(`reel-item-${nextId}`)?.scrollIntoView({
        behavior: "smooth",
      });
    } else if (direction === "up" && currentIndex > 0) {
      const prevId = reels[currentIndex - 1].id;
      setActiveReelId(prevId);
      document.getElementById(`reel-item-${prevId}`)?.scrollIntoView({
        behavior: "smooth",
      });
    }
  };

  // Keyboard navigation for desktop users
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (uploadOpen) return;
      if (e.key === "ArrowDown" || e.key === "j") {
        navigateReel("down");
      } else if (e.key === "ArrowUp" || e.key === "k") {
        navigateReel("up");
      } else if (e.key === "m") {
        handleToggleMute();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeReelId, reels, uploadOpen]);

  // Real-time snap detection for instantaneous video playback on swipe
  const handleContainerScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const itemHeight = el.clientHeight || window.innerHeight;
    const newIndex = Math.round(el.scrollTop / itemHeight);
    if (reels[newIndex] && reels[newIndex].id !== activeReelId) {
      setActiveReelId(reels[newIndex].id);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-[#07080c] text-white select-none overflow-hidden font-sans flex items-center justify-center">
      {/* Desktop Ambient Backlight Glow (Subtle Cinematic Atmosphere) */}
      <div className="hidden lg:block absolute inset-0 bg-radial from-amber-500/10 via-rose-500/5 to-transparent pointer-events-none blur-3xl opacity-75" />

      {/* Desktop Navigation & Helper Shortcuts (Visible on Wide Displays) */}
      <div className="hidden xl:flex fixed right-10 bottom-24 flex-col gap-2.5 z-30 text-xs text-zinc-400 bg-zinc-950/70 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl">
        <span className="text-[11px] font-bold text-white mb-1 flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-amber-400" />
          কিবোর্ড শর্টকাট
        </span>
        <div className="flex items-center justify-between gap-4 text-[11px]">
          <span>পরবর্তী রিলস</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-white text-[10px]">
            ↓ / J
          </kbd>
        </div>
        <div className="flex items-center justify-between gap-4 text-[11px]">
          <span>পূর্ববর্তী রিলস</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-white text-[10px]">
            ↑ / K
          </kbd>
        </div>
        <div className="flex items-center justify-between gap-4 text-[11px]">
          <span>মিউট / আনমিউট</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-white text-[10px]">
            M
          </kbd>
        </div>
      </div>

      {/* ================== CENTERED PHONE STAGE CONTAINER (MAX-W 480PX) ================== */}
      {/* Everything (Header, Video, Drop Button, Actions) is strictly confined to this column */}
      <div className="relative w-full max-w-[480px] h-[100dvh] bg-black shadow-2xl flex flex-col overflow-hidden sm:border-x sm:border-white/10">
        {/* Floating Top Controls: ONLY Back Button in Reels view; Compact navigation in Grid view */}
        <div
          className={`absolute top-3.5 inset-x-3.5 z-30 flex items-center justify-between pointer-events-auto transition-all duration-300 ${
            isCleanMode ? "opacity-0 -translate-y-2 pointer-events-none" : "opacity-100 translate-y-0"
          }`}
        >
          {/* Top Left: Sleek Circular Frosted Glass Back Button ONLY */}
          <Link
            to="/"
            onClick={handleBackToHome}
            className="w-10 h-10 rounded-full bg-black/45 hover:bg-black/70 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.5)] active:scale-90 transition-transform pointer-events-auto"
            title="হোমে ফিরে যান"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          {/* Grid View Only: Switch back to Reels + Drop Button */}
          {viewMode === "grid" && (
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                onClick={() => setViewMode("reels")}
                className="h-9 px-3.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/20 text-white flex items-center gap-1.5 text-xs font-semibold shadow-lg active:scale-95 transition-all"
                title="রিলস ভিউতে ফিরে যান"
              >
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span>রিলস</span>
              </button>
              <Button
                size="sm"
                onClick={() => setUploadOpen(true)}
                className="bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 hover:from-amber-400 hover:to-pink-400 text-white font-semibold text-xs px-3.5 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.35)] border border-white/20 h-9 gap-1.5 active:scale-95 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>রিলস ড্রপ</span>
              </Button>
            </div>
          )}
        </div>

        {/* MAIN REELS FEED CONTENT */}
        {loading ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
              <Film className="w-6 h-6 text-amber-400 absolute inset-0 m-auto" />
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              রিলস প্রস্তুত হচ্ছে...
            </p>
          </div>
        ) : reels.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-zinc-400 shadow-xl">
              <Film className="w-8 h-8" />
            </div>
            <h2 className="text-base font-bold text-white mb-1">
              এখনো কোনো রিলস ড্রপ হয়নি
            </h2>
            <p className="text-xs text-zinc-400 max-w-xs mb-6">
              ক্যাম্পাসের আড্ডা, মুহূর্ত ও আনন্দ সবার সাথে শেয়ার করতে প্রথম রিলসটি
              তুমিই ড্রপ করো!
            </p>
            <Button
              onClick={() => setUploadOpen(true)}
              className="bg-gradient-to-r from-amber-500 to-rose-600 text-white rounded-full text-xs font-semibold px-5 h-9 shadow-lg shadow-amber-600/20"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              রিলস ড্রপ করো
            </Button>
          </div>
        ) : viewMode === "grid" ? (
          /* ================== GRID EXPLORER VIEW ================== */
          <div className="w-full h-full overflow-y-auto pt-20 pb-10 px-3">
            <div className="grid grid-cols-2 gap-2.5">
              {reels.map((reel) => (
                <div
                  key={reel.id}
                  onClick={() => {
                    setActiveReelId(reel.id);
                    setViewMode("reels");
                  }}
                  className="group relative aspect-[9/16] rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 cursor-pointer hover:border-amber-500/50 transition-all hover:scale-[1.02] shadow-lg"
                >
                  <video
                    src={reel.url}
                    muted
                    preload="metadata"
                    style={{ filter: getFilterCss(reel.filterId) }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 group-hover:from-black/90 transition-opacity" />

                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                    {hasAdminAccess && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteReel(reel.id);
                        }}
                        className="p-1 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white backdrop-blur-md shadow-md active:scale-90 transition-transform"
                        title="রিলস ডিলিট"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                    <div className="flex items-center gap-1 text-[11px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-md border border-white/10">
                      <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span>{reel.fire}</span>
                    </div>
                  </div>

                  <div className="absolute bottom-2.5 inset-x-2.5 text-left">
                    <p className="text-xs font-bold text-white truncate">
                      @{reel.uploaderName}
                    </p>
                    <p className="text-[10px] text-zinc-300 truncate">
                      {reel.department}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ================== REELS FULLSCREEN 100DVH SWIPE VIEW ================== */
          <div className="relative w-full h-[100dvh]">
            <div
              ref={containerRef}
              onScroll={handleContainerScroll}
              className="w-full h-[100dvh] overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar relative"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                scrollSnapStop: "always",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {(() => {
                const activeIndex = reels.findIndex(
                  (r) => r.id === activeReelId
                );
                return reels.map((reel, index) => {
                  const isCurrent = activeReelId === reel.id;
                  const isAdjacent =
                    activeIndex === -1
                      ? index === 1
                      : Math.abs(index - activeIndex) === 1;
                  const shouldLoad = isCurrent || isAdjacent;

                  return (
                    <ReelPlayerCard
                      key={reel.id}
                      reel={reel}
                      isActive={isCurrent && !uploadOpen}
                      isAdjacent={isAdjacent}
                      shouldLoad={shouldLoad}
                      isMuted={isGlobalMuted}
                      isCleanMode={isCleanMode}
                      hasAdminAccess={hasAdminAccess}
                      isFullscreen={isFullscreen}
                      onToggleMute={handleToggleMute}
                      onUnmute={handleUnmute}
                      onFireReact={() => handleFireReact(reel.id)}
                      onCleanModeChange={setIsCleanMode}
                      onInView={() => setActiveReelId(reel.id)}
                      onDeleteReel={() => handleDeleteReel(reel.id)}
                      onOpenUpload={() => setUploadOpen(true)}
                      onToggleViewMode={() => setViewMode("grid")}
                      onToggleFullscreen={toggleFullscreen}
                    />
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* Desktop Mini Nav Arrows */}
        <div className="hidden lg:flex absolute right-3 bottom-20 flex-col gap-2 z-20">
          <button
            onClick={() => navigateReel("up")}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-xl shadow-lg transition-transform active:scale-90"
            title="পূর্ববর্তী রিলস"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigateReel("down")}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-xl shadow-lg transition-transform active:scale-90"
            title="পরবর্তী রিলস"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modern Instagram-style Reels Studio Modal with Apple Music */}
      <ReelsStudioModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={async (newId) => {
          await fetchReels();
          if (newId) {
            setActiveReelId(newId);
            setViewMode("reels");
          }
        }}
        departments={DEPARTMENTS}
      />
    </div>
  );
}

/**
 * Individual Reel Player Card Component
 * Enhanced with Live Sound Wave Equalizer, Frosted Glass UI, and Scrubber Tooltip
 */
function ReelPlayerCard({
  reel,
  isActive,
  isAdjacent,
  shouldLoad,
  isMuted,
  isCleanMode,
  hasAdminAccess,
  isFullscreen,
  onToggleMute,
  onUnmute,
  onFireReact,
  onCleanModeChange,
  onInView,
  onDeleteReel,
  onOpenUpload,
  onToggleViewMode,
  onToggleFullscreen,
}: {
  reel: ReelItem;
  isActive: boolean;
  isAdjacent: boolean;
  shouldLoad: boolean;
  isMuted: boolean;
  isCleanMode: boolean;
  hasAdminAccess?: boolean;
  isFullscreen: boolean;
  onToggleMute: () => void;
  onUnmute: () => void;
  onFireReact: () => void;
  onCleanModeChange: (clean: boolean) => void;
  onInView: () => void;
  onDeleteReel?: () => void;
  onOpenUpload: () => void;
  onToggleViewMode: () => void;
  onToggleFullscreen: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [showFireBurst, setShowFireBurst] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoSrc, setVideoSrc] = useState(reel.url);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [posterUrl, setPosterUrl] = useState<string>(
    () => globalPosterCache.get(reel.id) || ""
  );

  // Dynamic audio resolution with lazy fallback
  const [resolvedAudioUrl, setResolvedAudioUrl] = useState<string | undefined>(
    reel.audioPreviewUrl || undefined
  );

  useEffect(() => {
    if (reel.audioPreviewUrl) {
      setResolvedAudioUrl(reel.audioPreviewUrl);
      return;
    }
    if (reel.audioType === "itunes" && reel.audioTitle) {
      const term = `${reel.audioTitle} ${reel.audioArtist || ""}`.trim();
      searchAppleMusic(term, 1).then((tracks) => {
        if (tracks && tracks[0]?.previewUrl) {
          setResolvedAudioUrl(tracks[0].previewUrl);
        }
      });
    }
  }, [reel.audioPreviewUrl, reel.audioType, reel.audioTitle, reel.audioArtist]);

  // Scrubber preview tooltip states
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubPreviewTime, setScrubPreviewTime] = useState("");
  const [scrubTooltipX, setScrubTooltipX] = useState(50);

  // Long press hold-to-pause & gesture discrimination
  const longPressTimer = useRef<number | null>(null);
  const isHolding = useRef(false);
  const pointerStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDragOrSwipe = useRef(false);

  useEffect(() => {
    setVideoSrc(reel.url);
    setHasError(false);
  }, [reel.url]);

  // Capture frame 0 dynamically for instant poster
  const capturePoster = () => {
    const video = videoRef.current;
    if (!video || posterUrl || globalPosterCache.has(reel.id)) return;
    try {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        const canvas = document.createElement("canvas");
        const maxW = 360;
        let w = video.videoWidth;
        let h = video.videoHeight;
        if (w > maxW) {
          h = Math.round((h * maxW) / w);
          w = maxW;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, w, h);
          const data = canvas.toDataURL("image/jpeg", 0.65);
          if (globalPosterCache.size > 80) {
            const firstKey = globalPosterCache.keys().next().value;
            if (firstKey) globalPosterCache.delete(firstKey);
          }
          globalPosterCache.set(reel.id, data);
          setPosterUrl(data);
        }
      }
    } catch {}
  };

  const handleVideoError = async () => {
    if (reel.fileId && !isRefreshing) {
      setIsRefreshing(true);
      try {
        const freshUrl = await refreshTelegramFileUrl(reel.fileId);
        setVideoSrc(freshUrl);
        setHasError(false);
      } catch (err) {
        setHasError(true);
      } finally {
        setIsRefreshing(false);
      }
    } else {
      setHasError(true);
    }
  };

  // IntersectionObserver for snap autoplay
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            onInView();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [onInView]);

  // Pre-warm adjacent video on GPU
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldLoad) return;

    if (isAdjacent && !isActive) {
      video.muted = true;
      video.preload = "auto";
      const handleLoadedMeta = () => {
        try {
          video.currentTime = 0.001;
          capturePoster();
        } catch {}
      };
      if (video.readyState >= 1) {
        handleLoadedMeta();
      } else {
        video.addEventListener("loadedmetadata", handleLoadedMeta, {
          once: true,
        });
      }
    }
  }, [isAdjacent, isActive, shouldLoad]);

  // Handle play/pause and synchronize background Apple Tune track
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !shouldLoad) return;

    if (isActive) {
      video.muted = isMuted;
      video.volume = (reel.origVolume ?? 100) / 100;
      video.preload = "auto";

      const startMedia = async () => {
        try {
          await video.play();
          setIsPlaying(true);
          setIsBuffering(false);
          setHasError(false);
          capturePoster();
          if (audio && resolvedAudioUrl && !isHolding.current) {
            audio.muted = isMuted;
            audio.volume = (reel.bgVolume ?? 80) / 100;
            audio.play().catch(() => {});
          }
        } catch {
          // Autoplay policy fallback: try muted
          if (!video.muted) {
            video.muted = true;
            try {
              await video.play();
              setIsPlaying(true);
              setIsBuffering(false);
              capturePoster();
            } catch {
              setIsPlaying(false);
            }
          } else {
            setIsPlaying(false);
          }
        }
      };
      startMedia();
    } else {
      video.pause();
      setIsPlaying(false);
      setIsBuffering(false);
      if (audio) {
        audio.pause();
      }
    }
  }, [isActive, isMuted, shouldLoad, videoSrc, reel.origVolume, reel.bgVolume, resolvedAudioUrl]);

  // Tap handling & Long-press hold-to-pause (Clean screen mode)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerStartPos.current = { x: e.clientX, y: e.clientY };
    isDragOrSwipe.current = false;
    isHolding.current = false;

    longPressTimer.current = window.setTimeout(() => {
      if (!isDragOrSwipe.current) {
        isHolding.current = true;
        onCleanModeChange(true);
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
        if (audioRef.current) {
          audioRef.current.pause();
        }
      }
    }, 240);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const dx = Math.abs(e.clientX - pointerStartPos.current.x);
    const dy = Math.abs(e.clientY - pointerStartPos.current.y);
    if (dx > 10 || dy > 10) {
      isDragOrSwipe.current = true;
      if (longPressTimer.current) {
        window.clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (isHolding.current) {
      isHolding.current = false;
      onCleanModeChange(false);
      if (videoRef.current && videoRef.current.paused && isActive) {
        videoRef.current.play().then(() => setIsPlaying(true));
      }
      if (audioRef.current && isActive && !isMuted && resolvedAudioUrl) {
        audioRef.current.play().catch(() => {});
      }
      return;
    }

    // If the user swiped vertically to scroll reels, DO NOT toggle play/pause!
    if (isDragOrSwipe.current) {
      isDragOrSwipe.current = false;
      return;
    }

    // Normal Tap
    const video = videoRef.current;
    if (!video) return;

    // Auto-enter fullscreen like mobile games on user gesture
    if (!document.fullscreenElement && !(document as any).webkitFullscreenElement && window.innerWidth <= 768) {
      const el = document.documentElement as any;
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {});
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen().catch(() => {});
      }
    }

    if (isMuted) {
      onUnmute();
      if (video.paused) {
        video.play().then(() => setIsPlaying(true));
      }
      if (audioRef.current && resolvedAudioUrl) {
        audioRef.current.muted = false;
        audioRef.current.play().catch(() => {});
      }
      return;
    }

    if (video.paused) {
      video.play().then(() => setIsPlaying(true));
      setShowPlayIcon(false);
      if (audioRef.current && resolvedAudioUrl) {
        audioRef.current.play().catch(() => {});
      }
    } else {
      video.pause();
      setIsPlaying(false);
      setShowPlayIcon(true);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  };

  // Double tap for massive Fire Burst with sparks
  const lastTapRef = useRef<number>(0);
  const handleTouchEnd = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 280) {
      onFireReact();
      setShowFireBurst(true);
      setTimeout(() => setShowFireBurst(false), 950);
    }
    lastTapRef.current = now;
  };

  // Time progress & Video-Loop Auto Re-sync
  const lastTimeRef = useRef<number>(0);
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;

    // Detect when video loops back to 0 (video duration ended and wrapped)
    if (video.currentTime < lastTimeRef.current - 1.0) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        if (isActive && !isHolding.current) {
          audioRef.current.play().catch(() => {});
        }
      }
    }
    lastTimeRef.current = video.currentTime;
    setProgress((video.currentTime / video.duration) * 100);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Interactive seek on bottom progress bar with Tooltip
  const handleScrubberMove = (clientX: number, rect: DOMRect) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const targetSec = pos * video.duration;
    setScrubPreviewTime(
      `${formatSeconds(targetSec)} / ${formatSeconds(video.duration)}`
    );
    setScrubTooltipX(Math.max(30, Math.min(rect.width - 30, clientX - rect.left)));
    video.currentTime = targetSec;
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = pos * audioRef.current.duration;
    }
    setProgress(pos * 100);
  };

  const handlePointerScrub = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsScrubbing(true);
    const rect = e.currentTarget.getBoundingClientRect();
    handleScrubberMove(e.clientX, rect);

    const onPointerMove = (ev: PointerEvent) => {
      handleScrubberMove(ev.clientX, rect);
    };

    const onPointerUp = () => {
      setIsScrubbing(false);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  // Copy share link
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/stream#reel-${reel.id}`;
    if (navigator.share) {
      navigator.share({
        title: `JU 52 Reels: @${reel.uploaderName}`,
        text: reel.caption || "জাহাঙ্গীরনগর বিশ্ববিদ্যালয় ব্যাচ-ডে রিলস",
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "রিলস লিংক কপি হয়েছে! 🔗",
        description: "বন্ধুদের সাথে মেসেঞ্জার বা হোয়াটসঅ্যাপে শেয়ার করো।",
      });
    }
  };

  return (
    <div
      ref={cardRef}
      id={`reel-item-${reel.id}`}
      className="relative w-full h-[100dvh] snap-start snap-always overflow-hidden bg-black flex items-center justify-center select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: "translateZ(0)",
        willChange: "transform",
      }}
    >
      {/* Synchronized Apple Music Soundtrack Streamer */}
      {shouldLoad && resolvedAudioUrl && (
        <audio
          ref={audioRef}
          src={resolvedAudioUrl}
          loop
          preload="auto"
        />
      )}

      {/* HTML5 Video Player with Real-time CSS Filter */}
      {shouldLoad ? (
        <video
          ref={videoRef}
          src={videoSrc}
          loop
          playsInline
          muted={isMuted}
          preload="auto"
          style={{
            filter: getFilterCss(reel.filterId),
            transform: "translateZ(0)",
            willChange: "filter, transform",
          }}
          onLoadedData={() => {
            capturePoster();
            setIsBuffering(false);
          }}
          onWaiting={() => {
            setIsBuffering(true);
            if (audioRef.current) audioRef.current.pause();
          }}
          onPlaying={() => {
            setIsBuffering(false);
            capturePoster();
            if (audioRef.current && isActive && resolvedAudioUrl && !isHolding.current) {
              audioRef.current.play().catch(() => {});
            }
          }}
          onCanPlay={() => {
            setIsBuffering(false);
          }}
          onPause={() => {
            setIsPlaying(false);
            if (audioRef.current) audioRef.current.pause();
          }}
          onSeeked={() => {
            if (audioRef.current && videoRef.current && audioRef.current.duration) {
              audioRef.current.currentTime =
                videoRef.current.currentTime % audioRef.current.duration;
            }
          }}
          onError={handleVideoError}
          onTimeUpdate={handleTimeUpdate}
          className="w-full h-full object-cover select-none transition-[filter] duration-300"
        />
      ) : (
        <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center text-zinc-700">
          <Film className="w-12 h-12 mb-2 animate-pulse" />
          <span className="text-[11px] font-mono">JU-52 Reel</span>
        </div>
      )}

      {/* Instant 0ms First-Frame Poster Layer */}
      {posterUrl && (
        <img
          src={posterUrl}
          alt=""
          style={{ filter: getFilterCss(reel.filterId) }}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 pointer-events-none z-10 ${
            isPlaying && !isBuffering ? "opacity-0" : "opacity-100"
          }`}
        />
      )}

      {/* Sleek Buffering Indicator */}
      {isBuffering && isActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="p-3.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 shadow-2xl">
            <RefreshCw className="w-7 h-7 text-amber-400 animate-spin" />
          </div>
        </div>
      )}

      {/* Tap to Unmute Indicator */}
      {isMuted && isActive && !isCleanMode && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUnmute();
            if (!document.fullscreenElement && !(document as any).webkitFullscreenElement && window.innerWidth <= 768) {
              const el = document.documentElement as any;
              if (el.requestFullscreen) {
                el.requestFullscreen().catch(() => {});
              } else if (el.webkitRequestFullscreen) {
                el.webkitRequestFullscreen().catch(() => {});
              }
            }
          }}
          className="absolute top-16 left-4 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 backdrop-blur-xl text-white text-xs font-semibold shadow-lg shadow-amber-950/60 animate-pulse transition-all cursor-pointer active:scale-95 border border-white/25"
        >
          <VolumeX className="w-4 h-4 text-white" />
          <span>শব্দ শুনতে ট্যাপ করুন 🔊</span>
        </button>
      )}

      {/* Error Retry Overlay */}
      {hasError && (
        <div className="absolute inset-0 bg-black/85 z-20 flex flex-col items-center justify-center gap-3 p-4 text-center">
          <Film className="w-10 h-10 text-rose-500/80" />
          <p className="text-xs text-zinc-300">ভিডিওটি লোড করা সম্ভব হয়নি।</p>
          {reel.fileId && (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleVideoError();
              }}
              className="bg-rose-600 hover:bg-rose-500 text-white text-xs rounded-full px-4"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              আবার চেষ্টা করো
            </Button>
          )}
        </div>
      )}

      {/* Dim overlay for text readability */}
      <div
        className={`absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90 pointer-events-none transition-opacity duration-300 ${
          isCleanMode ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Center Fire Burst on Double Tap with Glowing Shockwave */}
      {showFireBurst && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-ping">
          <div className="relative flex items-center justify-center">
            <Flame className="w-32 h-32 text-amber-400 fill-amber-400 drop-shadow-[0_0_40px_rgba(251,191,36,0.9)]" />
            <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-2xl animate-pulse" />
          </div>
        </div>
      )}

      {/* Center Paused Indicator */}
      {showPlayIcon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-xl flex items-center justify-center text-white border border-white/20 shadow-2xl">
            <Play className="w-8 h-8 fill-white ml-1" />
          </div>
        </div>
      )}

      {/* ================== RIGHT FROSTED GLASS ACTION STACK ================== */}
      <div
        className={`absolute right-3 bottom-10 sm:bottom-12 z-20 flex flex-col items-center gap-2 sm:gap-2.5 transition-opacity duration-300 ${
          isCleanMode ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Reels Studio Drop Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenUpload();
          }}
          className="flex flex-col items-center gap-0.5 group transition-transform active:scale-110"
          title="রিলস ড্রপ করুন"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-pink-500 p-[1.5px] shadow-[0_0_15px_rgba(244,63,94,0.45)] group-hover:shadow-[0_0_22px_rgba(244,63,94,0.65)] transition-all">
            <div className="w-full h-full rounded-full bg-black/60 backdrop-blur-xl flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <span className="text-[9px] font-bold text-amber-300 drop-shadow">ড্রপ</span>
        </button>

        {/* 2. Grid Explorer Switcher */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleViewMode();
          }}
          className="flex flex-col items-center gap-0.5 group transition-transform active:scale-110"
          title="সব রিলস গ্রিড ভিউতে দেখুন"
        >
          <div className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-2xl border border-white/20 flex items-center justify-center text-white shadow-lg transition-all group-hover:scale-105">
            <LayoutGrid className="w-4 h-4 text-zinc-200" />
          </div>
          <span className="text-[9px] font-medium text-zinc-300">গ্রিড</span>
        </button>

        {/* 3. Game-Style Fullscreen Toggle (Hides mobile browser top bar) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFullscreen();
          }}
          className="flex flex-col items-center gap-0.5 group transition-transform active:scale-110"
          title={isFullscreen ? "ফুলস্ক্রিন বন্ধ" : "গেমের মত ফুলস্ক্রিন করুন"}
        >
          <div
            className={`w-9 h-9 rounded-full backdrop-blur-2xl border flex items-center justify-center shadow-lg transition-all group-hover:scale-105 ${
              isFullscreen
                ? "bg-amber-500/25 border-amber-400 text-amber-300 shadow-amber-500/30"
                : "bg-white/10 hover:bg-white/20 border-white/20 text-white"
            }`}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-amber-300" />
            ) : (
              <Maximize2 className="w-4 h-4 text-zinc-200" />
            )}
          </div>
          <span className="text-[9px] font-medium text-zinc-300">
            {isFullscreen ? "ছোট" : "ফুল"}
          </span>
        </button>

        {/* 4. Fire React (🔥) with Floating Shockwave */}
        <button
          onClick={onFireReact}
          className="flex flex-col items-center gap-0.5 group transition-transform active:scale-125"
          title="Fire React"
        >
          <div className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-2xl border border-amber-500/40 flex items-center justify-center text-white shadow-xl shadow-amber-500/20 group-hover:border-amber-400 group-hover:shadow-[0_0_20px_rgba(251,191,36,0.5)] transition-all">
            <Flame className="w-5 h-5 text-amber-400 fill-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.7)] group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-[11px] font-bold text-amber-400 drop-shadow font-mono">
            {reel.fire}
          </span>
        </button>

        {/* 5. Share Button */}
        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-0.5 group transition-transform active:scale-110"
          title="শেয়ার"
        >
          <div className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-2xl border border-white/20 flex items-center justify-center text-white shadow-lg transition-all">
            <Share2 className="w-4 h-4 text-zinc-200" />
          </div>
          <span className="text-[9px] font-medium text-zinc-300">শেয়ার</span>
        </button>

        {/* 6. Sound Toggle Button */}
        <button
          onClick={onToggleMute}
          className="flex flex-col items-center gap-0.5 group transition-transform active:scale-110"
          title={isMuted ? "সাউন্ড চালু করুন" : "মিউট করুন"}
        >
          <div className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-2xl border border-white/20 flex items-center justify-center text-white shadow-lg transition-all">
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <span className="text-[8px] text-zinc-400 font-mono">
            {isMuted ? "MUTE" : "ON"}
          </span>
        </button>

        {/* 7. Admin Panel Quick Link (Visible only to Admin) */}
        {hasAdminAccess && (
          <Link
            to="/admin/reels"
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col items-center gap-0.5 group transition-transform active:scale-110"
            title="রিলস এডমিন কন্ট্রোল"
          >
            <div className="w-8 h-8 rounded-full bg-amber-500/20 hover:bg-amber-500/30 backdrop-blur-2xl border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-md transition-all">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <span className="text-[8px] text-amber-300 font-medium">এডমিন</span>
          </Link>
        )}

        {/* 8. Admin Delete Action Button (Visible only to Admin) */}
        {hasAdminAccess && onDeleteReel && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteReel();
            }}
            className="flex flex-col items-center gap-0.5 group transition-transform active:scale-110"
            title="রিলস ডিলিট করুন (এডমিন)"
          >
            <div className="w-8 h-8 rounded-full bg-rose-500/20 hover:bg-rose-500/30 backdrop-blur-2xl border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-lg transition-all group-hover:scale-105">
              <Trash2 className="w-3.5 h-3.5" />
            </div>
            <span className="text-[8px] text-rose-400 font-medium">মুছুন</span>
          </button>
        )}
      </div>

      {/* ================== BOTTOM INFO OVERLAY ================== */}
      <div
        className={`absolute left-3.5 right-16 bottom-3.5 z-10 text-left pointer-events-none transition-opacity duration-300 ${
          isCleanMode ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* Creator Avatar & Name & Department */}
        <div className="flex items-center gap-2 mb-1.5 pointer-events-auto">
          {/* Creator Avatar with Gold Glass Ring */}
          <div className="w-7 h-7 rounded-full p-[1.5px] bg-gradient-to-tr from-amber-400 via-rose-500 to-pink-500 shadow-xl flex-shrink-0">
            <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center text-[11px] font-bold text-white border border-black/40">
              {reel.uploaderName.charAt(0)}
            </div>
          </div>
          <span className="text-sm font-extrabold text-white tracking-wide drop-shadow truncate max-w-[130px]">
            @{reel.uploaderName}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-md text-zinc-200 font-medium border border-white/15 truncate max-w-[140px]">
            {reel.department}
          </span>
        </div>

        {/* Caption */}
        {reel.caption && (
          <p className="text-xs text-zinc-200 line-clamp-2 leading-relaxed drop-shadow mb-2.5 font-normal">
            {reel.caption}
          </p>
        )}

        {/* Music Marquee + Spinning Vinyl Record + Live Soundwave Bars */}
        <div className="flex items-center gap-2.5 pointer-events-auto">
          {/* Spinning Vinyl Record with Real Apple Music Artwork */}
          <div className="relative flex items-center justify-center flex-shrink-0">
            <div
              className={`w-7 h-7 rounded-full bg-gradient-to-tr from-zinc-900 via-zinc-800 to-black border border-white/20 flex items-center justify-center shadow-xl overflow-hidden ${
                isPlaying && !isMuted ? "animate-vinyl-spin" : ""
              }`}
            >
              {reel.audioArtwork ? (
                <img
                  src={reel.audioArtwork}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-2 h-2 rounded-full bg-amber-400 border border-white/50" />
              )}
            </div>
            {isPlaying && !isMuted && (
              <div className="absolute -top-1.5 -right-0.5 text-[9px] text-amber-400 animate-bounce">
                ♪
              </div>
            )}
          </div>

          {/* Marquee Song Title */}
          <div className="overflow-hidden whitespace-nowrap max-w-[145px] sm:max-w-[190px]">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-white/90">
              <Music2 className="w-3 h-3 text-amber-400 flex-shrink-0" />
              <span className="truncate">
                {reel.audioTitle
                  ? `${reel.audioTitle} • ${reel.audioArtist}`
                  : `অরিজিনাল ভিডিও সাউন্ড • @${reel.uploaderName}`}
              </span>
            </div>
          </div>

          {/* Live Soundwave Bars (ılılıllı) */}
          <div className="flex items-end gap-0.5 h-3 px-1">
            <div
              className={`w-0.5 rounded-full bg-amber-400 transition-all duration-200 ${
                isPlaying && !isMuted
                  ? "h-3 animate-[music-bar_0.7s_ease-in-out_infinite]"
                  : "h-1 opacity-50"
              }`}
            />
            <div
              className={`w-0.5 rounded-full bg-amber-400 transition-all duration-200 ${
                isPlaying && !isMuted
                  ? "h-2.5 animate-[music-bar_0.5s_ease-in-out_infinite_0.15s]"
                  : "h-1 opacity-50"
              }`}
            />
            <div
              className={`w-0.5 rounded-full bg-amber-400 transition-all duration-200 ${
                isPlaying && !isMuted
                  ? "h-3 animate-[music-bar_0.8s_ease-in-out_infinite_0.3s]"
                  : "h-1 opacity-50"
              }`}
            />
          </div>
        </div>
      </div>

      {/* ================== INTERACTIVE SCRUBBER WITH TIME TOOLTIP ================== */}
      <div
        onPointerDown={handlePointerScrub}
        className="absolute bottom-0 inset-x-0 h-4 cursor-pointer z-30 group flex items-end"
      >
        {/* Floating Scrubber Time Preview Tooltip */}
        {isScrubbing && scrubPreviewTime && (
          <div
            className="absolute bottom-3 transform -translate-x-1/2 pointer-events-none z-40 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 text-[10px] font-mono text-amber-300 shadow-xl"
            style={{ left: `${scrubTooltipX}px` }}
          >
            {scrubPreviewTime}
          </div>
        )}

        <div className="w-full h-1 bg-white/20 group-hover:h-2 transition-all">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-pink-500 transition-all duration-75 relative"
            style={{ width: `${progress}%` }}
          >
            {/* Scrubber Knob */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    </div>
  );
}
