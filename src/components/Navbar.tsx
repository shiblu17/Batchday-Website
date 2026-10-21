import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Trophy,
  UserCheck,
  Image,
  Gamepad2,
  MessageCircleHeart,
  Sparkles,
  ChevronDown,
  Compass,
  BookOpen,
  Hourglass,
  Zap,
  Video,
  Shirt,
  GraduationCap,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const featureItems = [
  { to: "/stream", label: "লাইভ রিলস ও স্ট্রিম", desc: "ছবি ও ৪৫ সেকেন্ডের ভিডিও", icon: Video },
  { to: "/jersey", label: "ডিজিটাল জার্সি", desc: "ভার্চুয়াল অটোগ্রাফ ও সাইনিং", icon: Shirt },
  { to: "/memories", label: "জাবি ভাইবস ও স্মৃতি", desc: "ফুড মিটার, অডিও ও ইয়ারবুক", icon: Compass },
  { to: "/time-capsule", label: "টাইম ক্যাপসুল", desc: "১০ বছর পরের জন্য চিঠি", icon: Hourglass },
  { to: "/stage-pulse", label: "লাইভ পালস", desc: "মুক্তমঞ্চ ক্রাউড রিঅ্যাকশন", icon: Zap },
  { to: "/confessions", label: "কনফেশন", desc: "মনের না-বলা কথা", icon: MessageCircleHeart },
];

import MobileBottomNav from "@/components/MobileBottomNav";

export default function Navbar() {
  const location = useLocation();

  const isFeatureActive = featureItems.some((f) => location.pathname === f.to);

  return (
    <>
      {/* Floating Capsule Island Header (Matching Reference Design) */}
      <header className="sticky top-2.5 sm:top-3.5 z-50 px-3 sm:px-6 pointer-events-none transition-all">
        <div className="max-w-5xl mx-auto flex h-12 sm:h-13 items-center justify-between px-3.5 sm:px-5 rounded-full bg-white/95 dark:bg-slate-900/90 backdrop-blur-md shadow-md shadow-slate-900/[0.06] border border-slate-200/80 dark:border-white/10 pointer-events-auto">
          {/* Logo (Left) */}
          <Link to="/" className="flex items-center gap-2 group transition-transform active:scale-95 shrink-0">
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0 transition-transform group-hover:scale-105">
              <GraduationCap className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-center tracking-tight leading-none font-display text-base sm:text-lg font-black">
              <span className="text-slate-900 dark:text-white">JU</span>
              <span className="text-primary ml-0.5">52</span>
              <span className="hidden sm:inline-block text-[10px] font-bold text-muted-foreground ml-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                ব্যাচ ডে
              </span>
            </div>
          </Link>

          {/* Desktop Nav (Center) */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                location.pathname === "/"
                  ? "bg-primary text-primary-foreground"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <Home className="h-3.5 w-3.5" />
              হোম
            </Link>

            {/* Features Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors outline-none ${
                  isFeatureActive
                    ? "bg-primary text-primary-foreground"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                স্মৃতি ও ফিচার
                <ChevronDown className="h-3 w-3 opacity-70" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-60 p-2 shadow-2xl rounded-2xl">
                {featureItems.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname === item.to;
                  return (
                    <DropdownMenuItem key={item.to} asChild className="cursor-pointer rounded-xl p-2">
                      <Link to={item.to} className={`flex items-center gap-3 w-full ${active ? "bg-primary/10 text-primary font-bold" : ""}`}>
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold leading-none">{item.label}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              to="/leaderboard"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                location.pathname === "/leaderboard"
                  ? "bg-primary text-primary-foreground"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <Trophy className="h-3.5 w-3.5" />
              লিডারবোর্ড
            </Link>

            <Link
              to="/status"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                location.pathname === "/status"
                  ? "bg-primary text-primary-foreground"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              স্ট্যাটাস
            </Link>

            <Link
              to="/gallery"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                location.pathname === "/gallery"
                  ? "bg-primary text-primary-foreground"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <Image className="h-3.5 w-3.5" />
              গ্যালারি
            </Link>

            <Link
              to="/game"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                location.pathname.startsWith("/game")
                  ? "bg-primary text-primary-foreground"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <Gamepad2 className="h-3.5 w-3.5" />
              গেম জোন
            </Link>
          </nav>

          {/* Register Pill Button (Right) */}
          <div className="flex items-center gap-2">
            <Link
              to="/register"
              className="px-4 py-1.5 sm:px-5 sm:py-2 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold text-xs sm:text-sm shadow-md shadow-primary/20 transition-all active:scale-95 hover:scale-105 shrink-0 flex items-center gap-1.5"
            >
              <span>Register Now</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Modern Curved Mobile Bottom Bar & Radial Menu */}
      <MobileBottomNav />
    </>
  );
}
