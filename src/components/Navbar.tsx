import { Link, useLocation } from "react-router-dom";
import { Home, Trophy, UserCheck, Image, Menu, X, Gamepad2, MessageCircleHeart } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";

const navItems = [
  { to: "/", label: "হোম", icon: Home },
  { to: "/confessions", label: "কনফেশন", icon: MessageCircleHeart },
  { to: "/leaderboard", label: "লিডারবোর্ড", icon: Trophy },
  { to: "/status", label: "স্ট্যাটাস", icon: UserCheck },
  { to: "/gallery", label: "গ্যালারি", icon: Image },
  { to: "/game", label: "গেম জোন", icon: Gamepad2 },
];

export default function Navbar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => { setOpen(false); }, [location.pathname]);

  return (
    <>
      {/* Desktop top bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container flex h-14 md:h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-xl font-extrabold text-primary">JU-52</span>
            <span className="hidden sm:inline text-xs font-medium text-muted-foreground">ব্যাচ ডে</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <div className="ml-2 mr-1">
              <ThemeToggle />
            </div>
            <Link
              to="/register"
              className="ml-2 px-5 py-2 rounded-lg bg-accent text-accent-foreground font-display font-bold text-sm transition-all hover:scale-105 active:scale-95"
            >
              Register Now
            </Link>
          </nav>

          {/* Mobile controls */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <Link
              to="/register"
              className="px-4 py-1.5 rounded-lg bg-accent text-accent-foreground font-display font-bold text-xs"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md safe-area-bottom">
        <div className="flex justify-around py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-colors min-w-[3.5rem] ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className={`h-5 w-5 ${active ? "text-primary" : ""}`} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
