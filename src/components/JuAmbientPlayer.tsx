import React, { useState, useEffect } from "react";
import { Headphones, Volume2, VolumeX, X, Play, Square, Sparkles } from "lucide-react";
import { juAmbientEngine, type AmbientTrack } from "@/utils/juAmbientAudio";
import { Slider } from "@/components/ui/slider";

interface TrackOption {
  id: AmbientTrack;
  title: string;
  subtitle: string;
  emoji: string;
}

const TRACKS: TrackOption[] = [
  { id: "rain", title: "মুক্তমঞ্চে বৃষ্টি", subtitle: "ঝুম বৃষ্টি ও স্নিগ্ধ শীতলতা", emoji: "🌧️" },
  { id: "birds", title: "লেক ও অতিথি পাখি", subtitle: "শীতের ভোরের কলকাকলি", emoji: "🪶" },
  { id: "tea", title: "বটতলার আড্ডা", subtitle: "চায়ের টুংটাং ও প্রিয় বন্ধু", emoji: "☕" },
  { id: "night", title: "ট্রান্সপোর্টের গিটার", subtitle: "রাতজাগা ক্যাম্পাসের সুর", emoji: "🎸" },
  { id: "wind", title: "৭০০ একরের বাতাস", subtitle: "সবুজ অরণ্যের নির্মল হাওয়া", emoji: "🍃" },
];

export default function JuAmbientPlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<AmbientTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(60);

  const handleToggleTrack = (track: AmbientTrack) => {
    if (isPlaying && currentTrack === track) {
      juAmbientEngine.stop();
      setIsPlaying(false);
      setCurrentTrack(null);
    } else {
      juAmbientEngine.play(track);
      setIsPlaying(true);
      setCurrentTrack(track);
    }
  };

  const handleStop = () => {
    juAmbientEngine.stop();
    setIsPlaying(false);
    setCurrentTrack(null);
  };

  const handleVolumeChange = (vals: number[]) => {
    const val = vals[0] ?? 60;
    setVolume(val);
    juAmbientEngine.setVolume(val / 100);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      juAmbientEngine.stop();
    };
  }, []);

  return (
    <>
      {/* Floating launcher button in bottom right corner */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
        {isPlaying && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-md border border-primary/20 shadow-lg animate-pulse">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
            <span className="text-xs font-medium text-foreground">
              {TRACKS.find((t) => t.id === currentTrack)?.title}
            </span>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="ক্যাম্পাসের সুর শুনুন"
          className={`group relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-2xl transition-all duration-300 ${
            isPlaying
              ? "bg-gradient-to-tr from-primary to-rose-600 text-white ring-4 ring-primary/30 scale-105"
              : "bg-card/90 backdrop-blur-md text-foreground border border-border/80 hover:border-primary/50 hover:scale-105"
          }`}
        >
          <Headphones className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform ${isPlaying ? "animate-bounce" : "group-hover:rotate-12"}`} />
          {isPlaying && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
            </span>
          )}
        </button>
      </div>

      {/* Floating Modal / Popout Card */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 rounded-2xl bg-card/95 backdrop-blur-xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-foreground">৭০০ একরের সুর</h4>
                <p className="text-[11px] text-muted-foreground">ক্যাম্পাসের নস্টালজিক সাউন্ডস্কেপ</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Track List */}
          <div className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
            {TRACKS.map((t) => {
              const active = isPlaying && currentTrack === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleToggleTrack(t.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                    active
                      ? "bg-primary/15 border border-primary/30 text-primary shadow-sm"
                      : "hover:bg-muted/60 border border-transparent text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{t.emoji}</span>
                    <div>
                      <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                        {t.title}
                        {active && (
                          <span className="flex items-center gap-0.5">
                            <span className="w-1 h-2.5 bg-primary rounded-full animate-pulse" />
                            <span className="w-1 h-3.5 bg-primary rounded-full animate-pulse delay-75" />
                            <span className="w-1 h-2 bg-primary rounded-full animate-pulse delay-150" />
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{t.subtitle}</div>
                    </div>
                  </div>

                  <div className="p-1.5 rounded-full bg-muted/40">
                    {active ? (
                      <Square className="w-3.5 h-3.5 text-primary fill-primary" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-muted-foreground fill-muted-foreground" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Volume Control & Status Footer */}
          <div className="p-3 bg-muted/30 border-t border-border flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                {volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                ভলিউম
              </span>
              <span className="text-[11px] font-mono">{volume}%</span>
            </div>
            <Slider
              value={[volume]}
              min={0}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              className="cursor-pointer"
            />

            {isPlaying && (
              <button
                onClick={handleStop}
                className="mt-1 w-full py-1.5 rounded-lg text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors"
              >
                সাউন্ড বন্ধ করুন
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
