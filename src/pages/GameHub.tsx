import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Gamepad2, BrainCircuit, XSquare, Play, Footprints, Dices, Flame, Sparkles, ShoppingBag, Trophy, Medal, Star } from "lucide-react";
import Sponsors from "@/components/Sponsors";

// Web Audio API Sound Utility
const playHoverSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

const playClickSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

const playRetroSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const audioCtx = new AudioContext();
    
    // Play a sequence of retro notes
    [440, 554, 659, 880].forEach((freq, i) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + (i * 0.1));
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime + (i * 0.1));
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (i * 0.1) + 0.1);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start(audioCtx.currentTime + (i * 0.1));
      oscillator.stop(audioCtx.currentTime + (i * 0.1) + 0.1);
    });
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

// Floating Particles Background
const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute bg-primary/20 rounded-full blur-sm"
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
            scale: Math.random() * 0.5 + 0.5,
          }}
          animate={{
            y: [null, Math.random() * -200 - 100],
            x: [null, Math.random() * 200 - 100],
            opacity: [0.7, 0],
          }}
          transition={{
            duration: Math.random() * 5 + 5,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            width: Math.random() * 30 + 10,
            height: Math.random() * 30 + 10,
          }}
        />
      ))}
    </div>
  );
};

const games = [
  {
    path: "/game/catch-grades",
    title: "Catch the Grades",
    description: "A+ এবং সিঙ্গারাগুলো ব্যাগে ভরো!",
    icon: ShoppingBag,
    color: "bg-emerald-100 text-emerald-600",
    gradient: "from-emerald-500 to-teal-600",
    badge: "NEW",
    badgeIcon: Sparkles,
    badgeColor: "bg-yellow-500 text-white",
  },
  {
    path: "/game/flappy",
    title: "Flappy Student",
    description: "বাস বাঁচিয়ে বাধা পার হও!",
    icon: Gamepad2,
    color: "bg-sky-100 text-sky-600",
    gradient: "from-sky-500 to-blue-600",
    badge: "HOT",
    badgeIcon: Flame,
    badgeColor: "bg-red-500 text-white",
  },
  {
    path: "/game/ludo",
    title: "জাবি লুডু কিং",
    description: "সবাই মিলে লুডু খেলো!",
    icon: Dices,
    color: "bg-violet-100 text-violet-600",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    path: "/game/memory",
    title: "JU মেমোরি ম্যাচ",
    description: "কার্ড উল্টিয়ে ছবি মেলাও",
    icon: BrainCircuit,
    color: "bg-fuchsia-100 text-fuchsia-600",
    gradient: "from-fuchsia-500 to-purple-600",
  },
  {
    path: "/game/tictactoe",
    title: "টিক-ট্যাক-টো",
    description: "বন্ধুর সাথে বা এআই-এর সাথে খেলো",
    icon: XSquare,
    color: "bg-rose-100 text-rose-600",
    gradient: "from-rose-500 to-pink-600",
  },
  {
    path: "/game/dinorun",
    title: "জাবি রানার",
    description: "ক্যাম্পাসের বাধা পার হও!",
    icon: Footprints,
    color: "bg-orange-100 text-orange-600",
    gradient: "from-orange-500 to-red-600",
  }
];

// Mock Leaderboard Data
const mockLeaderboard = [
  { name: "Rafiq (IIT)", game: "Flappy Student", score: "95", rank: 1 },
  { name: "Sadiya (Physics)", game: "Catch the Grades", score: "820", rank: 2 },
  { name: "Rakib (CSE)", game: "জাবি রানার", score: "1240", rank: 3 },
  { name: "Nusrat (English)", game: "JU মেমোরি ম্যাচ", score: "42s", rank: 4 },
  { name: "Tanvir (Chemistry)", game: "Flappy Student", score: "78", rank: 5 },
];

// Game Card Component with 3D Tilt
const GameCard = ({ game, index }: { game: any; index: number }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
      style={{ rotateX, rotateY, perspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={playHoverSound}
      onClick={playClickSound}
      className="h-full z-10 relative"
    >
      <Link
        to={game.path}
        className={`block rounded-3xl overflow-hidden shadow-xl border border-border/50 bg-card/80 backdrop-blur-sm group relative h-full transition-all duration-300 hover:shadow-2xl hover:shadow-${game.color.split('-')[1]}-500/20`}
      >
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 bg-gradient-to-br ${game.gradient}`} />

        {game.badge && (
          <motion.div 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 + 0.3 }}
            className={`absolute top-4 left-4 z-20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg ${game.badgeColor}`}
          >
            <game.badgeIcon className="w-3 h-3" />
            {game.badge}
          </motion.div>
        )}

        <div className={`h-40 bg-gradient-to-br ${game.gradient} p-6 relative overflow-hidden flex items-center justify-center`}>
          <motion.div 
            className="opacity-10 absolute"
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          >
            <game.icon className="w-56 h-56 text-white" />
          </motion.div>
          <motion.div
             whileHover={{ scale: 1.15, rotate: [0, -10, 10, 0] }}
             transition={{ type: "spring", stiffness: 300 }}
             className="z-10"
          >
             <game.icon className="w-16 h-16 text-white drop-shadow-lg" />
          </motion.div>
        </div>
        
        <div className="p-6 relative pt-10">
          <div className={`absolute -top-8 right-6 w-16 h-16 rounded-2xl ${game.color} flex items-center justify-center shadow-lg border-4 border-card transform group-hover:-translate-y-2 transition-transform duration-300`}>
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <game.icon className="w-7 h-7" />
            </motion.div>
          </div>
          
          <h2 className="font-display text-2xl font-bold mb-2 group-hover:text-primary transition-colors">{game.title}</h2>
          <p className="text-sm text-muted-foreground mb-6 font-medium">{game.description}</p>
          
          <div className="flex items-center text-sm font-bold opacity-70 group-hover:opacity-100 transition-opacity">
            <span className={`bg-clip-text text-transparent bg-gradient-to-r ${game.gradient}`}>
              খেলতে শুরু করো
            </span>
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            >
              <Play className="w-4 h-4 ml-2 fill-current text-primary" />
            </motion.div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default function GameHub() {
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [easterEggClicks, setEasterEggClicks] = useState(0);
  const [retroMode, setRetroMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isHoveringInteractive = target.closest('a') || target.closest('button');
      
      if (!isHoveringInteractive) {
        setMousePos({ x: e.clientX, y: e.clientY });
      } else {
        setMousePos({ x: -100, y: -100 }); 
      }
    };
    
    const isTouchDevice = (('ontouchstart' in window) || (navigator.maxTouchPoints > 0));
    
    if (!isTouchDevice) {
      window.addEventListener("mousemove", handleMouseMove);
    }
    
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleEasterEggClick = () => {
    const newCount = easterEggClicks + 1;
    setEasterEggClicks(newCount);
    
    if (newCount === 5) {
      setRetroMode(true);
      playRetroSound();
      // Optional: Reset after some time
      setTimeout(() => {
        setRetroMode(false);
        setEasterEggClicks(0);
      }, 10000);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative min-h-screen pt-12 pb-24 md:pb-12 px-4 overflow-hidden bg-background ${retroMode ? 'retro-scanlines' : ''}`}
      style={{ cursor: retroMode ? 'crosshair' : 'crosshair' }} 
    >
      {/* Retro CSS injected dynamically for the easter egg */}
      {retroMode && (
        <style dangerouslySetInnerHTML={{__html: `
          .retro-scanlines::before {
            content: " ";
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            right: 0;
            background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
            z-index: 100;
            background-size: 100% 2px, 3px 100%;
            pointer-events: none;
          }
          .retro-scanlines {
            filter: contrast(1.2) brightness(0.9) sepia(0.2) hue-rotate(180deg) saturate(1.5);
            animation: crt-flicker 0.15s infinite;
          }
          @keyframes crt-flicker {
            0% { opacity: 0.95; }
            100% { opacity: 1; }
          }
        `}} />
      )}

      {!retroMode && <FloatingParticles />}

      <motion.div
        className="fixed top-0 left-0 w-8 h-8 pointer-events-none z-50 flex items-center justify-center mix-blend-difference hidden md:flex"
        animate={{
          x: mousePos.x - 16,
          y: mousePos.y - 16,
          opacity: mousePos.x > 0 ? 1 : 0
        }}
        transition={{ type: "tween", ease: "backOut", duration: 0.1 }}
      >
        <div className="relative w-full h-full">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          <div className="absolute top-0 left-1/2 w-0.5 h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          <div className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white" />
        </div>
      </motion.div>

      <div className="container max-w-5xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div 
            onClick={handleEasterEggClick}
            className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-primary/20 to-primary/5 shadow-2xl border border-primary/20 relative cursor-pointer"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={retroMode ? 'retro' : 'normal'}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, rotate: retroMode ? 360 : [0, 10, -10, 0] }}
                transition={{ repeat: retroMode ? Infinity : Infinity, duration: retroMode ? 1 : 4, ease: "linear" }}
              >
                <Gamepad2 className={`h-12 w-12 ${retroMode ? 'text-green-500' : 'text-primary'}`} />
              </motion.div>
            </AnimatePresence>
            
            <motion.div className={`absolute -top-2 -right-2 ${retroMode ? 'text-green-400' : 'text-yellow-500'}`} animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }}>
               <Sparkles className="w-6 h-6" />
            </motion.div>

            {/* Click Counter indicator (subtle) */}
            {easterEggClicks > 0 && easterEggClicks < 5 && (
              <div className="absolute -bottom-2 -right-2 bg-primary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {easterEggClicks}
              </div>
            )}
          </div>
          
          <h1 className="font-display text-5xl md:text-6xl font-black mb-6 tracking-tight">
            <span className={`bg-clip-text text-transparent bg-gradient-to-r ${retroMode ? 'from-green-400 to-green-600' : 'from-primary via-purple-500 to-pink-500'}`}>
              {retroMode ? 'ARCADE MODE' : 'গেম জোন'} 
            </span>
            {retroMode ? ' 🕹️' : ' 🎮'}
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            রেজিস্ট্রেশনের ফাকে একটু বিরতি নাও! জাবি ৫২ ব্যাচ ডে-র এই স্পেশাল গেমগুলো খেলে তোমার বেস্ট স্কোর সেট করো।
          </p>

          <div className="-mx-4 sm:-mx-8 md:-mx-0 mb-16 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent blur-3xl -z-10" />
            <Sponsors type="game" />
          </div>
        </motion.div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 text-left pb-16">
          {games.map((game, i) => (
            <GameCard key={game.path} game={game} index={i} />
          ))}
        </div>

        {/* Mock Global Leaderboard Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto mt-8 bg-card/50 backdrop-blur-md border border-border rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-left"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-display">গ্লোবাল লিডারবোর্ড</h2>
              <p className="text-sm text-muted-foreground">শীর্ষ ৫ জন প্লেয়ার (Mock Data)</p>
            </div>
          </div>

          <div className="space-y-3">
            {mockLeaderboard.map((player) => (
              <div key={player.rank} className="flex items-center justify-between p-4 rounded-2xl bg-background/80 border border-border hover:border-primary/30 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm
                    ${player.rank === 1 ? 'bg-yellow-100 text-yellow-700' : 
                      player.rank === 2 ? 'bg-gray-200 text-gray-700' : 
                      player.rank === 3 ? 'bg-orange-100 text-orange-700' : 
                      'bg-muted text-muted-foreground'}`}
                  >
                    {player.rank === 1 ? <Medal className="w-4 h-4" /> : `#${player.rank}`}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{player.name}</h4>
                    <p className="text-xs text-muted-foreground">{player.game}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 opacity-80" />
                  <span className="font-bold text-lg">{player.score}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
