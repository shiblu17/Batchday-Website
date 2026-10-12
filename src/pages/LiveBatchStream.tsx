import React, { useState, useEffect, useRef } from "react";
import {
  Video,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Heart,
  Flame,
  Share2,
  ExternalLink,
  RefreshCw,
  Upload,
  Film,
  Sparkles,
  MapPin,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Smartphone,
  Music2,
  Send,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  uploadVideoToTelegram,
  validateVideoFile,
  UploadProgress,
} from "@/utils/streamUploader";

export interface ReelItem {
  id: string;
  url: string;
  caption?: string;
  uploaderName: string;
  department: string;
  spot?: string;
  duration?: number;
  telegramMessageId?: number;
  created_at: string;
  likes: number;
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

const SPOTS = [
  "বটতলা",
  "মুক্তমঞ্চ",
  "কেন্দ্রীয় শহীদ মিনার",
  "টারজান পয়েন্ট",
  "পরিবহন চত্বর",
  "চৌরঙ্গী",
  "জাহানারা ইমাম লেক",
  "ক্যাফেটেরিয়া",
  "সুইমিং পুল",
  "অন্যান্য",
];

export default function LiveBatchStream() {
  const [reels, setReels] = useState<ReelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReelId, setActiveReelId] = useState<string | null>(null);
  const [isGlobalMuted, setIsGlobalMuted] = useState(false);
  const [viewMode, setViewMode] = useState<"reels" | "grid">("reels");
  const [uploadOpen, setUploadOpen] = useState(false);

  // Upload Form states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [formName, setFormName] = useState(
    localStorage.getItem("ju_stream_name") || ""
  );
  const [formDept, setFormDept] = useState(
    localStorage.getItem("ju_stream_dept") || ""
  );
  const [formSpot, setFormSpot] = useState("বটতলা");
  const [formCaption, setFormCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null
  );

  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch only video reels from Supabase
  const fetchReels = async () => {
    try {
      setLoading(true);
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
            caption.startsWith("[REEL]") ||
            urlLower.includes(".mp4") ||
            urlLower.includes(".webm") ||
            urlLower.includes("api.telegram.org") ||
            urlLower.includes("t.me")
          );
        });

        const parsed: ReelItem[] = videoRows.map((row: any) => {
          let uploaderName = "ব্যাচমেট";
          let department = "জাহাঙ্গীরনগর বিশ্ববিদ্যালয়";
          let spot = "ক্যাম্পাস";
          let caption = "";

          if (row.caption && row.caption.startsWith("[REEL]")) {
            const match = row.caption.match(
              /\[REEL\]\s*([^(\n]+?)\s*\(([^)]+?)\)(?:\s*-\s*\[([^\]]+?)\])?(?:\s*:\s*(.*))?/
            );
            if (match) {
              uploaderName = match[1]?.trim() || uploaderName;
              department = match[2]?.trim() || department;
              spot = match[3]?.trim() || spot;
              caption = match[4]?.trim() || "";
            } else {
              caption = row.caption.replace("[REEL]", "").trim();
            }
          } else {
            caption = row.caption || "";
          }

          const localLikes = parseInt(
            localStorage.getItem(`reel_likes_${row.id}`) || "2"
          );
          const localFire = parseInt(
            localStorage.getItem(`reel_fire_${row.id}`) || "1"
          );

          return {
            id: row.id,
            url: row.url,
            caption,
            uploaderName,
            department,
            spot,
            created_at: row.created_at,
            likes: localLikes,
            fire: localFire,
          };
        });

        setReels(parsed);

        // Set first reel active if none selected
        if (parsed.length > 0 && !activeReelId) {
          setActiveReelId(parsed[0].id);
        }
      }
    } catch (err: any) {
      console.error("Error fetching reels:", err);
      toast({
        title: "রিলস লোড হতে পারেনি",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReels();
    const interval = setInterval(fetchReels, 25000);
    return () => clearInterval(interval);
  }, []);

  // Handle file select
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setVideoDuration(null);

    try {
      const { duration, needsCompression } = await validateVideoFile(file);
      setVideoDuration(Math.round(duration));
      setFilePreview(URL.createObjectURL(file));

      if (needsCompression) {
        const mb = (file.size / (1024 * 1024)).toFixed(1);
        toast({
          title: `ভিডিও সাইজ ${mb} MB (বড় সাইজ)`,
          description:
            "চিন্তার কিছু নেই! আপলোডের সময় ব্রাউজার নিজে থেকেই এটি ২০ MB-র নিচে অপ্টিমাইজড করে নেবে।",
        });
      }
    } catch (err: any) {
      setSelectedFile(null);
      setFilePreview(null);
      toast({
        title: "ভিডিওর দৈর্ঘ্যে সমস্যা",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // Submit reel upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast({
        title: "ভিডিও ফাইল সিলেক্ট করো",
        description: "দয়া করে ৪৫ সেকেন্ডের রিলস ভিডিও সিলেক্ট করো।",
        variant: "destructive",
      });
      return;
    }

    if (!formName.trim()) {
      toast({
        title: "তোমার নাম লিখো",
        variant: "destructive",
      });
      return;
    }

    if (!formDept.trim()) {
      toast({
        title: "ডিপার্টমেন্ট সিলেক্ট করো",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem("ju_stream_name", formName);
    localStorage.setItem("ju_stream_dept", formDept);

    setUploading(true);

    try {
      const captionTag = `[REEL] ${formName} (${formDept}) - [${formSpot}]: ${formCaption}`;

      // Upload to Telegram Bot
      const res = await uploadVideoToTelegram(
        selectedFile,
        captionTag,
        (progress) => setUploadProgress(progress)
      );

      // Save to Supabase Database
      const { data, error } = await supabase
        .from("gallery_photos")
        .insert({
          url: res.url,
          caption: captionTag,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "🎉 রিলস ড্রপ সফল হয়েছে!",
        description: "তোমার রিলস ভিডিওটি সরাসরি ফিডে যুক্ত হয়েছে এবং অটো-প্লে হচ্ছে!",
      });

      setUploadOpen(false);
      setSelectedFile(null);
      setFilePreview(null);
      setFormCaption("");
      setUploadProgress(null);

      // Refresh and focus on new reel
      await fetchReels();
      if (data?.id) {
        setActiveReelId(data.id);
      }
    } catch (err: any) {
      console.error("Upload failed:", err);
      toast({
        title: "আপলোড ব্যর্থ হয়েছে",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Reactions
  const handleReact = (id: string, type: "likes" | "fire") => {
    setReels((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newVal = item[type] + 1;
          localStorage.setItem(`reel_${type}_${id}`, String(newVal));
          return { ...item, [type]: newVal };
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#130721] via-[#1a0a19] to-[#0b0412] text-white pb-20 select-none overflow-x-hidden relative">
      {/* Instagram Ambient Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-10 -left-20 w-96 h-96 bg-[#c13584]/25 rounded-full blur-[110px]" />
        <div className="absolute top-1/2 -right-20 w-96 h-96 bg-[#f77737]/20 rounded-full blur-[110px]" />
        <div className="absolute -bottom-20 left-1/3 w-[450px] h-96 bg-[#833ab4]/25 rounded-full blur-[130px]" />
      </div>

      {/* Top Floating App Bar (Instagram Style) */}
      <header className="sticky top-0 z-40 bg-[#130721]/85 backdrop-blur-xl border-b border-pink-500/20 px-4 py-3 flex items-center justify-between relative shadow-lg shadow-black/40">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#fa7e1e] to-[#d62976] animate-pulse" />
          <h1 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-1.5 font-display">
            <span className="text-white">JU-52</span>
            <span className="bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] bg-clip-text text-transparent font-black">
              রিলস
            </span>
          </h1>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#fa7e1e]/20 to-[#d62976]/20 text-rose-300 font-bold border border-rose-500/30">
            ৪৫ সে.
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <button
            onClick={() =>
              setViewMode(viewMode === "reels" ? "grid" : "reels")
            }
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 transition-colors border border-white/10"
            title={viewMode === "reels" ? "গ্রিড ভিউ" : "রিলস সোয়াইপ ভিউ"}
          >
            {viewMode === "reels" ? (
              <LayoutGrid className="w-4 h-4" />
            ) : (
              <Smartphone className="w-4 h-4 text-rose-400" />
            )}
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setIsGlobalMuted(!isGlobalMuted)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 transition-colors border border-white/10"
            title={isGlobalMuted ? "সাউন্ড অন করো" : "সাউন্ড মিউট করো"}
          >
            {isGlobalMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          {/* Upload Button (Instagram Gradient) */}
          <Button
            onClick={() => setUploadOpen(true)}
            size="sm"
            className="bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] hover:opacity-90 text-white font-bold rounded-full px-4 py-1.5 text-xs shadow-lg shadow-[#dc2743]/30 flex items-center gap-1.5 transition-transform active:scale-95 border border-white/20"
          >
            <Video className="w-3.5 h-3.5" />
            <span>ড্রপ রিলস</span>
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      {loading && reels.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-red-500" />
          <p className="text-xs font-semibold">রিলস ফিড প্রস্তুত হচ্ছে...</p>
        </div>
      ) : reels.length === 0 ? (
        <div className="max-w-md mx-auto text-center py-20 px-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
            <Film className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            এখনো কোনো রিলস ড্রপ করা হয়নি!
          </h3>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            ক্যাম্পাসের আড্ডা, নাচ, গান বা বন্ধুদের সাথে ৪৫ সেকেন্ডের প্রথম রিলস
            ভিডিও আপলোড করে পুরো ক্যাম্পাসকে কাঁপিয়ে দাও!
          </p>
          <Button
            onClick={() => setUploadOpen(true)}
            className="bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs px-6 py-2.5 shadow-lg shadow-red-600/30"
          >
            প্রথম রিলস ড্রপ করো 🚀
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        /* ================== GRID VIEW ================== */
        <div className="container max-w-5xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {reels.map((reel) => (
              <div
                key={reel.id}
                onClick={() => {
                  setActiveReelId(reel.id);
                  setViewMode("reels");
                }}
                className="group relative aspect-[9/16] bg-slate-900 rounded-2xl overflow-hidden cursor-pointer border border-white/10 hover:border-red-500/50 transition-all shadow-lg"
              >
                <video
                  src={reel.url}
                  muted
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white">
                  <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                </div>

                <div className="absolute bottom-2.5 inset-x-2.5 text-left">
                  <p className="text-xs font-bold text-white truncate">
                    {reel.uploaderName}
                  </p>
                  <p className="text-[10px] text-slate-300 truncate">
                    {reel.department}
                  </p>
                  {reel.spot && (
                    <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded bg-red-500/80 text-white font-medium">
                      📍 {reel.spot}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ================== REELS SWIPE VIEW (AUTOPLAY TIKTOK/FB STYLE) ================== */
        <div className="relative flex justify-center">
          {/* Desktop Navigation Arrows */}
          <div className="hidden lg:flex fixed right-8 bottom-28 flex-col gap-2 z-30">
            <button
              onClick={() => navigateReel("up")}
              className="p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-white/10 shadow-xl transition-transform active:scale-90"
              title="পূর্ববর্তী রিলস"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigateReel("down")}
              className="p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-white/10 shadow-xl transition-transform active:scale-90"
              title="পরবর্তী রিলস"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Reels Vertical Scroll Container */}
          <div
            ref={containerRef}
            className="w-full max-w-[430px] h-[calc(100vh-130px)] sm:h-[calc(100vh-120px)] overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {reels.map((reel) => (
              <ReelPlayerCard
                key={reel.id}
                reel={reel}
                isActive={activeReelId === reel.id}
                isMuted={isGlobalMuted}
                onToggleMute={() => setIsGlobalMuted(!isGlobalMuted)}
                onReact={handleReact}
                onInView={() => setActiveReelId(reel.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upload Modal (Dedicated to 45s Reels - Instagram Theme) */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="bg-[#170a24]/95 border border-pink-500/30 text-slate-100 max-w-md p-6 rounded-3xl max-h-[92vh] overflow-y-auto backdrop-blur-2xl shadow-[0_0_50px_rgba(225,48,108,0.25)]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-white font-display">
              <span className="p-1.5 rounded-lg bg-gradient-to-tr from-[#feda75] via-[#fa7e1e] via-[#d62976] to-[#962fbf] text-white">
                <Film className="w-4 h-4" />
              </span>
              ৪৫ সেকেন্ডের রিলস ড্রপ করো
            </DialogTitle>
            <DialogDescription className="text-xs text-rose-200/70">
              ভিডিওটি স্বয়ংক্রিয়ভাবে টেলিগ্রাম ক্লাউড ভল্টে সংরক্ষিত হবে এবং
              সবার ফিডে অটো-প্লে হবে।
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadSubmit} className="space-y-4 pt-2">
            {/* Video File Picker */}
            <div className="border-2 border-dashed border-pink-500/40 hover:border-pink-500 rounded-2xl p-4 text-center bg-[#230f36]/60 transition-colors">
              {filePreview ? (
                <div className="relative rounded-xl overflow-hidden max-h-60 bg-black flex items-center justify-center">
                  <video
                    src={filePreview}
                    controls
                    className="max-h-60 w-full object-contain"
                  />
                  {videoDuration && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/80 text-[11px] font-mono text-emerald-400 border border-emerald-500/40">
                      ⏱️ {videoDuration} সেকেন্ড
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setFilePreview(null);
                    }}
                    className="absolute top-2 left-2 bg-[#dc2743] hover:bg-rose-700 text-white p-1 rounded-full text-xs shadow-lg"
                    title="বাতিল করুন"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center justify-center py-6">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#fa7e1e]/20 via-[#d62976]/20 to-[#962fbf]/20 border border-pink-500/30 flex items-center justify-center text-pink-400 mb-2">
                    <Video className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-bold text-white mb-1">
                    ক্যামেরা দিয়ে রেকর্ড করো বা ভিডিও সিলেক্ট করো
                  </span>
                  <span className="text-[11px] text-rose-200/70">
                    সর্বোচ্চ ৪৫ সেকেন্ড • সাইজ বড় হলে ব্রাউজার অটো-কম্প্রেস করবে
                  </span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Name & Dept */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-rose-100 mb-1 block">
                  তোমার নাম *
                </label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="যেমন: সাকিব"
                  className="bg-[#230f36] border-white/10 focus:border-[#e1306c] text-slate-100 text-xs rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-rose-100 mb-1 block">
                  ডিপার্টমেন্ট *
                </label>
                <select
                  value={formDept}
                  onChange={(e) => setFormDept(e.target.value)}
                  className="w-full bg-[#230f36] border border-white/10 text-slate-100 text-xs rounded-xl px-3 py-2 outline-none focus:border-[#e1306c]"
                  required
                >
                  <option value="">সিলেক্ট করো...</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Campus Spot */}
            <div>
              <label className="text-xs font-semibold text-rose-100 mb-1 block">
                ক্যাম্পাস স্পট (কোথায় ভিডিও?)
              </label>
              <select
                value={formSpot}
                onChange={(e) => setFormSpot(e.target.value)}
                className="w-full bg-[#230f36] border border-white/10 text-slate-100 text-xs rounded-xl px-3 py-2 outline-none focus:border-[#e1306c]"
              >
                {SPOTS.map((s) => (
                  <option key={s} value={s}>
                    📍 {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Caption */}
            <div>
              <label className="text-xs font-semibold text-rose-100 mb-1 block">
                ক্যাপশন বা মজার স্মৃতি
              </label>
              <Textarea
                value={formCaption}
                onChange={(e) => setFormCaption(e.target.value)}
                placeholder="যেমন: মুক্তমঞ্চে বন্ধুদের তুমুল নাচ... 🔥"
                rows={2}
                className="bg-[#230f36] border-white/10 focus:border-[#e1306c] text-slate-100 text-xs rounded-xl"
              />
            </div>

            {/* Progress Status */}
            {uploadProgress && (
              <div className="p-3 rounded-xl bg-[#230f36] border border-pink-500/30 space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">
                    {uploadProgress.message}
                  </span>
                  <span className="text-rose-400 font-mono">
                    {uploadProgress.percent}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] transition-all duration-300"
                    style={{ width: `${uploadProgress.percent}%` }}
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={uploading}
              className="w-full bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] hover:opacity-95 text-white font-bold rounded-xl py-2.5 text-xs shadow-lg shadow-[#dc2743]/30 flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>প্রসেস ও আপলোড হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>রিলস ড্রপ করো 🚀</span>
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Authentic Instagram / TikTok / Facebook style Vertical Reel Card
 * Supports Auto-Play when in view, Tap to Play/Pause, Double-Tap to Like, Floating Actions
 */
function ReelPlayerCard({
  reel,
  isActive,
  isMuted,
  onToggleMute,
  onReact,
  onInView,
}: {
  reel: ReelItem;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onReact: (id: string, type: "likes" | "fire") => void;
  onInView: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [progress, setProgress] = useState(0);

  // IntersectionObserver for Facebook Reels-style autoplay
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            onInView();
          }
        });
      },
      { threshold: 0.6 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Handle play/pause according to active state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.muted = isMuted;
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          // Autoplay policy fallback: mute and retry
          video.muted = true;
          video.play().then(() => setIsPlaying(true)).catch(() => {});
        });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isActive, isMuted]);

  // Tap to play/pause
  const handleCardClick = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setIsPlaying(true));
      setShowPlayIcon(false);
    } else {
      video.pause();
      setIsPlaying(false);
      setShowPlayIcon(true);
    }
  };

  // Double tap to like
  const lastTapRef = useRef<number>(0);
  const handleTouchEnd = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap detected!
      onReact(reel.id, "likes");
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 900);
    }
    lastTapRef.current = now;
  };

  // Time progress
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setProgress((video.currentTime / video.duration) * 100);
  };

  // Copy share link
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(
      `${window.location.origin}/stream#reel-${reel.id}`
    );
    toast({
      title: "রিলস লিংক কপি হয়েছে! 🔗",
      description: "বন্ধুদের সাথে মেসেঞ্জার বা হোয়াটসঅ্যাপে শেয়ার করো।",
    });
  };

  return (
    <div
      ref={cardRef}
      id={`reel-item-${reel.id}`}
      className="relative w-full h-full snap-start snap-always rounded-none sm:rounded-[32px] overflow-hidden bg-black flex items-center justify-center border-y sm:border border-pink-500/30 shadow-[0_8px_35px_rgba(214,41,118,0.2)]"
      onClick={handleCardClick}
      onTouchEnd={handleTouchEnd}
    >
      {/* HTML5 Video Player */}
      <video
        ref={videoRef}
        src={reel.url}
        loop
        playsInline
        muted={isMuted}
        onTimeUpdate={handleTimeUpdate}
        className="w-full h-full object-cover sm:object-contain select-none"
      />

      {/* Dim overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/85 pointer-events-none" />

      {/* Heart Burst on Double Tap */}
      {showHeartBurst && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 animate-ping">
          <Heart className="w-24 h-24 text-[#ff3040] fill-[#ff3040] drop-shadow-[0_0_20px_rgba(255,48,64,0.8)]" />
        </div>
      )}

      {/* Center Paused Icon Indicator */}
      {showPlayIcon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-2xl">
            <Play className="w-8 h-8 fill-white ml-1" />
          </div>
        </div>
      )}

      {/* Right Floating Action Stack (Instagram Style) */}
      <div
        className="absolute right-3 bottom-16 sm:bottom-20 z-20 flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Profile Avatar with Instagram Story Ring */}
        <div className="w-11 h-11 rounded-full p-[2.5px] bg-gradient-to-tr from-[#feda75] via-[#fa7e1e] via-[#d62976] via-[#962fbf] to-[#4f5bd5] shadow-lg">
          <div className="w-full h-full rounded-full bg-[#180a21] flex items-center justify-center text-xs font-bold text-white border border-black/40">
            {reel.uploaderName.charAt(0)}
          </div>
        </div>

        {/* Love Button (Instagram Vibrant Heart) */}
        <button
          onClick={() => onReact(reel.id, "likes")}
          className="flex flex-col items-center gap-1 group transition-transform active:scale-125"
        >
          <div className="w-11 h-11 rounded-full bg-black/45 backdrop-blur-md border border-white/15 flex items-center justify-center text-white group-hover:bg-[#e1306c]/30 shadow-lg">
            <Heart className="w-6 h-6 text-[#ff3040] fill-[#ff3040] drop-shadow-[0_0_8px_rgba(255,48,64,0.6)]" />
          </div>
          <span className="text-[11px] font-bold text-white drop-shadow">
            {reel.likes}
          </span>
        </button>

        {/* Fire Button (Instagram Sunset Orange) */}
        <button
          onClick={() => onReact(reel.id, "fire")}
          className="flex flex-col items-center gap-1 group transition-transform active:scale-125"
        >
          <div className="w-11 h-11 rounded-full bg-black/45 backdrop-blur-md border border-white/15 flex items-center justify-center text-white group-hover:bg-[#fa7e1e]/30 shadow-lg">
            <Flame className="w-6 h-6 text-[#fa7e1e] fill-[#fa7e1e] drop-shadow-[0_0_8px_rgba(250,126,30,0.5)]" />
          </div>
          <span className="text-[11px] font-bold text-white drop-shadow">
            {reel.fire}
          </span>
        </button>

        {/* Share Button (Instagram Purple) */}
        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-1 group transition-transform active:scale-110"
        >
          <div className="w-11 h-11 rounded-full bg-black/45 backdrop-blur-md border border-white/15 flex items-center justify-center text-white group-hover:bg-[#962fbf]/30 shadow-lg">
            <Share2 className="w-5 h-5 text-purple-300" />
          </div>
          <span className="text-[10px] font-semibold text-slate-300">শেয়ার</span>
        </button>

        {/* Sound Toggle Button */}
        <button
          onClick={onToggleMute}
          className="flex flex-col items-center gap-1 group transition-transform active:scale-110"
        >
          <div className="w-11 h-11 rounded-full bg-black/45 backdrop-blur-md border border-white/15 flex items-center justify-center text-white shadow-lg">
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-rose-400" />
            ) : (
              <Volume2 className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          <span className="text-[9px] text-slate-400 font-mono">
            {isMuted ? "MUTE" : "ON"}
          </span>
        </button>

        {/* Telegram Vault Link */}
        <a
          href="https://t.me/JU52ReelsVault"
          target="_blank"
          rel="noreferrer"
          className="w-8 h-8 rounded-full bg-gradient-to-r from-sky-500/20 to-purple-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 shadow hover:scale-105 transition-transform"
          title="টেলিগ্রাম ভল্ট চ্যানেলে দেখো"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Bottom Info Overlay (Instagram Reels Style) */}
      <div className="absolute left-3 right-16 bottom-3 z-10 text-left pointer-events-none">
        {/* Creator Name & Department */}
        <div className="flex items-center gap-2 mb-1 pointer-events-auto">
          <span className="text-sm font-extrabold text-white tracking-wide drop-shadow">
            @{reel.uploaderName}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-slate-200 font-medium border border-white/10">
            {reel.department}
          </span>
        </div>

        {/* Spot Tag with Instagram Gradient */}
        {reel.spot && (
          <div className="mb-1.5 pointer-events-auto">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-gradient-to-r from-[#d62976] to-[#fa7e1e] text-white shadow">
              <MapPin className="w-3 h-3" />
              {reel.spot}
            </span>
          </div>
        )}

        {/* Caption */}
        {reel.caption && (
          <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed drop-shadow mb-2 font-normal">
            {reel.caption}
          </p>
        )}

        {/* Music / Audio Indicator */}
        <div className="flex items-center gap-1.5 text-[11px] text-rose-300 font-medium">
          <Music2 className="w-3.5 h-3.5 text-[#fa7e1e] animate-spin" />
          <span className="truncate max-w-[200px]">
            JU 52nd Batch Day • Original Audio
          </span>
        </div>
      </div>

      {/* Instagram Gradient Bottom Video Progress Line */}
      <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20 z-30">
        <div
          className="h-full bg-gradient-to-r from-[#feda75] via-[#fa7e1e] via-[#d62976] via-[#962fbf] to-[#4f5bd5] transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
