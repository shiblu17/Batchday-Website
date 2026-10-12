import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Trophy,
  Gamepad2,
  Compass,
  BookOpen,
  Hourglass,
  Zap,
  MessageCircleHeart,
  UserCheck,
  Image as ImageIcon,
  Sparkles,
  LayoutGrid,
  X,
  Video,
} from "lucide-react";

interface RadialItem {
  to: string;
  label: string;
  icon: React.ElementType;
  lightBg: string;
  lightText: string;
  darkBg: string;
  darkText: string;
  isLive?: boolean;
}

const RADIAL_ITEMS: RadialItem[] = [
  {
    to: "/stream",
    label: "লাইভ স্ট্রিম",
    icon: Video,
    lightBg: "bg-[#FFD1DC]",
    lightText: "text-[#be123c]",
    darkBg: "dark:bg-rose-950/90",
    darkText: "dark:text-rose-300",
    isLive: true,
  },
  {
    to: "/slambook",
    label: "স্ল্যাম বুক",
    icon: BookOpen,
    lightBg: "bg-[#E1FFB5]",
    lightText: "text-[#365314]",
    darkBg: "dark:bg-emerald-950/90",
    darkText: "dark:text-emerald-300",
  },
  {
    to: "/time-capsule",
    label: "টাইম ক্যাপসুল",
    icon: Hourglass,
    lightBg: "bg-[#FFD66B]",
    lightText: "text-[#92400e]",
    darkBg: "dark:bg-amber-950/90",
    darkText: "dark:text-amber-300",
  },
  {
    to: "/stage-pulse",
    label: "লাইভ পালস",
    icon: Zap,
    lightBg: "bg-[#FFC2C2]",
    lightText: "text-[#9f1239]",
    darkBg: "dark:bg-rose-950/90",
    darkText: "dark:text-rose-300",
    isLive: true,
  },
  {
    to: "/confessions",
    label: "কনফেশন",
    icon: MessageCircleHeart,
    lightBg: "bg-[#E6E3FF]",
    lightText: "text-[#581c87]",
    darkBg: "dark:bg-purple-950/90",
    darkText: "dark:text-purple-300",
  },
  {
    to: "/status",
    label: "স্ট্যাটাস ও পাস",
    icon: UserCheck,
    lightBg: "bg-[#EEF0FF]",
    lightText: "text-[#3730a3]",
    darkBg: "dark:bg-indigo-950/90",
    darkText: "dark:text-indigo-300",
  },
  {
    to: "/gallery",
    label: "গ্যালারি",
    icon: ImageIcon,
    lightBg: "bg-[#FFE4E6]",
    lightText: "text-[#881337]",
    darkBg: "dark:bg-pink-950/90",
    darkText: "dark:text-pink-300",
  },
  {
    to: "/register",
    label: "রেজিস্ট্রেশন",
    icon: Sparkles,
    lightBg: "bg-[#FEF3C7]",
    lightText: "text-[#78350f]",
    darkBg: "dark:bg-yellow-950/90",
    darkText: "dark:text-yellow-300",
  },
];

export default function MobileBottomNav() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();


  // Close radial menu automatically on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Handle ESC key and body scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleNavigate = (e: React.MouseEvent, to: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
    navigate(to);
  };

  const isHome = location.pathname === "/";
  const isStream = location.pathname === "/stream" || location.pathname === "/campus-map";
  const isLeaderboard = location.pathname === "/leaderboard";
  const isGame = location.pathname.startsWith("/game");

  return (
    <>
      {/* ===== BOTTOM NAVIGATION BAR ===== */}
      <nav
        aria-label="মোবাইল নেভিগেশন মেনু"
        className="md:hidden fixed left-0 right-0 bottom-0 z-50 pointer-events-auto select-none"
        style={{
          filter: "drop-shadow(0 -4px 16px rgba(0, 0, 0, 0.14))",
        }}
      >
        <div
          className="relative grid grid-cols-[1fr_1fr_88px_1fr_1fr] items-center bg-card/95 dark:bg-[#181824]/95 backdrop-blur-xl border-t border-border/40 transition-colors"
          style={{
            height: "calc(72px + env(safe-area-inset-bottom, 0px))",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
            borderTopLeftRadius: "24px",
            borderTopRightRadius: "24px",
            WebkitMask:
              "radial-gradient(circle 46px at 50% 0px, transparent 96%, #000 100%)",
            mask: "radial-gradient(circle 46px at 50% 0px, transparent 96%, #000 100%)",
          }}
        >
          {/* 1. হোম */}
          <Link
            to="/"
            aria-current={isHome ? "page" : undefined}
            className={`flex flex-col items-center justify-center gap-1 min-h-[56px] text-xs font-semibold transition-colors ${
              isHome
                ? "text-primary dark:text-rose-400 font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Home className="w-5 h-5 transition-transform active:scale-90" />
            <span className="text-[11px] leading-tight font-display">হোম</span>
          </Link>

          {/* 2. লাইভ স্ট্রিম */}
          <Link
            to="/stream"
            aria-current={isStream ? "page" : undefined}
            className={`flex flex-col items-center justify-center gap-1 min-h-[56px] text-xs font-semibold transition-colors ${
              isStream
                ? "text-primary dark:text-rose-400 font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Video className="w-5 h-5 transition-transform active:scale-90" />
            <span className="text-[11px] leading-tight font-display">স্ট্রিম</span>
          </Link>

          {/* 3. Center Slot (Reserved for Notch) */}
          <div aria-hidden="true" className="w-[88px]" />

          {/* 4. লিডারবোর্ড */}
          <Link
            to="/leaderboard"
            aria-current={isLeaderboard ? "page" : undefined}
            className={`flex flex-col items-center justify-center gap-1 min-h-[56px] text-xs font-semibold transition-colors ${
              isLeaderboard
                ? "text-primary dark:text-rose-400 font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Trophy className="w-5 h-5 transition-transform active:scale-90" />
            <span className="text-[11px] leading-tight font-display">লিডারবোর্ড</span>
          </Link>

          {/* 5. গেম জোন */}
          <Link
            to="/game"
            aria-current={isGame ? "page" : undefined}
            className={`flex flex-col items-center justify-center gap-1 min-h-[56px] text-xs font-semibold transition-colors ${
              isGame
                ? "text-primary dark:text-rose-400 font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Gamepad2 className="w-5 h-5 transition-transform active:scale-90" />
            <span className="text-[11px] leading-tight font-display">গেম জোন</span>
          </Link>
        </div>

        {/* Floating Center Action Button (FAB) */}
        <div className="absolute left-1/2 -top-[28px] -translate-x-1/2 z-50">
          {/* Subtle Ambient Pulse Ring */}
          <span className="absolute inset-0 rounded-full bg-primary/30 dark:bg-primary/50 animate-ping [animation-duration:2.5s] -z-10 pointer-events-none" />

          <motion.button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "মেনু বন্ধ করুন" : "সব ফিচার মেনু খুলুন"}
            aria-expanded={isOpen}
            whileTap={{ scale: 0.92 }}
            className={`relative flex items-center justify-center w-16 h-16 rounded-full border-[5px] border-background dark:border-[#0f0f17] shadow-xl text-white transition-all cursor-pointer ${
              isOpen
                ? "bg-gradient-to-tr from-rose-600 to-red-500 shadow-rose-600/40"
                : "bg-gradient-to-tr from-primary via-[#8A1538] to-[#500000] shadow-primary/40"
            }`}
          >
            <motion.div
              animate={{ rotate: isOpen ? 90 : 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
            >
              {isOpen ? (
                <X className="w-7 h-7 stroke-[2.5]" />
              ) : (
                <LayoutGrid className="w-7 h-7 stroke-[2.2]" />
              )}
            </motion.div>
          </motion.button>
        </div>
      </nav>

      {/* ===== RADIAL OVERLAY MENU ===== */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-[100] flex items-center justify-center select-none"
          role="dialog"
          aria-modal="true"
          aria-label="সকল ফিচার ও শর্টকাট মেনু"
        >
          {/* Backdrop Blur - tap to close */}
          <div
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          />

          {/* Circular Wheel Dial with Entrance Animation */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0, y: 60 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 26 }}
            className="relative rounded-full aspect-square bg-card dark:bg-[#181826] border border-border/80 dark:border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.4)] flex items-center justify-center pointer-events-auto"
            style={{
              width: "min(360px, 92vw)",
              height: "min(360px, 92vw)",
            }}
          >
              {/* Outer decorative dotted boundary */}
              <div className="absolute inset-4 rounded-full border border-dashed border-primary/25 dark:border-primary/35 pointer-events-none" />

              {/* Radial Items Positioned with Exact Centered Math */}
              {RADIAL_ITEMS.map((item, index) => {
                const total = RADIAL_ITEMS.length;
                const angleDeg = -90 + (360 / total) * index;
                const angleRad = (angleDeg * Math.PI) / 180;
                // Exact radial distance in pixels (fits evenly within 360px diameter)
                const distance = 118;
                const targetX = Math.round(Math.cos(angleRad) * distance);
                const targetY = Math.round(Math.sin(angleRad) * distance);

                const itemSize = 64; // px
                const halfSize = itemSize / 2; // 32px

                const Icon = item.icon;
                const isActive = location.pathname === item.to;

                return (
                  <motion.div
                    key={item.to}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 360,
                      damping: 24,
                      delay: 0.02 * index,
                    }}
                    style={{
                      position: "absolute",
                      left: `calc(50% + ${targetX}px - ${halfSize}px)`,
                      top: `calc(50% + ${targetY}px - ${halfSize}px)`,
                      width: `${itemSize}px`,
                      height: `${itemSize}px`,
                    }}
                  >
                    <button
                      type="button"
                      onClick={(e) => handleNavigate(e, item.to)}
                      className={`group relative flex flex-col items-center justify-center w-full h-full rounded-full transition-all duration-200 active:scale-90 shadow-md cursor-pointer ${
                        item.lightBg
                      } ${item.lightText} ${item.darkBg} ${item.darkText} ${
                        isActive
                          ? "ring-3 ring-primary ring-offset-2 dark:ring-offset-background font-bold scale-105"
                          : "hover:scale-105"
                      }`}
                    >
                      {/* Live Indicator Dot */}
                      {item.isLive && (
                        <span className="absolute top-1.5 right-2 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                      )}

                      <Icon className="w-5 h-5 mb-0.5 transition-transform group-hover:scale-110" />
                      <span className="text-[10px] font-bold text-center leading-tight tracking-tight px-1 font-display">
                        {item.label}
                      </span>
                    </button>
                  </motion.div>
                );
              })}

              {/* Center Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="relative z-20 flex flex-col items-center justify-center w-16 h-16 rounded-full bg-primary text-white shadow-xl shadow-primary/40 cursor-pointer border-2 border-white/20 active:scale-90 hover:bg-primary/90 transition-all"
                aria-label="মেনু বন্ধ করুন"
              >
                <X className="w-6 h-6 stroke-[2.5]" />
                <span className="text-[9px] font-bold tracking-wider uppercase font-display mt-0.5">
                  JU-52
                </span>
              </button>
            </motion.div>
          </div>
        )}
    </>
  );
}
