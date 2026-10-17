import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Maximize2, Minimize2, RotateCcw, Trophy } from "lucide-react";
import GameLeaderboard from "@/components/GameLeaderboard";

export default function TrafficDash() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const reloadGame = () => {
    if (iframeRef.current) {
      iframeRef.current.src = "/racing-limits/index.html?t=" + Date.now();
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* Floating Glass Back Button (Only back icon as requested) */}
      <div className="absolute top-3 left-3 z-50 flex items-center gap-2">
        <Link
          to="/game"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-black/60 hover:bg-black/85 text-white/90 hover:text-white border border-white/20 shadow-2xl backdrop-blur-md transition-all active:scale-90"
          title="গেম হাব-এ ফিরে যান"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </div>

      {/* Floating Side Controls */}
      <div className="absolute top-3 right-3 z-50 flex items-center gap-2">
        <GameLeaderboard gameName="traffic_dash_v1">
          <button
            className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/80 hover:bg-amber-500 text-white border border-amber-300/40 shadow-2xl backdrop-blur-md transition-all active:scale-90"
            title="লিডারবোর্ড দেখুন"
          >
            <Trophy className="w-4 h-4 text-white" />
          </button>
        </GameLeaderboard>

        <button
          onClick={reloadGame}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-black/60 hover:bg-black/85 text-white/80 hover:text-white border border-white/20 shadow-2xl backdrop-blur-md transition-all active:scale-90"
          title="গেম রিলোড করুন"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={toggleFullscreen}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-black/60 hover:bg-black/85 text-white/80 hover:text-white border border-white/20 shadow-2xl backdrop-blur-md transition-all active:scale-90"
          title="ফুলস্ক্রিন"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Embedded 3D Racing Limits HD WebGL Game */}
      <iframe
        ref={iframeRef}
        src="/racing-limits/index.html"
        title="Racing Limits 3D"
        className="w-full h-full border-0 block"
        allow="fullscreen; autoplay; screen-wake-lock; gyroscope; accelerometer"
      />
    </div>
  );
}
