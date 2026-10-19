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
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container flex h-14 md:h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-xl font-extrabold text-primary">JU-52</span>
            <span className="hidden sm:inline text-xs font-medium text-muted-foreground">ব্যাচ ডে</span>
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
              className="ml-2 px-5 py-2 rounded-lg bg-accent text-accent-foreground font-display font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-sm"
            >
              Register Now
            </Link>
          </nav>

          {/* Mobile Register button */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              to="/register"
              className="px-4 py-1.5 rounded-lg bg-accent text-accent-foreground font-display font-bold text-xs"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* Modern Curved Mobile Bottom Bar & Radial Menu */}
      <MobileBottomNav />
    </>
  );
}
