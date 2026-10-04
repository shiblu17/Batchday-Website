import { useState } from "react";
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
  Grid,
  X,
  ArrowRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const featureItems = [
  { to: "/campus-map", label: "মেমোরি ম্যাপ", desc: "৭০০ একরের স্মৃতিচিহ্ন", icon: Compass, color: "text-emerald-500 bg-emerald-500/10" },
  { to: "/slambook", label: "স্ল্যাম বুক", desc: "বন্ধুদের চিরকুট ডায়েরি", icon: BookOpen, color: "text-rose-500 bg-rose-500/10" },
  { to: "/time-capsule", label: "টাইম ক্যাপসুল", desc: "২০৩৬ সালের জন্য চিঠি", icon: Hourglass, color: "text-amber-500 bg-amber-500/10" },
  { to: "/stage-pulse", label: "লাইভ পালস", desc: "মুক্তমঞ্চ ক্রাউড রিঅ্যাকশন", icon: Zap, color: "text-primary bg-primary/10" },
  { to: "/confessions", label: "কনফেশন", desc: "মনের না-বলা কথা", icon: MessageCircleHeart, color: "text-purple-500 bg-purple-500/10" },
];

const allHubItems = [
  { to: "/campus-map", label: "ক্যাম্পাস ম্যাপ", desc: "৭০০ একরের স্মৃতি", icon: Compass, color: "text-emerald-500 bg-emerald-500/10" },
  { to: "/slambook", label: "স্ল্যাম বুক", desc: "বন্ধুর চিরকুট", icon: BookOpen, color: "text-rose-500 bg-rose-500/10" },
  { to: "/time-capsule", label: "টাইম ক্যাপসুল", desc: "২০৩৬ ভল্ট", icon: Hourglass, color: "text-amber-500 bg-amber-500/10" },
  { to: "/stage-pulse", label: "স্টেজ পালস", desc: "লাইভ রিঅ্যাকশন", icon: Zap, color: "text-primary bg-primary/10" },
  { to: "/confessions", label: "কনফেশন", desc: "স্মৃতি ও বার্তা", icon: MessageCircleHeart, color: "text-purple-500 bg-purple-500/10" },
  { to: "/game", label: "গেম জোন", desc: "৯টি মজাদার গেম", icon: Gamepad2, color: "text-indigo-500 bg-indigo-500/10" },
  { to: "/leaderboard", label: "লিডারবোর্ড", desc: "হল ও ডিপার্টমেন্ট", icon: Trophy, color: "text-yellow-500 bg-yellow-500/10" },
  { to: "/gallery", label: "গ্যালারি", desc: "স্মৃতিময় ছবি", icon: Image, color: "text-cyan-500 bg-cyan-500/10" },
  { to: "/status", label: "স্ট্যাটাস ও কার্ড", desc: "আইডি কার্ড ডাউনলোড", icon: UserCheck, color: "text-emerald-500 bg-emerald-500/10" },
];

export default function Navbar() {
  const location = useLocation();
  const [isHubOpen, setIsHubOpen] = useState(false);

  const isHome = location.pathname === "/";
  const isFeatureActive = featureItems.some((f) => location.pathname === f.to);

  return (
    <>
      {/* Top bar (Desktop + Mobile Header) */}
      <header
        className={`sticky top-0 z-50 transition-colors duration-300 ${
          isHome
            ? "border-b border-white/10 bg-[#400514]/75 backdrop-blur-xl text-white shadow-lg shadow-black/10"
            : "border-b border-border bg-background/80 backdrop-blur-md text-foreground"
        }`}
      >
        <div className="container flex h-14 md:h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <span
              className={`font-display text-xl sm:text-2xl font-black tracking-tight group-hover:scale-105 transition-transform ${
                isHome
                  ? "bg-gradient-to-r from-white via-amber-200 to-amber-400 bg-clip-text text-transparent drop-shadow-sm"
                  : "text-primary"
              }`}
            >
              JU-52
            </span>
            <span
              className={`hidden sm:inline text-xs font-semibold px-2 py-0.5 rounded-full border transition-colors ${
                isHome
                  ? "bg-white/10 text-amber-300 border-white/20"
                  : "bg-primary/10 text-primary border border-primary/20"
              }`}
            >
              ব্যাচ ডে ২০২৬
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === "/"
                  ? isHome
                    ? "bg-white/20 text-white font-bold border border-white/20 shadow-sm"
                    : "bg-primary text-primary-foreground font-bold shadow-sm"
                  : isHome
                  ? "text-white/80 hover:text-white hover:bg-white/10"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Home className="h-4 w-4" />
              হোম
            </Link>

            {/* Features Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors outline-none cursor-pointer ${
                  isFeatureActive
                    ? isHome
                      ? "bg-white/20 text-white font-bold border border-white/20 shadow-sm"
                      : "bg-primary text-primary-foreground font-bold shadow-sm"
                    : isHome
                    ? "text-white/80 hover:text-white hover:bg-white/10"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Sparkles className="h-4 w-4 text-amber-400" />
                স্মৃতি ও ফিচার
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 p-2 shadow-2xl rounded-2xl bg-card/95 backdrop-blur-xl border border-border">
                {featureItems.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname === item.to;
                  return (
                    <DropdownMenuItem key={item.to} asChild className="cursor-pointer rounded-xl p-2 focus:bg-muted">
                      <Link to={item.to} className={`flex items-center gap-3 w-full ${active ? "bg-primary/10 text-primary font-bold" : ""}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold leading-none text-foreground">{item.label}</div>
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
                  ? isHome
                    ? "bg-white/20 text-white font-bold border border-white/20 shadow-sm"
                    : "bg-primary text-primary-foreground font-bold shadow-sm"
                  : isHome
                  ? "text-white/80 hover:text-white hover:bg-white/10"
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
                  ? isHome
                    ? "bg-white/20 text-white font-bold border border-white/20 shadow-sm"
                    : "bg-primary text-primary-foreground font-bold shadow-sm"
                  : isHome
                  ? "text-white/80 hover:text-white hover:bg-white/10"
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
                  ? isHome
                    ? "bg-white/20 text-white font-bold border border-white/20 shadow-sm"
                    : "bg-primary text-primary-foreground font-bold shadow-sm"
                  : isHome
                  ? "text-white/80 hover:text-white hover:bg-white/10"
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
                  ? isHome
                    ? "bg-white/20 text-white font-bold border border-white/20 shadow-sm"
                    : "bg-primary text-primary-foreground font-bold shadow-sm"
                  : isHome
                  ? "text-white/80 hover:text-white hover:bg-white/10"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Gamepad2 className="h-4 w-4" />
              গেম জোন
            </Link>

            <Link
              to="/register"
              className="ml-2 px-5 py-2 rounded-xl bg-gradient-to-r from-accent to-amber-500 text-white font-display font-black text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-accent/25"
            >
              Register Now
            </Link>
          </nav>

          {/* Mobile Right Quick Register Button */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              to="/register"
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-accent to-amber-500 text-white font-display font-black text-xs shadow-md hover:scale-105 transition-transform"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* Modern Mobile Bottom Navigation Bar (App-Style Dock) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur-xl shadow-2xl safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-2 relative">
          {/* Tab 1: Home */}
          <Link
            to="/"
            className={`flex flex-col items-center gap-1 py-1 px-2 text-[10px] font-bold transition-colors ${
              location.pathname === "/" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Home className="h-5 w-5" />
            <span>হোম</span>
          </Link>

          {/* Tab 2: Map */}
          <Link
            to="/campus-map"
            className={`flex flex-col items-center gap-1 py-1 px-2 text-[10px] font-bold transition-colors ${
              location.pathname === "/campus-map" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Compass className="h-5 w-5" />
            <span>ম্যাপ</span>
          </Link>

          {/* Center Floating Hub Action Button */}
          <div className="relative -top-4 flex items-center justify-center">
            <button
              onClick={() => setIsHubOpen(true)}
              aria-label="সব ফিচার দেখুন"
              className="relative flex items-center justify-center w-13 h-13 rounded-full bg-gradient-to-tr from-primary via-rose-600 to-amber-500 text-white shadow-xl shadow-primary/40 ring-4 ring-background transition-transform active:scale-95 hover:scale-105"
            >
              <Grid className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400"></span>
              </span>
            </button>
          </div>

          {/* Tab 3: Stage Pulse */}
          <Link
            to="/stage-pulse"
            className={`flex flex-col items-center gap-1 py-1 px-2 text-[10px] font-bold transition-colors ${
              location.pathname === "/stage-pulse" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Zap className="h-5 w-5" />
            <span>পালস</span>
          </Link>

          {/* Tab 4: Games */}
          <Link
            to="/game"
            className={`flex flex-col items-center gap-1 py-1 px-2 text-[10px] font-bold transition-colors ${
              location.pathname.startsWith("/game") ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Gamepad2 className="h-5 w-5" />
            <span>গেম</span>
          </Link>
        </div>
      </nav>

      {/* Mobile Quick Hub Modal / Bottom Sheet */}
      {isHubOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200">
          <div className="bg-card border-t border-border rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-300">
            {/* Sheet Header */}
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                  52
                </div>
                <div>
                  <h3 className="font-display font-black text-sm text-foreground">JU-52 কুইক হাব</h3>
                  <p className="text-[10px] text-muted-foreground">সব ফিচার এক নজরে</p>
                </div>
              </div>
              <button
                onClick={() => setIsHubOpen(false)}
                className="p-1.5 rounded-full bg-muted/60 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Hub Grid */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {allHubItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsHubOpen(false)}
                    className="flex flex-col items-center text-center p-3 rounded-2xl bg-muted/40 hover:bg-primary/10 transition-colors border border-border/40"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-display font-bold text-xs text-foreground line-clamp-1">
                      {item.label}
                    </span>
                    <span className="text-[9px] text-muted-foreground line-clamp-1 mt-0.5">
                      {item.desc}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Quick Register Banner inside Sheet */}
            <Link
              to="/register"
              onClick={() => setIsHubOpen(false)}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-accent to-amber-600 text-white font-display font-black text-xs shadow-md"
            >
              <span>এখনই ব্যাচ ডে রেজিস্ট্রেশন করুন</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
