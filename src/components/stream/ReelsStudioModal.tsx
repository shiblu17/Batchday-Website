import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Upload,
  Sparkles,
  Music2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Sliders,
  Check,
  Video,
  ArrowRight,
  ChevronLeft,
  Flame,
  Search,
  Radio,
  Headphones,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";
import {
  REEL_FILTERS,
  getFilterCss,
  type ReelFilter,
} from "@/utils/reelsCustomization";
import {
  searchAppleMusic,
  getSmartRecommendations,
  TRENDING_SEARCH_TAGS,
  type MusicTrackItem,
} from "@/utils/itunesMusicService";
import {
  uploadVideoToTelegram,
  validateVideoFile,
  type UploadProgress,
} from "@/utils/streamUploader";
import { supabase } from "@/integrations/supabase/client";

interface ReelsStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newReelId?: string) => void;
  departments: string[];
}

export default function ReelsStudioModal({
  isOpen,
  onClose,
  onSuccess,
  departments,
}: ReelsStudioModalProps) {
  // Navigation step in studio: 1 = pick video, 2 = edit (filters & audio & details)
  const [step, setStep] = useState<1 | 2>(1);

  // Video File & Preview
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Creative Studio States
  const [selectedFilter, setSelectedFilter] = useState("normal");
  const [selectedAppleTrack, setSelectedAppleTrack] =
    useState<MusicTrackItem | null>(null);
  const [origVolume, setOrigVolume] = useState(100);
  const [bgVolume, setBgVolume] = useState(80);
  const [activeTab, setActiveTab] = useState<"filters" | "audio" | "details">(
    "filters"
  );

  // Apple Music Search & Recommendations
  const [musicSearchQuery, setMusicSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MusicTrackItem[]>([]);
  const [isSearchingMusic, setIsSearchingMusic] = useState(false);
  const [recommendations, setRecommendations] = useState<MusicTrackItem[]>([]);

  // Metadata Form
  const [name, setName] = useState(
    localStorage.getItem("ju_stream_name") || ""
  );
  const [dept, setDept] = useState(
    localStorage.getItem("ju_stream_dept") || ""
  );
  const [caption, setCaption] = useState("");

  // Uploading state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null
  );

  // Load Smart Recommendations on Mount
  useEffect(() => {
    let mounted = true;
    getSmartRecommendations("বটতলা").then((res) => {
      if (mounted) setRecommendations(res);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Debounced Apple Music search
  useEffect(() => {
    if (!musicSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingMusic(true);
      const res = await searchAppleMusic(musicSearchQuery, 14);
      setSearchResults(res);
      setIsSearchingMusic(false);
    }, 320);

    return () => clearTimeout(timer);
  }, [musicSearchQuery]);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      if (bgAudioRef.current) {
        bgAudioRef.current.pause();
        bgAudioRef.current.src = "";
      }
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
        setVideoUrl(null);
      }
      setSelectedFile(null);
      setDuration(null);
      setStep(1);
      setSelectedAppleTrack(null);
      setMusicSearchQuery("");
      setUploadProgress(null);
    }
  }, [isOpen]);

  // Synchronize Background Music with Video Play/Pause & Volume
  useEffect(() => {
    const audio = bgAudioRef.current;
    if (!audio) return;

    if (selectedAppleTrack?.previewUrl && step === 2 && isPlaying && !isMuted) {
      if (audio.src !== selectedAppleTrack.previewUrl) {
        audio.src = selectedAppleTrack.previewUrl;
        audio.load();
      }
      audio.volume = bgVolume / 100;
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [selectedAppleTrack, step, isPlaying, isMuted, bgVolume]);

  // Adjust video volume
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : origVolume / 100;
    }
  }, [origVolume, isMuted]);

  if (!isOpen) return null;

  // Handle file select
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { duration: dur } = await validateVideoFile(file);
      setSelectedFile(file);
      setDuration(Math.round(dur));
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setStep(2);
    } catch (err: any) {
      toast({
        title: "ভিডিওর দৈর্ঘ্যে সমস্যা",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
      if (bgAudioRef.current && selectedAppleTrack?.previewUrl) {
        bgAudioRef.current.play().catch(() => {});
      }
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      if (bgAudioRef.current) {
        bgAudioRef.current.pause();
      }
    }
  };

  // Submit and upload reel
  const handlePublish = async () => {
    if (!selectedFile) return;

    if (!name.trim()) {
      toast({
        title: "তোমার নাম লিখো",
        description: "রিলসে তোমার নাম থাকা আবশ্যক।",
        variant: "destructive",
      });
      setActiveTab("details");
      return;
    }

    if (!dept.trim()) {
      toast({
        title: "ডিপার্টমেন্ট নির্বাচন করো",
        variant: "destructive",
      });
      setActiveTab("details");
      return;
    }

    localStorage.setItem("ju_stream_name", name);
    localStorage.setItem("ju_stream_dept", dept);

    setUploading(true);

    try {
      // Build metadata tags
      let meta = `flt:${selectedFilter}|ov:${origVolume}|bv:${bgVolume}`;
      if (selectedAppleTrack) {
        const safeTitle = encodeURIComponent(selectedAppleTrack.title.slice(0, 40));
        const safeArtist = encodeURIComponent(selectedAppleTrack.artist.slice(0, 30));
        const safeArt = encodeURIComponent(selectedAppleTrack.artwork);
        const safePurl = encodeURIComponent(selectedAppleTrack.previewUrl);
        meta += `|aud:itunes|tt:${safeTitle}|ta:${safeArtist}|tar:${safeArt}|tp:${safePurl}`;
      } else {
        meta += `|aud:original`;
      }

      const metaTag = `[REEL:file_temp|${meta}]`;
      const baseCaption = caption.trim()
        ? `${name} (${dept}): ${caption.trim()}`
        : `${name} (${dept})`;
      const fullCaption = `${metaTag} ${baseCaption}`;

      // Upload to Telegram Bot
      const res = await uploadVideoToTelegram(
        selectedFile,
        fullCaption,
        (progress) => setUploadProgress(progress)
      );

      // Save to Supabase with persistent fileId in tag
      const finalCaption = res.fileId
        ? `[REEL:${res.fileId}|${meta}] ${baseCaption}`
        : fullCaption;

      const { data, error } = await supabase
        .from("gallery_photos")
        .insert({
          url: res.url,
          caption: finalCaption,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "🎉 রিলস ড্রপ সফল হয়েছে!",
        description:
          "ফিল্টার ও ব্যাকগ্রাউন্ড মিউজিকসহ তোমার রিলসটি এখন সরাসরি ফিডে বাজছে!",
      });

      if (bgAudioRef.current) {
        bgAudioRef.current.pause();
      }
      onSuccess(data?.id);
      onClose();
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Background Audio Player for Previewing Apple Music Track */}
      <audio ref={bgAudioRef} loop />

      <div className="relative w-full max-w-lg h-[100dvh] sm:h-[92vh] sm:max-h-[850px] bg-zinc-950 sm:rounded-3xl border border-white/10 flex flex-col overflow-hidden text-white shadow-2xl">
        {/* Top Header */}
        <header className="px-4 py-3.5 border-b border-white/10 flex items-center justify-between bg-zinc-900/60 backdrop-blur-md z-20">
          <div className="flex items-center gap-2">
            {step === 2 && !uploading && (
              <button
                onClick={() => setStep(1)}
                className="p-1 -ml-1 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                title="ফিরে যান"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-1.5 font-bold tracking-tight text-sm sm:text-base">
              <span className="text-amber-400 flex items-center">
                <Sparkles className="w-4 h-4 mr-1 text-amber-400 animate-pulse" />
                JU Reels
              </span>
              <span className="text-white">Studio</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {step === 2 && !uploading && (
              <Button
                size="sm"
                onClick={handlePublish}
                className="bg-gradient-to-r from-amber-500 via-rose-600 to-pink-600 hover:from-amber-400 hover:to-pink-500 text-white font-semibold text-xs px-3.5 rounded-full shadow-lg shadow-amber-600/30 gap-1"
              >
                <span>শেয়ার করো</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
            <button
              onClick={onClose}
              disabled={uploading}
              className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* STEP 1: PICK VIDEO */}
        {step === 1 && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-500/30 flex items-center justify-center mb-6 text-amber-400 shadow-xl shadow-amber-500/10">
              <Video className="w-10 h-10 animate-bounce" />
            </div>

            <h2 className="text-xl font-bold mb-2">
              তোমার ব্যাচ-ডে রিলস ড্রপ করো
            </h2>
            <p className="text-xs text-zinc-400 max-w-xs mb-8 leading-relaxed">
              সর্বোচ্চ ৪৫ সেকেন্ডের ভিডিও সিলেক্ট করো। সিনেমাটিক ফিল্টার ও
              ট্রেন্ডিং ব্যাকগ্রাউন্ড মিউজিক যুক্ত করতে পারবে!
            </p>

            <label className="cursor-pointer group">
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-600 to-pink-600 text-white font-bold text-sm shadow-xl shadow-amber-600/30 group-hover:scale-105 active:scale-95 transition-all">
                <Upload className="w-4 h-4" />
                <span>ভিডিও বেছে নাও</span>
              </div>
            </label>

            <div className="mt-8 grid grid-cols-2 gap-3 text-left max-w-xs w-full text-[11px] text-zinc-400">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-amber-400 font-bold block mb-0.5">
                  ✨ লাইভ ফিল্টার
                </span>
                Golden Hour, Vintage ও 700 Acres
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-pink-400 font-bold block mb-0.5">
                  🎵 ট্রেন্ডিং মিউজিক
                </span>
                শিরোনামহীন, অরিজিৎ ও যেকোনো গান
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CREATIVE STUDIO (PREVIEW + FILTERS + AUDIO) */}
        {step === 2 && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Live Video Preview Window */}
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
              {videoUrl && (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  loop
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain transition-all duration-300"
                  style={{
                    filter: getFilterCss(selectedFilter),
                  }}
                  onClick={handleTogglePlay}
                  onTimeUpdate={() => {
                    const v = videoRef.current;
                    const a = bgAudioRef.current;
                    if (!v || !a) return;
                    if (v.currentTime < lastTimeRef.current - 1.0) {
                      a.currentTime = 0;
                      if (isPlaying && !isMuted) a.play().catch(() => {});
                    }
                    lastTimeRef.current = v.currentTime;
                  }}
                />
              )}

              {/* Tap to Play / Pause Overlay */}
              <button
                onClick={handleTogglePlay}
                className={`absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity ${
                  isPlaying ? "opacity-0 hover:opacity-100" : "opacity-100"
                }`}
              >
                <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6 ml-1" />
                  )}
                </div>
              </button>

              {/* Floating Badges (Filter & Apple Music info) */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none z-10">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] text-white font-medium">
                  <span>✨</span>
                  <span>
                    {REEL_FILTERS.find((f) => f.id === selectedFilter)?.name}
                  </span>
                </div>
                {selectedAppleTrack && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-rose-600 backdrop-blur-md text-[11px] text-white font-medium shadow-md">
                    <img
                      src={selectedAppleTrack.artwork}
                      alt=""
                      className="w-3.5 h-3.5 rounded-full animate-spin"
                    />
                    <span className="truncate max-w-[140px]">
                      {selectedAppleTrack.title} • {selectedAppleTrack.artist}
                    </span>
                  </div>
                )}
              </div>

              {/* Duration Badge & Mute Toggle */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                {duration && (
                  <span className="px-2 py-0.5 rounded-full bg-black/60 text-[10px] text-zinc-300 border border-white/10">
                    {duration}s
                  </span>
                )}
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1.5 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/10 hover:bg-black/80"
                >
                  {isMuted ? (
                    <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Upload Progress Overlay */}
              {uploading && uploadProgress && (
                <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
                  <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin mb-4" />
                  <p className="text-base font-bold mb-1">
                    {uploadProgress.message}
                  </p>
                  <p className="text-xs text-zinc-400 mb-4">
                    ভিডিও এনকোডিং ও ঢাকা এজ সিডিএন-এ প্রসেস হচ্ছে...
                  </p>
                  <div className="w-56 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-300"
                      style={{ width: `${uploadProgress.percent}%` }}
                    />
                  </div>
                  <span className="text-xs text-amber-400 font-bold mt-2">
                    {uploadProgress.percent}%
                  </span>
                </div>
              )}
            </div>

            {/* Bottom Controls Bar (Tabs: Filters / Audio / Details) */}
            <div className="bg-zinc-950 border-t border-white/10 p-3 flex flex-col">
              {/* Tab Selector Buttons */}
              <div className="flex items-center justify-around pb-2.5 border-b border-white/5 mb-2.5">
                <button
                  onClick={() => setActiveTab("filters")}
                  className={`flex items-center gap-1.5 text-xs font-semibold py-1 px-3 rounded-full transition-all ${
                    activeTab === "filters"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ফিল্টার ({REEL_FILTERS.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab("audio")}
                  className={`flex items-center gap-1.5 text-xs font-semibold py-1 px-3 rounded-full transition-all ${
                    activeTab === "audio"
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Music2 className="w-3.5 h-3.5" />
                  <span>মিউজিক ট্র্যাক</span>
                </button>

                <button
                  onClick={() => setActiveTab("details")}
                  className={`flex items-center gap-1.5 text-xs font-semibold py-1 px-3 rounded-full transition-all ${
                    activeTab === "details"
                      ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>ক্যাপশন ও নাম</span>
                </button>
              </div>

              {/* TAB 1: FILTERS CAROUSEL */}
              {activeTab === "filters" && (
                <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none py-1">
                  {REEL_FILTERS.map((f) => {
                    const isSelected = selectedFilter === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setSelectedFilter(f.id)}
                        className={`flex-shrink-0 flex flex-col items-center gap-1.5 group transition-transform ${
                          isSelected ? "scale-105" : "opacity-75 hover:opacity-100"
                        }`}
                      >
                        <div
                          className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${
                            f.previewBg
                          } p-0.5 flex items-center justify-center relative shadow-md transition-all ${
                            isSelected
                              ? "ring-2 ring-amber-500 ring-offset-2 ring-offset-zinc-950"
                              : "border border-white/10"
                          }`}
                        >
                          <span className="text-xl">{f.icon}</span>
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-black">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-medium leading-none ${
                            isSelected ? "text-amber-400 font-bold" : "text-zinc-400"
                          }`}
                        >
                          {f.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* TAB 2: APPLE MUSIC SEARCH & RECOMMENDATIONS */}
              {activeTab === "audio" && (
                <div className="flex flex-col gap-2.5 py-1 max-h-56 overflow-y-auto">
                  {/* Search Input Bar */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <Input
                      value={musicSearchQuery}
                      onChange={(e) => setMusicSearchQuery(e.target.value)}
                      placeholder="যেকোনো গান বা শিল্পী খুঁজুন (যেমন: শিরোনামহীন, অরিজিৎ...)"
                      className="h-8 pl-8 pr-7 text-xs bg-white/5 border-white/10 text-white placeholder:text-zinc-500 rounded-xl"
                    />
                    {isSearchingMusic ? (
                      <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2" />
                    ) : musicSearchQuery ? (
                      <button
                        onClick={() => setMusicSearchQuery("")}
                        className="text-zinc-400 hover:text-white absolute right-2.5 top-1/2 -translate-y-1/2"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    ) : null}
                  </div>

                  {/* Trending Quick Search Chips */}
                  {!musicSearchQuery && (
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      {TRENDING_SEARCH_TAGS.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setMusicSearchQuery(tag)}
                          className="flex-shrink-0 text-[10px] px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-300 transition-colors"
                        >
                          ♫ {tag}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Original Sound Only Option */}
                  <div
                    onClick={() => setSelectedAppleTrack(null)}
                    className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                      !selectedAppleTrack
                        ? "bg-amber-500/20 border border-amber-500/40 text-white"
                        : "bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-sm">
                        🎙️
                      </div>
                      <div>
                        <p className="text-xs font-bold leading-tight">
                          শুধু আসল ভিডিও সাউন্ড
                        </p>
                        <p className="text-[10px] text-zinc-400">
                          কোনো ব্যাকগ্রাউন্ড মিউজিক ছাড়া
                        </p>
                      </div>
                    </div>
                    {!selectedAppleTrack && (
                      <Check className="w-4 h-4 text-amber-400" />
                    )}
                  </div>

                  {/* Search Results OR Recommendations */}
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-1">
                      {musicSearchQuery
                        ? `খোঁজার ফলাফল (${searchResults.length})`
                        : "🔥 ট্রেন্ডিং ও ক্যাম্পাস ফেভারিট গান"}
                    </p>

                    {(musicSearchQuery ? searchResults : recommendations).map(
                      (track) => {
                        const isSelected = selectedAppleTrack?.id === track.id;
                        return (
                          <div
                            key={track.id}
                            onClick={() => setSelectedAppleTrack(track)}
                            className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                              isSelected
                                ? "bg-gradient-to-r from-amber-500/25 to-rose-500/25 border border-amber-500/40 text-white"
                                : "bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-300"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              <img
                                src={track.artwork}
                                alt=""
                                className="w-9 h-9 rounded-lg object-cover flex-shrink-0 shadow"
                              />
                              <div className="overflow-hidden">
                                <p className="text-xs font-bold text-white truncate leading-tight">
                                  {track.title}
                                </p>
                                <p className="text-[10px] text-zinc-400 truncate leading-tight">
                                  {track.artist} {track.tag && `• ${track.tag}`}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              {isSelected ? (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                                  <Check className="w-3 h-3" /> সিলেক্টেড
                                </span>
                              ) : (
                                <span className="text-[10px] text-zinc-400 hover:text-white bg-white/5 px-2 py-0.5 rounded-full">
                                  যোগ করো +
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>

                  {/* Dual Volume Balance Sliders */}
                  <div className="grid grid-cols-2 gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 mt-1">
                    <div>
                      <div className="flex justify-between text-[11px] text-zinc-300 mb-1">
                        <span>🎙️ ভিডিওর সাউন্ড</span>
                        <span className="text-zinc-400">{origVolume}%</span>
                      </div>
                      <Slider
                        value={[origVolume]}
                        max={100}
                        step={5}
                        onValueChange={(val) => setOrigVolume(val[0])}
                        className="py-1"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-zinc-300 mb-1">
                        <span>🎵 ব্যাকগ্রাউন্ড মিউজিক ভলিউম</span>
                        <span className="text-zinc-400">{bgVolume}%</span>
                      </div>
                      <Slider
                        value={[bgVolume]}
                        max={100}
                        step={5}
                        disabled={!selectedAppleTrack}
                        onValueChange={(val) => setBgVolume(val[0])}
                        className="py-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: DETAILS FORM (CLEAN: NAME, DEPT, CAPTION ONLY) */}
              {activeTab === "details" && (
                <div className="flex flex-col gap-2.5 max-h-56 overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-zinc-400 mb-1 block">
                        তোমার নাম *
                      </label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="নাম লিখো..."
                        className="h-8 text-xs bg-white/5 border-white/10 text-white placeholder:text-zinc-600"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-400 mb-1 block">
                        ডিপার্টমেন্ট *
                      </label>
                      <select
                        value={dept}
                        onChange={(e) => setDept(e.target.value)}
                        className="w-full h-8 px-2 text-xs rounded-md bg-zinc-900 border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="">নির্বাচন করো</option>
                        {departments.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-400 mb-1 block">
                      ক্যাপশন
                    </label>
                    <Input
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="মজার স্মৃতি বা কথা লিখো..."
                      className="h-8 text-xs bg-white/5 border-white/10 text-white placeholder:text-zinc-600"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
