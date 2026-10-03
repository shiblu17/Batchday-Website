import React, { useState, useEffect, useRef } from "react";
import { Zap, Flame, Heart, Sparkles, Music, Maximize2, Minimize2, Users, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface FlyingParticle {
  id: number;
  emoji: string;
  x: number;
  scale: number;
}

const REACTIONS = [
  { type: "heart", emoji: "❤️", label: "লাভ", color: "from-rose-500 to-pink-600" },
  { type: "fire", emoji: "🔥", label: "আগুন", color: "from-amber-500 to-orange-600" },
  { type: "clap", emoji: "👏", label: "তালি", color: "from-emerald-500 to-teal-600" },
  { type: "rock", emoji: "🎸", label: "রক অন", color: "from-purple-500 to-indigo-600" },
  { type: "energy", emoji: "⚡", label: "হাইপ", color: "from-yellow-400 to-amber-500" },
];

export default function StagePulse() {
  const [isProjectorMode, setIsProjectorMode] = useState(false);
  const [counts, setCounts] = useState<{ [key: string]: number }>({
    heart: 1420,
    fire: 1850,
    clap: 960,
    rock: 2130,
    energy: 1680,
  });
  const [totalCheers, setTotalCheers] = useState(8040);
  const [particles, setParticles] = useState<FlyingParticle[]>([]);
  const [userCombo, setUserCombo] = useState(0);
  const comboTimerRef = useRef<number | null>(null);

  // Set up Supabase Realtime Channel
  useEffect(() => {
    const channel = supabase.channel("ju52_stage_pulse", {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "cheer" }, ({ payload }) => {
        if (payload?.type && payload?.emoji) {
          triggerReactionDisplay(payload.type, payload.emoji, false);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const triggerReactionDisplay = (type: string, emoji: string, isSelf: boolean) => {
    setCounts((prev) => ({
      ...prev,
      [type]: (prev[type] || 0) + 1,
    }));
    setTotalCheers((prev) => prev + 1);

    // Spawn 1-2 floating flying particles
    const newParticles: FlyingParticle[] = [];
    const count = isSelf ? 2 : 1;
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: Math.random(),
        emoji,
        x: 10 + Math.random() * 80,
        scale: 0.8 + Math.random() * 0.8,
      });
    }

    setParticles((prev) => [...prev.slice(-30), ...newParticles]);

    // Clean up particles
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
    }, 2500);
  };

  const handleTapReaction = (type: string, emoji: string) => {
    // 1. Local animation
    triggerReactionDisplay(type, emoji, true);

    // 2. Combo tracker
    setUserCombo((c) => c + 1);
    if (comboTimerRef.current) window.clearTimeout(comboTimerRef.current);
    comboTimerRef.current = window.setTimeout(() => setUserCombo(0), 1800);

    // 3. Vibration API for mobile devices
    if ("vibrate" in navigator) {
      navigator.vibrate(25);
    }

    // 4. Broadcast to everyone (Projector screen) via Supabase Realtime
    try {
      supabase.channel("ju52_stage_pulse").send({
        type: "broadcast",
        event: "cheer",
        payload: { type, emoji },
      });
    } catch {
      // Broadcast fail-soft
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsProjectorMode(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsProjectorMode(false);
    }
  };

  return (
    <div
      className={`relative min-h-screen transition-colors duration-500 overflow-hidden select-none ${
        isProjectorMode ? "bg-black text-white p-4" : "bg-background text-foreground pt-20 pb-16 px-4"
      }`}
    >
      {/* Floating Animated Particles */}
      <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
        {particles.map((p) => (
          <span
            key={p.id}
            style={{
              left: `${p.x}%`,
              transform: `scale(${p.scale})`,
            }}
            className="absolute bottom-10 text-4xl sm:text-6xl animate-bounce [animation-duration:2.5s] opacity-90 transition-all pointer-events-none"
          >
            {p.emoji}
          </span>
        ))}
      </div>

      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              মুক্তমঞ্চ লাইভ পালস
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="gap-2 text-xs"
          >
            {isProjectorMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            {isProjectorMode ? "নরমাল মোড" : "প্রজেক্টর মোড (Fullscreen)"}
          </Button>
        </div>

        {/* Central Pulse Display on Stage */}
        <div className="text-center py-6 sm:py-10 space-y-4">
          <div className="relative inline-flex items-center justify-center">
            {/* Glowing neon halo */}
            <div className="absolute w-44 h-44 sm:w-60 sm:h-60 rounded-full bg-primary/20 blur-3xl animate-pulse" />

            {/* Giant Neon Badge */}
            <div className="relative flex flex-col items-center justify-center w-36 h-36 sm:w-48 sm:h-48 rounded-full bg-gradient-to-br from-primary via-rose-700 to-amber-600 shadow-2xl shadow-primary/50 border-4 border-white/20 transition-transform hover:scale-105 active:scale-95">
              <span className="font-display font-black text-3xl sm:text-5xl text-white tracking-widest drop-shadow-md">
                JU 52
              </span>
              <span className="text-[11px] sm:text-xs font-bold text-white/90 uppercase tracking-widest mt-1">
                STAGE PULSE
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-3xl sm:text-5xl font-black font-mono tracking-tight text-primary">
              {totalCheers.toLocaleString("bn-BD")}
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">
              সর্বমোট লাইভ চিয়ার ও রিঅ্যাকশন
            </p>
          </div>

          {/* User Combo Banner on Mobile */}
          {userCombo > 2 && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white font-black text-sm shadow-lg animate-bounce">
              <Zap className="w-4 h-4 fill-white" />
              <span>{userCombo}X হাইপ কম্বো! 🔥</span>
            </div>
          )}
        </div>

        {/* Real-time Counter Stats */}
        <div className="grid grid-cols-5 gap-2 sm:gap-4">
          {REACTIONS.map((r) => (
            <div
              key={r.type}
              className="flex flex-col items-center justify-center p-2.5 sm:p-4 rounded-2xl bg-card/80 border border-border shadow-sm text-center"
            >
              <span className="text-xl sm:text-3xl">{r.emoji}</span>
              <span className="text-xs sm:text-base font-bold font-mono text-foreground mt-1">
                {counts[r.type]?.toLocaleString("bn-BD") || 0}
              </span>
              <span className="text-[10px] text-muted-foreground hidden sm:inline">
                {r.label}
              </span>
            </div>
          ))}
        </div>

        {/* Audience Mobile Tapping Pad */}
        <div className="space-y-3 pt-4">
          <div className="text-center text-xs font-semibold text-muted-foreground">
            আপনার ফোন থেকে ট্যাপ করে মঞ্চে শক্তি পাঠান! 👇
          </div>

          <div className="grid grid-cols-5 gap-2 sm:gap-4">
            {REACTIONS.map((r) => (
              <button
                key={r.type}
                onClick={() => handleTapReaction(r.type, r.emoji)}
                className={`relative flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br ${r.color} text-white shadow-lg active:scale-90 active:shadow-inner hover:scale-105 transition-all duration-150 cursor-pointer`}
              >
                <span className="text-3xl sm:text-4xl">{r.emoji}</span>
                <span className="text-[11px] sm:text-xs font-bold mt-1 tracking-tight">
                  {r.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
