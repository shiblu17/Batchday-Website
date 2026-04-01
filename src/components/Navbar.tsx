import { Link, useLocation } from "react-router-dom";
import { Home, Trophy, UserCheck, Image, Menu, X, Gamepad2, MessageCircleHeart } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
      <header className="hidden md:block sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
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
            <Link
              to="/register"
              className="ml-2 px-5 py-2 rounded-lg bg-accent text-accent-foreground font-display font-bold text-sm transition-all hover:scale-105 active:scale-95"
            >
              Register Now
            </Link>
          </nav>

          {/* Mobile controls */}
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

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md safe-area-bottom">
        <div className="flex justify-around py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] relative z-50 bg-background/95">
          {navItems.slice(0, 4).map((item) => {
            const active = location.pathname === item.to && !open;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`flex flex-col flex-1 items-center gap-1 px-1 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className={`h-5 w-5 ${active ? "text-primary" : ""}`} />
                <span className="truncate w-full text-center">{item.label}</span>
              </Link>
            );
          })}
          
          <button
            onClick={() => setOpen(!open)}
            className={`flex flex-col flex-1 items-center gap-1 px-1 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
              open ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {open ? <X className="h-5 w-5 text-primary" /> : <Menu className="h-5 w-5" />}
            <span className="truncate w-full text-center">মেনু</span>
          </button>
        </div>
      </nav>

      {/* Mobile Popup Menu */}
      <AnimatePresence>
        {open && (
           <motion.div
             initial={{ opacity: 0, y: 100 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: 100 }}
             className="md:hidden fixed inset-x-0 bottom-[4.5rem] p-4 z-40"
           >
              <div className="bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-3xl p-6 flex flex-col gap-4">
                <h3 className="font-display font-bold text-foreground mb-2">আরও অপশন</h3>
                <div className="grid grid-cols-2 gap-3">
                  {navItems.slice(4).map((item) => {
                    const active = location.pathname === item.to;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-colors ${
                          active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                        }`}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
                
                <div className="h-px bg-border my-2" />
                
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="w-full py-4 text-center rounded-2xl bg-accent text-accent-foreground font-display font-bold"
                >
                   Register Now
                </Link>
              </div>
           </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
