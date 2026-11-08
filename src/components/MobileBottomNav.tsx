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
  Shirt,
  Smartphone,
  Download,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
    lightBg: "bg-card hover:bg-muted/80 border border-border/80 shadow-sm",
    lightText: "text-rose-600 font-semibold",
    darkBg: "dark:bg-[#1a1c24] dark:border-white/10 dark:hover:bg-[#222530]",
    darkText: "dark:text-rose-400",
    isLive: true,
  },
  {
    to: "/jersey",
    label: "ডিজিটাল জার্সি",
    icon: Shirt,
    lightBg: "bg-card hover:bg-muted/80 border border-border/80 shadow-sm",
    lightText: "text-emerald-700 font-semibold",
    darkBg: "dark:bg-[#1a1c24] dark:border-white/10 dark:hover:bg-[#222530]",
    darkText: "dark:text-emerald-400",
  },
  {
    to: "/memories",
    label: "ভাইবস ও স্মৃতি",
    icon: Compass,
    lightBg: "bg-card hover:bg-muted/80 border border-border/80 shadow-sm",
    lightText: "text-teal-700 font-semibold",
    darkBg: "dark:bg-[#1a1c24] dark:border-white/10 dark:hover:bg-[#222530]",
    darkText: "dark:text-teal-400",
  },
  {
    to: "/time-capsule",
    label: "টাইম ক্যাপসুল",
    icon: Hourglass,
    lightBg: "bg-card hover:bg-muted/80 border border-border/80 shadow-sm",
    lightText: "text-amber-700 font-semibold",
    darkBg: "dark:bg-[#1a1c24] dark:border-white/10 dark:hover:bg-[#222530]",
    darkText: "dark:text-amber-400",
  },
  {
    to: "/stage-pulse",
    label: "লাইভ পালস",
    icon: Zap,
    lightBg: "bg-card hover:bg-muted/80 border border-border/80 shadow-sm",
    lightText: "text-rose-600 font-semibold",
    darkBg: "dark:bg-[#1a1c24] dark:border-white/10 dark:hover:bg-[#222530]",
    darkText: "dark:text-rose-400",
    isLive: true,
  },
  {
    to: "/leaderboard",
    label: "লিডারবোর্ড",
    icon: Trophy,
    lightBg: "bg-card hover:bg-muted/80 border border-border/80 shadow-sm",
    lightText: "text-amber-600 font-semibold",
    darkBg: "dark:bg-[#1a1c24] dark:border-white/10 dark:hover:bg-[#222530]",
    darkText: "dark:text-amber-400",
  },
  {
    to: "/status",
    label: "স্ট্যাটাস ও পাস",
    icon: UserCheck,
    lightBg: "bg-card hover:bg-muted/80 border border-border/80 shadow-sm",
    lightText: "text-indigo-700 font-semibold",
    darkBg: "dark:bg-[#1a1c24] dark:border-white/10 dark:hover:bg-[#222530]",
    darkText: "dark:text-indigo-400",
  },
  {
    to: "/gallery",
    label: "গ্যালারি",
    icon: ImageIcon,
    lightBg: "bg-card hover:bg-muted/80 border border-border/80 shadow-sm",
    lightText: "text-pink-700 font-semibold",
    darkBg: "dark:bg-[#1a1c24] dark:border-white/10 dark:hover:bg-[#222530]",
    darkText: "dark:text-pink-400",
  },
  {
    to: "/register",
    label: "রেজিস্ট্রেশন",
    icon: Sparkles,
    lightBg: "bg-card hover:bg-muted/80 border border-border/80 shadow-sm",
    lightText: "text-primary font-semibold",
    darkBg: "dark:bg-[#1a1c24] dark:border-white/10 dark:hover:bg-[#222530]",
    darkText: "dark:text-primary",
  },
];

export default function MobileBottomNav() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // PWA Installation State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isRunningStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone ||
      Boolean((window as any).__pwaInstalled);
    setIsStandalone(Boolean(isRunningStandalone));

    // Check if iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Detect if inside in-app browser (Facebook, Messenger, Instagram)
    const inApp =
      userAgent.includes("fban") ||
      userAgent.includes("fbav") ||
      userAgent.includes("instagram") ||
      userAgent.includes("messenger") ||
      userAgent.includes("fb_iab");
    setIsInAppBrowser(inApp);

    // 1. Check if early prompt was already captured by index.html
    if ((window as any).__deferredPwaPrompt) {
      setDeferredPrompt((window as any).__deferredPwaPrompt);
    }

    // 2. Listen for custom event when early prompt is ready
    const handlePromptReady = () => {
      if ((window as any).__deferredPwaPrompt) {
        setDeferredPrompt((window as any).__deferredPwaPrompt);
      }
    };
    window.addEventListener("pwa-prompt-ready", handlePromptReady);

    // 3. Listen for PWA install prompt in case it fires later
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      (window as any).__deferredPwaPrompt = e;
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("pwa-prompt-ready", handlePromptReady);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    // Check if running in standalone mode (already installed)
    const isRunningStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone ||
      Boolean((window as any).__pwaInstalled);

    if (isRunningStandalone) {
      toast({
        title: "ইতিমধ্যে ইনস্টল করা আছে! ✨",
        description: "JU 52 অ্যাপটি আপনার ফোনে সক্রিয়ভাবে ইনস্টল রয়েছে।",
      });
      return;
    }

    // iOS users guide
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    // In-app browsers (Facebook, Messenger) block native install prompt
    if (isInAppBrowser) {
      setShowGuideModal(true);
      return;
    }

    const promptEvent = deferredPrompt || (window as any).__deferredPwaPrompt;

    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === "accepted") {
          toast({
            title: "ইনস্টল সম্পন্ন হচ্ছে! 🎉",
            description: "JU 52 অ্যাপটি আপনার হোমস্ক্রিনে যুক্ত হয়ে গেছে।",
          });
          setDeferredPrompt(null);
          (window as any).__deferredPwaPrompt = null;
          (window as any).__pwaInstalled = true;
          setIsOpen(false);
        }
      } catch (err) {
        console.error("Install prompt error:", err);
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

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
  const isStream = location.pathname === "/stream";
  const isConfession = location.pathname === "/confessions";
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
          className="relative grid grid-cols-[1fr_1fr_88px_1fr_1fr] items-center bg-card/95 dark:bg-card/95 backdrop-blur-xl border-t border-border/40 transition-colors"
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

          {/* 4. কনফেশন */}
          <Link
            to="/confessions"
            aria-current={isConfession ? "page" : undefined}
            className={`flex flex-col items-center justify-center gap-1 min-h-[56px] text-xs font-semibold transition-colors ${
              isConfession
                ? "text-primary dark:text-rose-400 font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageCircleHeart className="w-5 h-5 transition-transform active:scale-90" />
            <span className="text-[11px] leading-tight font-display">কনফেশন</span>
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
                ? "bg-primary shadow-primary/40"
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
          className="md:hidden fixed inset-0 z-[100] flex flex-col items-center justify-center select-none px-4"
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
            className="relative rounded-full aspect-square bg-card dark:bg-card border border-border/80 dark:border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.4)] flex items-center justify-center pointer-events-auto shrink-0"
            style={{
              width: "min(340px, 86vw)",
              height: "min(340px, 86vw)",
            }}
          >
              {/* Outer decorative dotted boundary */}
              <div className="absolute inset-4 rounded-full border border-dashed border-primary/25 dark:border-primary/35 pointer-events-none" />

              {/* Radial Items Positioned with Exact Centered Math */}
              {RADIAL_ITEMS.map((item, index) => {
                const total = RADIAL_ITEMS.length;
                const angleDeg = -90 + (360 / total) * index;
                const angleRad = (angleDeg * Math.PI) / 180;
                // Exact radial distance in pixels (fits evenly within 340px diameter)
                const distance = 112;
                const targetX = Math.round(Math.cos(angleRad) * distance);
                const targetY = Math.round(Math.sin(angleRad) * distance);

                const itemSize = 62; // px
                const halfSize = itemSize / 2; // 31px

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

            {/* PWA INSTALL ACTION BUTTON (UNDER WHEEL DIAL) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="relative z-20 mt-4 sm:mt-5 flex flex-col items-center gap-1.5 pointer-events-auto max-w-xs text-center"
            >
              <button
                type="button"
                onClick={handleInstallClick}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-stone-950 font-display font-extrabold text-xs shadow-lg shadow-amber-500/25 border border-white/40 active:scale-95 transition-all cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-stone-900" />
                <span>JU 52 অ্যাপ ফোনে ইনস্টল করুন</span>
                <Download className="w-3.5 h-3.5 text-stone-900" />
              </button>
              <span className="text-[11px] text-white/75 font-medium">
                প্লে-স্টোর ছাড়াই সরাসরি ফোনে অ্যাপ সেভ হবে
              </span>
            </motion.div>
          </div>
        )}

      {/* iOS Safari Install Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in select-none">
          <div className="bg-card dark:bg-[#1a1c24] border border-border/80 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl relative">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-amber-400/20 text-amber-500 mx-auto flex items-center justify-center mb-3">
              <Smartphone className="w-7 h-7" />
            </div>

            <h3 className="font-display font-bold text-lg text-foreground mb-1">
              আইফোনে JU 52 অ্যাপ ইনস্টল করুন
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              কোনো অ্যাপ স্টোর ছাড়াই মাত্র ২ ক্লিকে হোমস্ক্রিনে সেভ করুন
            </p>

            <div className="space-y-3 text-left bg-muted/60 rounded-2xl p-4 text-xs font-medium text-foreground mb-4">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0">১</span>
                <span>Safari ব্রাউজারের নিচে <strong>Share (শেয়ার)</strong> আইকনে চাপ দিন</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0">২</span>
                <span>মেনু থেকে <strong>"Add to Home Screen" (+)</strong> এ ট্যাপ করুন</span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-primary text-white font-bold text-xs cursor-pointer hover:bg-primary/90 transition-all shadow-md"
            >
              বুঝেছি ✓
            </button>
          </div>
        </div>
      )}

      {/* Android / In-App Browser Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in select-none">
          <div className="bg-card dark:bg-[#1a1c24] border border-border/80 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl relative">
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-amber-400/20 text-amber-500 mx-auto flex items-center justify-center mb-3">
              <Smartphone className="w-7 h-7" />
            </div>

            <h3 className="font-display font-bold text-lg text-foreground mb-1">
              {isInAppBrowser ? "ক্রোম ব্রাউজারে খুলুন" : "অ্যাপ ইনস্টল করুন"}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              {isInAppBrowser
                ? "ফেসবুক/মেসেঞ্জারের ভেতরে সরাসরি ইনস্টল ব্লক থাকে"
                : "সহজেই হোমস্ক্রিনে JU 52 অ্যাপ যুক্ত করুন"}
            </p>

            <div className="space-y-3 text-left bg-muted/60 rounded-2xl p-4 text-xs font-medium text-foreground mb-4">
              {isInAppBrowser ? (
                <>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0">১</span>
                    <span>উপরে ডানদিকের <strong>৩-ডট (⋮)</strong> মেনুতে চাপ দিন</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0">২</span>
                    <span><strong>"Open in Chrome"</strong> বা <strong>"External Browser"</strong> এ ট্যাপ করুন</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0">৩</span>
                    <span>এরপর এই ইনস্টল বাটনে চাপলেই ইনস্টল হয়ে যাবে!</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0">১</span>
                    <span>ব্রাউজারের ডানদিকের <strong>৩-ডট (⋮)</strong> মেনুতে চাপ দিন</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0">২</span>
                    <span><strong>"Install App"</strong> বা <strong>"Add to Home screen"</strong> এ চাপুন</span>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 rounded-xl bg-primary text-white font-bold text-xs cursor-pointer hover:bg-primary/90 transition-all shadow-md"
            >
              বুঝেছি ✓
            </button>
          </div>
        </div>
      )}
    </>
  );
}
