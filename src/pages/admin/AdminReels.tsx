import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Film,
  Trash2,
  Play,
  Pause,
  ExternalLink,
  Flame,
  Search,
  RefreshCw,
  Loader2,
  Music2,
  Sparkles,
  Eye,
  X,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getFilterCss } from "@/utils/reelsCustomization";

interface AdminReelItem {
  id: string;
  url: string;
  caption?: string;
  rawCaption?: string;
  uploaderName: string;
  department: string;
  fileId?: string;
  filterId?: string;
  audioType?: "original" | "itunes";
  audioTitle?: string;
  audioArtist?: string;
  audioArtwork?: string;
  audioPreviewUrl?: string;
  created_at: string;
  fire: number;
}

export default function AdminReels() {
  const [reels, setReels] = useState<AdminReelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [previewReel, setPreviewReel] = useState<AdminReelItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchReels = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("gallery_photos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        // Filter strictly reels and videos (excluding legacy test reels)
        const LEGACY_CUTOFF = "2026-10-18T10:45:00.000Z";
        const videoRows = data.filter((row: any) => {
          if (row.created_at && row.created_at < LEGACY_CUTOFF) {
            return false;
          }
          const urlLower = (row.url || "").toLowerCase();
          const cap = row.caption || "";
          return (
            cap.startsWith("[REEL") ||
            urlLower.includes(".mp4") ||
            urlLower.includes(".webm") ||
            urlLower.includes("cloudinary.com") ||
            urlLower.includes("res.cloudinary.com")
          );
        });

        const parsed: AdminReelItem[] = videoRows.map((row: any) => {
          let uploaderName = "ব্যাচমেট";
          let department = "জাহাঙ্গীরনগর বিশ্ববিদ্যালয়";
          let cleanCaption = "";
          let fileId: string | undefined;
          let filterId: string = "normal";
          let audioType: "original" | "itunes" = "original";
          let audioTitle: string | undefined;
          let audioArtist: string | undefined;
          let audioArtwork: string | undefined;
          let audioPreviewUrl: string | undefined;

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
              });
            }

            const remainder = row.caption.replace(/^\[REEL:?[^\]]*\]\s*/, "");
            const nameMatch = remainder.match(/^([^(]+)\s*\(([^)]+)\)(?::\s*(.*))?$/);
            if (nameMatch) {
              uploaderName = nameMatch[1].trim();
              department = nameMatch[2].trim();
              cleanCaption = nameMatch[3]?.trim() || "";
            } else {
              cleanCaption = remainder;
            }
          } else {
            cleanCaption = row.caption || "";
          }

          const localFire = parseInt(localStorage.getItem(`reel_fire_${row.id}`) || "0", 10) || 1;

          return {
            id: row.id,
            url: row.url,
            rawCaption: row.caption,
            caption: cleanCaption,
            uploaderName,
            department,
            fileId,
            filterId,
            audioType,
            audioTitle,
            audioArtist,
            audioArtwork,
            audioPreviewUrl,
            created_at: row.created_at,
            fire: localFire,
          };
        });

        setReels(parsed);
      }
    } catch (err: any) {
      console.error("Error fetching reels for admin:", err);
      toast.error("রিলস লোড হতে পারেনি: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReels();
  }, []);

  // Delete Reel
  const handleDeleteReel = async (id: string, name: string) => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে @${name} এর এই রিলসটি পুরোপুরি মুছে ফেলতে চান? এটি মুছে ফেললে তা লাইভ ফিড থেকেও অদৃশ্য হয়ে যাবে।`)) {
      return;
    }

    setDeletingId(id);
    try {
      const { error } = await supabase.from("gallery_photos").delete().eq("id", id);
      if (error) throw error;

      toast.success("রিলসটি সফলভাবে মুছে ফেলা হয়েছে! 🗑️");
      setReels((prev) => prev.filter((r) => r.id !== id));
      if (previewReel?.id === id) {
        setPreviewReel(null);
      }
    } catch (err: any) {
      console.error("Delete reel failed:", err);
      toast.error("রিলস মোছা সম্ভব হয়নি: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered Reels
  const filteredReels = reels.filter((r) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      r.uploaderName.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q) ||
      (r.caption || "").toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q);

    const matchDept = selectedDept === "all" || r.department === selectedDept;
    return matchSearch && matchDept;
  });

  // Extract distinct departments
  const departments = Array.from(new Set(reels.map((r) => r.department).filter(Boolean)));

  // Total stats
  const totalFireCount = reels.reduce((acc, r) => acc + (r.fire || 1), 0);
  const totalCreators = new Set(reels.map((r) => r.uploaderName)).size;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              রিলস মডারেশন ও কন্ট্রোল
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-sans font-semibold">
                লাইভ
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              ব্যাচমেটদের আপলোড করা রিলস পর্যবেক্ষণ, প্রিভিউ ও যেকোনো অপ্রীতিকর কনটেন্ট এক ক্লিকে ডিলিট করার ব্যবস্থা।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReels}
            disabled={loading}
            className="rounded-full gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            রিফ্রেশ
          </Button>

          <Button
            size="sm"
            asChild
            className="bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white rounded-full gap-1.5 text-xs font-semibold shadow-md"
          >
            <a href="/stream" target="_blank" rel="noreferrer">
              <ExternalLink className="w-3.5 h-3.5" />
              লাইভ ফিড দেখো
            </a>
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-medium block">মোট রিলস</span>
            <span className="text-2xl font-bold font-display text-foreground mt-0.5 block">
              {reels.length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Film className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-medium block">মোট ক্রিয়েটর</span>
            <span className="text-2xl font-bold font-display text-foreground mt-0.5 block">
              {totalCreators}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-medium block">ফায়ার রিঅ্যাকশন</span>
            <span className="text-2xl font-bold font-display text-amber-500 mt-0.5 block flex items-center gap-1">
              {totalFireCount} <Flame className="w-4 h-4 fill-amber-500" />
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-medium block">ঢাকা এজ সিডিএন</span>
            <span className="text-sm font-bold text-emerald-500 mt-1 block flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              সক্রিয় (Active)
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <span className="text-xs font-mono font-bold">206</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-3.5 rounded-2xl bg-card border border-border shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ক্রিয়েটরের নাম, বিভাগ বা ক্যাপশন দিয়ে সার্চ করো..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-xl bg-muted/40 border-border text-xs h-9"
          />
        </div>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="h-9 px-3 text-xs rounded-xl bg-muted/40 border border-border text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">সব ডিপার্টমেন্ট ({reels.length})</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-xs font-mono">রিলস ডেটাবেস লোড হচ্ছে...</span>
        </div>
      ) : filteredReels.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl p-6">
          <Film className="w-10 h-10 mx-auto text-muted-foreground/60 mb-2" />
          <h3 className="text-base font-bold text-foreground">কোনো রিলস পাওয়া যায়নি</h3>
          <p className="text-xs text-muted-foreground mt-1">
            সার্চ ফিল্টার রিসেট করে আবার চেষ্টা করুন।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReels.map((reel) => (
            <div
              key={reel.id}
              className="group relative bg-card border border-border hover:border-primary/40 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Top Meta Header */}
              <div className="p-3.5 pb-2.5 flex items-center justify-between border-b border-border/50 bg-muted/20">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {reel.uploaderName.charAt(0) || "U"}
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-bold text-foreground block truncate">
                      @{reel.uploaderName}
                    </span>
                    <span className="text-[10px] text-muted-foreground block truncate">
                      {reel.department}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] font-bold text-amber-500 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    <Flame className="w-3 h-3 fill-amber-500" />
                    {reel.fire}
                  </span>
                </div>
              </div>

              {/* Video Player Box / Thumbnail */}
              <div className="relative aspect-[9/13] bg-black overflow-hidden flex items-center justify-center">
                <video
                  src={reel.url}
                  preload="metadata"
                  playsInline
                  muted
                  style={{ filter: getFilterCss(reel.filterId) }}
                  className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity"
                />

                {/* Quick Preview Trigger Overlay */}
                <button
                  onClick={() => setPreviewReel(reel)}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/10 transition-colors group/play"
                  title="সম্পূর্ণ রিলস প্রিভিউ করো"
                >
                  <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover/play:scale-110 active:scale-95 transition-transform shadow-xl">
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </div>
                </button>

                {/* Filter & Music Badges on Video */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                  {reel.filterId && reel.filterId !== "normal" && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-amber-300 border border-white/10">
                      ✨ {reel.filterId}
                    </span>
                  )}
                  {reel.audioTitle && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-pink-300 border border-white/10 flex items-center gap-1 truncate max-w-[160px] ml-auto">
                      <Music2 className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{reel.audioTitle}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Details & Actions */}
              <div className="p-3.5 space-y-2.5">
                {reel.caption ? (
                  <p className="text-xs text-foreground/90 line-clamp-2 leading-relaxed">
                    {reel.caption}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">ক্যাপশন নেই</p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                  <span>
                    {new Date(reel.created_at).toLocaleDateString("bn-BD", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPreviewReel(reel)}
                      className="h-7 px-2.5 text-[11px] rounded-lg gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      প্রিভিউ
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={deletingId === reel.id}
                      onClick={() => handleDeleteReel(reel.id, reel.uploaderName)}
                      className="h-7 px-2.5 text-[11px] rounded-lg gap-1 bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                    >
                      {deletingId === reel.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                      ডিলিট
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Preview Modal */}
      {previewReel && (
        <AdminReelPreviewModal
          reel={previewReel}
          onClose={() => setPreviewReel(null)}
          onDelete={() => handleDeleteReel(previewReel.id, previewReel.uploaderName)}
        />
      )}
    </div>
  );
}

/**
 * Dedicated Admin Reel Preview Dialog Modal
 */
function AdminReelPreviewModal({
  reel,
  onClose,
  onDelete,
}: {
  reel: AdminReelItem;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
      if (audioRef.current && reel.audioPreviewUrl) {
        audioRef.current.play().catch(() => {});
      }
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm max-h-[90vh] bg-zinc-950 rounded-3xl border border-white/15 overflow-hidden flex flex-col text-white shadow-2xl">
        {/* Top Header */}
        <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-zinc-900/60 z-10">
          <div>
            <span className="text-xs font-bold text-white block">@{reel.uploaderName}</span>
            <span className="text-[10px] text-zinc-400 block">{reel.department}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="destructive"
              onClick={onDelete}
              className="h-7 px-2.5 rounded-full text-xs gap-1 bg-rose-600 hover:bg-rose-700"
            >
              <Trash2 className="w-3 h-3" />
              ডিলিট করো
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[380px]">
          {reel.audioPreviewUrl && (
            <audio
              ref={audioRef}
              src={reel.audioPreviewUrl}
              loop
              autoPlay
              muted={isMuted}
            />
          )}

          <video
            ref={videoRef}
            src={reel.url}
            autoPlay
            loop
            playsInline
            muted={isMuted}
            style={{ filter: getFilterCss(reel.filterId) }}
            className="w-full h-full object-cover cursor-pointer"
            onClick={togglePlay}
          />

          {/* Center Play/Pause Indicator */}
          {!isPlaying && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/40"
            >
              <div className="w-14 h-14 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white">
                <Play className="w-6 h-6 ml-0.5 fill-white" />
              </div>
            </button>
          )}

          {/* Mute Toggle Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>
        </div>

        {/* Footer Info */}
        <div className="p-3.5 bg-zinc-900/80 border-t border-white/10 text-xs space-y-2">
          {reel.caption && (
            <p className="text-zinc-200 line-clamp-2">{reel.caption}</p>
          )}
          {reel.audioTitle && (
            <div className="flex items-center gap-1.5 text-[11px] text-pink-400">
              <Music2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{reel.audioTitle} • {reel.audioArtist}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
