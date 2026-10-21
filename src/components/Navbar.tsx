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
      {/* Top bar (Desktop + Mobile Header) */}
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl relative transition-all shadow-xs">
        {/* Subtle hairline sunset-amber gradient accent border at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent pointer-events-none" />

        <div className="container flex h-14 md:h-16 items-center justify-between">
          <Link to="/" className="group flex items-center gap-2.5 transition-transform active:scale-95">
            {/* Logo Icon Badge */}
            <div className="relative flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary/95 to-amber-600 shadow-md shadow-primary/20 ring-1 ring-white/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-primary/30 shrink-0">
              <GraduationCap className="h-4.5 w-4.5 md:h-5 md:w-5 text-white drop-shadow-xs" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 border border-white dark:border-slate-900"></span>
              </span>
            </div>

            {/* Typography */}
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-display text-lg md:text-xl font-black tracking-tight text-primary">JU</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] md:text-xs font-black tracking-wider uppercase bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-white shadow-xs">
                  52
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 leading-none">
                <span className="text-[10px] font-bold text-muted-foreground tracking-wide">ব্যাচ ডে ২০২৫</span>
                <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === "/"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Home className="h-4 w-4" />
              হোম
            </Link>

            {/* Features Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors outline-none ${
                  isFeatureActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Sparkles className="h-4 w-4 text-amber-500" />
                স্মৃতি ও ফিচার
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-60 p-2 shadow-2xl rounded-xl">
                {featureItems.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname === item.to;
                  return (
                    <DropdownMenuItem key={item.to} asChild className="cursor-pointer rounded-lg p-2">
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
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === "/leaderboard"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Trophy className="h-4 w-4" />
              লিডারবোর্ড
            </Link>

            <Link
              to="/status"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === "/status"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <UserCheck className="h-4 w-4" />
              স্ট্যাটাস
            </Link>

            <Link
              to="/gallery"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === "/gallery"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Image className="h-4 w-4" />
              গ্যালারি
            </Link>

            <Link
              to="/game"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname.startsWith("/game")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Gamepad2 className="h-4 w-4" />
              গেম জোন
            </Link>

            <Link
              to="/register"
              className="relative group overflow-hidden flex items-center gap-2 ml-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-white font-display font-bold text-sm shadow-md shadow-amber-500/25 ring-1 ring-white/20 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-amber-500/35"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none" />
              <Sparkles className="w-4 h-4 text-amber-100 animate-pulse" />
              <span>রেজিস্ট্রেশন করুন</span>
            </Link>
          </nav>

          {/* Mobile Register button */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              to="/register"
              className="relative group overflow-hidden flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-white font-display font-bold text-xs shadow-md shadow-amber-500/20 ring-1 ring-white/20 transition-all duration-300 active:scale-95 hover:shadow-lg hover:shadow-amber-500/30"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none" />
              <Sparkles className="w-3.5 h-3.5 text-amber-100 animate-pulse" />
              <span className="tracking-wide">রেজিস্ট্রেশন</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Modern Curved Mobile Bottom Bar & Radial Menu */}
      <MobileBottomNav />
    </>
  );
}
