import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import GameLeaderboard from "@/components/GameLeaderboard";
import GameLoginModal from "@/components/GameLoginModal";
import { audioSystem } from "@/utils/audio";
import { triggerConfetti } from "@/utils/confetti";
import { ArrowLeft, RotateCcw, Trophy, Volume2, VolumeX, Music, Maximize, Minimize } from "lucide-react";

interface Tile {
  id: number;
  lane: number;
  y: number;
  height: number;
  hit: boolean;
}

const LANES = 4;
const CANVAS_WIDTH = 380;
const CANVAS_HEIGHT = 600;
const LANE_WIDTH = CANVAS_WIDTH / LANES;
const BASE_TILE_HEIGHT = 130;
const BASE_SPEED = 4.2;

const MELODY_FREQUENCIES = [
  659.25, 622.25, 659.25, 622.25, 659.25, 493.88, 587.33, 523.25, 440.00,
  261.63, 329.63, 440.00, 493.88, 329.63, 415.30, 493.88, 523.25, 329.63,
  659.25, 622.25, 659.25, 622.25, 659.25, 493.88, 587.33, 523.25, 440.00,
  587.33, 523.25, 493.88, 440.00, 392.00, 349.23, 329.63, 293.66, 261.63
];

export default function PianoTiles() {
  const [gameState, setGameState] = useState<"start" | "playing" | "gameover">("start");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [nickname, setNickname] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeLaneIndex, setActiveLaneIndex] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameId = useRef<number>();
  const hasSubmittedScore = useRef(false);

  const tiles = useRef<Tile[]>([]);
  const nextTileId = useRef(1);
  const noteIndex = useRef(0);
  const speed = useRef(BASE_SPEED);

  const playPianoNote = useCallback((index: number) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const freq = MELODY_FREQUENCIES[index % MELODY_FREQUENCIES.length];

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      audioSystem.playCoin();
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("piano_tiles_highscore");
    if (saved) setHighScore(parseInt(saved, 10));

    const savedNick = localStorage.getItem("ju_game_nickname_v2");
    if (savedNick) setNickname(savedNick);

    setIsMuted(audioSystem.isMuted);

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

  const spawnInitialTiles = useCallback(() => {
    const initial: Tile[] = [];
    nextTileId.current = 1;
    noteIndex.current = 0;
    speed.current = BASE_SPEED;

    for (let i = 0; i < 5; i++) {
      const lane = Math.floor(Math.random() * LANES);
      initial.push({
        id: nextTileId.current++,
        lane,
        y: CANVAS_HEIGHT - (i + 1) * BASE_TILE_HEIGHT,
        height: BASE_TILE_HEIGHT,
        hit: false,
      });
    }
    tiles.current = initial;
  }, []);

  const initGame = useCallback(() => {
    setScore(0);
    hasSubmittedScore.current = false;
    spawnInitialTiles();
  }, [spawnInitialTiles]);

  const handleLaneTap = useCallback((laneIndex: number) => {
    if (gameState !== "playing") return;

    setActiveLaneIndex(laneIndex);
    setTimeout(() => setActiveLaneIndex(null), 120);

    const unhitTiles = tiles.current.filter((t) => !t.hit).sort((a, b) => b.y - a.y);
    const targetTile = unhitTiles[0];

    if (targetTile && targetTile.lane === laneIndex && targetTile.y + targetTile.height >= 0) {
      targetTile.hit = true;
      playPianoNote(noteIndex.current++);
      setScore((s) => s + 1);
      speed.current = BASE_SPEED + Math.min(Math.floor((score + 1) / 8) * 0.45, 6.5);
    } else {
      audioSystem.playGameOver();
      setGameState("gameover");
    }
  }, [gameState, playPianoNote, score]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1;
      for (let i = 1; i < LANES; i++) {
        ctx.beginPath();
        ctx.moveTo(i * LANE_WIDTH, 0);
        ctx.lineTo(i * LANE_WIDTH, CANVAS_HEIGHT);
        ctx.stroke();
      }

      ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, CANVAS_HEIGHT - 6);
      ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 6);
      ctx.stroke();

      if (gameState === "playing") {
        tiles.current.forEach((tile) => {
          tile.y += speed.current;
        });

        const missedTile = tiles.current.find((t) => !t.hit && t.y > CANVAS_HEIGHT);
        if (missedTile) {
          audioSystem.playGameOver();
          setGameState("gameover");
          return;
        }

        const highestTile = tiles.current.reduce((min, t) => (t.y < min.y ? t : min), tiles.current[0]);
        if (highestTile && highestTile.y > -BASE_TILE_HEIGHT) {
          const lane = Math.floor(Math.random() * LANES);
          tiles.current.push({
            id: nextTileId.current++,
            lane,
            y: highestTile.y - BASE_TILE_HEIGHT,
            height: BASE_TILE_HEIGHT,
            hit: false,
          });
        }

        tiles.current = tiles.current.filter((t) => t.y < CANVAS_HEIGHT + 100);
      }

      tiles.current.forEach((tile) => {
        const x = tile.lane * LANE_WIDTH;

        if (tile.hit) {
          ctx.fillStyle = "rgba(56, 189, 248, 0.25)";
          ctx.fillRect(x + 2, tile.y, LANE_WIDTH - 4, tile.height - 3);
        } else {
          const grad = ctx.createLinearGradient(x, tile.y, x, tile.y + tile.height);
          grad.addColorStop(0, "#1e293b");
          grad.addColorStop(1, "#0f172a");

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x + 2, tile.y, LANE_WIDTH - 4, tile.height - 3, 6);
          ctx.fill();

          ctx.strokeStyle = "#38bdf8";
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
          ctx.beginPath();
          ctx.arc(x + LANE_WIDTH / 2, tile.y + tile.height / 2, 7, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      animFrameId.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT") return;

      if (e.key === "d" || e.key === "D" || e.key === "1") handleLaneTap(0);
      else if (e.key === "f" || e.key === "F" || e.key === "2") handleLaneTap(1);
      else if (e.key === "j" || e.key === "J" || e.key === "3") handleLaneTap(2);
      else if (e.key === "k" || e.key === "K" || e.key === "4") handleLaneTap(3);
      else if (e.code === "Space" && gameState !== "playing") {
        if (gameState === "start" && nickname.trim()) {
          setGameState("playing");
          initGame();
        } else if (gameState === "gameover") {
          setGameState("playing");
          initGame();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, nickname, handleLaneTap, initGame]);

  useEffect(() => {
    if (gameState === "gameover" && score > 0 && nickname.trim() && !hasSubmittedScore.current) {
      hasSubmittedScore.current = true;

      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem("piano_tiles_highscore", score.toString());
        triggerConfetti();
      }

      const submit = async () => {
        try {
          await supabase.from("game_scores").insert({
            nickname: nickname.trim().substring(0, 40),
            game_name: "piano_tiles_v1",
            score: score,
          });
        } catch (err) {
          console.error("Score submit error", err);
        }
      };
      submit();
    }
  }, [gameState, score, nickname, highScore]);

  const handleStartGame = (name: string) => {
    const finalName = name.trim().substring(0, 40);
    setNickname(finalName);
    localStorage.setItem("ju_game_nickname_v2", finalName);
    setGameState("playing");
    initGame();
  };

  const toggleSound = () => {
    const muted = audioSystem.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-slate-950 text-white flex flex-col overflow-hidden select-none z-50">
      {/* Top Header Navbar */}
      <div className="w-full px-3 py-2 flex items-center justify-between shrink-0 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 z-20">
        <Link
          to="/game"
          className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-400 hover:text-white transition-colors py-1.5 px-3 rounded-xl bg-slate-800/80 border border-slate-700/60"
        >
          <ArrowLeft className="w-4 h-4" />
          গেম জোন
        </Link>

        {/* Live Score Counter */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-base font-black text-sky-400 font-mono">{score}</span>
          </div>
          <div className="hidden xs:flex px-2.5 py-1 rounded-xl bg-slate-950/80 border border-slate-800 items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-bold text-amber-400 font-mono">{highScore}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-400 hover:text-white transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-400 hover:text-white transition-colors"
            title="ফুলস্ক্রিন"
          >
            {isFullscreen ? <Minimize className="w-4 h-4 text-sky-400" /> : <Maximize className="w-4 h-4" />}
          </button>
          <GameLeaderboard gameName="piano_tiles_v1" />
        </div>
      </div>

      {/* Main Full-Height Play Area */}
      <div className="flex-1 w-full min-h-0 relative flex items-center justify-center p-2 sm:p-4 overflow-hidden">
        <div className="relative w-full h-full max-w-[420px] max-h-[660px] rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-800 bg-slate-900 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full h-full object-contain block"
          />

          {/* 4 Interactive Touch Overlay Columns */}
          <div className="absolute inset-0 grid grid-cols-4 z-10">
            {[0, 1, 2, 3].map((lane) => (
              <div
                key={lane}
                onPointerDown={(e) => {
                  e.preventDefault();
                  handleLaneTap(lane);
                }}
                className={`h-full cursor-pointer transition-colors duration-100 ${
                  activeLaneIndex === lane ? "bg-sky-400/25" : "active:bg-sky-400/15"
                }`}
              />
            ))}
          </div>

          {/* Game Over Screen */}
          {gameState === "gameover" && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 z-30">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-xs text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-500/10">
                  <Music className="w-8 h-8" />
                </div>

                <h2 className="text-2xl font-black font-display text-white mb-1">টাইল মিস হয়েছে!</h2>
                <p className="text-sm text-slate-400 mb-6">রিদম বজায় রেখে ট্যাপ করো</p>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 shadow-inner">
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800/80">
                    <span className="text-sm font-semibold text-slate-400">টাইলস কাউন্ট</span>
                    <span className="text-2xl font-black text-white">{score}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-400 flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      সর্বোচ্চ রেকর্ড
                    </span>
                    <span className="text-xl font-black text-amber-400">{Math.max(score, highScore)}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setGameState("playing");
                    initGame();
                    audioSystem.playClick();
                  }}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-base shadow-xl shadow-sky-500/25 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  আবার খেলো (Replay)
                </button>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* Start Game Modal - At Root Level */}
      {gameState === "start" && (
        <GameLoginModal
          gameTitle="পিয়ানো টাইলস (Piano Tiles)"
          onStart={handleStartGame}
        />
      )}
    </div>
  );
}
