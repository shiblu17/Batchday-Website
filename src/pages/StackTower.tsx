import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import GameLeaderboard from "@/components/GameLeaderboard";
import GameLoginModal from "@/components/GameLoginModal";
import { audioSystem } from "@/utils/audio";
import { triggerConfetti } from "@/utils/confetti";
import { ArrowLeft, RotateCcw, Trophy, Volume2, VolumeX, Sparkles, Layers, Maximize, Minimize } from "lucide-react";

interface Block {
  x: number;
  y: number;
  width: number;
  color: string;
}

interface Debris {
  x: number;
  y: number;
  width: number;
  color: string;
  vy: number;
  vx: number;
  rotation: number;
  vr: number;
  opacity: number;
}

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const BLOCK_HEIGHT = 28;
const INITIAL_WIDTH = 220;
const SPEED_BASE = 3.2;

export default function StackTower() {
  const [gameState, setGameState] = useState<"start" | "playing" | "gameover">("start");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [comboMessage, setComboMessage] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameId = useRef<number>();
  const hasSubmittedScore = useRef(false);

  // Game loop state refs
  const stack = useRef<Block[]>([]);
  const debrisList = useRef<Debris[]>([]);
  const currentBlock = useRef<{ x: number; width: number; speed: number; direction: number }>({
    x: 0,
    width: INITIAL_WIDTH,
    speed: SPEED_BASE,
    direction: 1,
  });
  const cameraY = useRef(0);
  const targetCameraY = useRef(0);

  // Web Audio Synth for Harmonic Scale Combos
  const playComboSound = useCallback((streak: number) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
      const freq = scale[Math.min(streak, scale.length - 1)];

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      audioSystem.playCoin();
    }
  }, []);

  const playSliceSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      audioSystem.playClick();
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("stack_tower_highscore");
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

  // Initialize Game Stack
  const initGame = useCallback(() => {
    const baseBlockY = CANVAS_HEIGHT - 120;
    const baseColor = `hsl(210, 85%, 55%)`;

    stack.current = [
      {
        x: (CANVAS_WIDTH - INITIAL_WIDTH) / 2,
        y: baseBlockY,
        width: INITIAL_WIDTH,
        color: baseColor,
      },
    ];

    debrisList.current = [];
    currentBlock.current = {
      x: 0,
      width: INITIAL_WIDTH,
      speed: SPEED_BASE,
      direction: 1,
    };

    cameraY.current = 0;
    targetCameraY.current = 0;
    setScore(0);
    setCombo(0);
    setComboMessage(null);
    hasSubmittedScore.current = false;
  }, []);

  // Place Block Action (Click, Tap or Space)
  const placeBlock = useCallback(() => {
    if (gameState !== "playing") return;

    const topBlock = stack.current[stack.current.length - 1];
    const curr = currentBlock.current;
    const diff = curr.x - topBlock.x;
    const tolerance = 4;

    const hue = (210 + stack.current.length * 12) % 360;
    const blockColor = `hsl(${hue}, 85%, 55%)`;
    const nextY = topBlock.y - BLOCK_HEIGHT;

    // 1. PERFECT DROP
    if (Math.abs(diff) <= tolerance) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      setComboMessage(`PERFECT! x${newCombo}`);
      playComboSound(newCombo);

      const bonusWidth = newCombo >= 5 ? Math.min(INITIAL_WIDTH, curr.width + 10) : curr.width;

      stack.current.push({
        x: topBlock.x,
        y: nextY,
        width: bonusWidth,
        color: blockColor,
      });

      curr.width = bonusWidth;
      curr.x = 0;
      curr.direction = 1;
      curr.speed = SPEED_BASE + Math.min(stack.current.length * 0.12, 4.5);
    }
    // 2. OVERLAP DROP (SLICE)
    else if (curr.x + curr.width > topBlock.x && curr.x < topBlock.x + topBlock.width) {
      setCombo(0);
      setComboMessage(null);
      playSliceSound();

      const newWidth = curr.width - Math.abs(diff);
      const newX = diff > 0 ? curr.x : topBlock.x;
      const debrisX = diff > 0 ? topBlock.x + topBlock.width : curr.x;
      const debrisWidth = Math.abs(diff);

      debrisList.current.push({
        x: debrisX,
        y: nextY,
        width: debrisWidth,
        color: blockColor,
        vy: 2,
        vx: diff > 0 ? 2 : -2,
        rotation: 0,
        vr: diff > 0 ? 0.05 : -0.05,
        opacity: 1,
      });

      stack.current.push({
        x: newX,
        y: nextY,
        width: newWidth,
        color: blockColor,
      });

      curr.width = newWidth;
      curr.x = 0;
      curr.direction = 1;
      curr.speed = SPEED_BASE + Math.min(stack.current.length * 0.12, 4.5);
    }
    // 3. COMPLETE MISS (GAME OVER)
    else {
      debrisList.current.push({
        x: curr.x,
        y: nextY,
        width: curr.width,
        color: blockColor,
        vy: 3,
        vx: curr.direction * 3,
        rotation: 0,
        vr: curr.direction * 0.08,
        opacity: 1,
      });

      audioSystem.playGameOver();
      setGameState("gameover");
      return;
    }

    const currentScore = stack.current.length - 1;
    setScore(currentScore);

    if (nextY < CANVAS_HEIGHT / 2) {
      targetCameraY.current = (CANVAS_HEIGHT / 2) - nextY;
    }
  }, [gameState, combo, playComboSound, playSliceSound]);

  // Handle Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      cameraY.current += (targetCameraY.current - cameraY.current) * 0.1;

      ctx.save();
      ctx.translate(0, cameraY.current);

      // Grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      ctx.lineWidth = 1;
      for (let y = -1000; y < CANVAS_HEIGHT + 200; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }

      // Draw Stack
      stack.current.forEach((block, index) => {
        ctx.fillStyle = block.color;
        ctx.shadowColor = block.color;
        ctx.shadowBlur = index === stack.current.length - 1 ? 12 : 4;

        ctx.beginPath();
        ctx.roundRect(block.x, block.y, block.width, BLOCK_HEIGHT, [4, 4, 0, 0]);
        ctx.fill();

        ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
        ctx.fillRect(block.x, block.y + BLOCK_HEIGHT - 4, block.width, 4);

        ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
        ctx.fillRect(block.x, block.y, block.width, 3);
      });

      // Draw Moving Block
      if (gameState === "playing") {
        const topBlock = stack.current[stack.current.length - 1];
        const nextY = topBlock.y - BLOCK_HEIGHT;
        const curr = currentBlock.current;

        curr.x += curr.speed * curr.direction;
        if (curr.x + curr.width > CANVAS_WIDTH + 40) {
          curr.direction = -1;
        } else if (curr.x < -40) {
          curr.direction = 1;
        }

        const hue = (210 + stack.current.length * 12) % 360;
        const color = `hsl(${hue}, 85%, 60%)`;

        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.roundRect(curr.x, nextY, curr.width, BLOCK_HEIGHT, [4, 4, 0, 0]);
        ctx.fill();

        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.fillRect(curr.x, nextY, curr.width, 3);
      }

      // Draw Debris Pieces
      for (let i = debrisList.current.length - 1; i >= 0; i--) {
        const d = debrisList.current[i];
        d.y += d.vy;
        d.x += d.vx;
        d.vy += 0.35;
        d.rotation += d.vr;
        d.opacity -= 0.015;

        if (d.opacity <= 0 || d.y > CANVAS_HEIGHT + 500) {
          debrisList.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(d.x + d.width / 2, d.y + BLOCK_HEIGHT / 2);
        ctx.rotate(d.rotation);
        ctx.globalAlpha = Math.max(0, d.opacity);
        ctx.fillStyle = d.color;
        ctx.fillRect(-d.width / 2, -BLOCK_HEIGHT / 2, d.width, BLOCK_HEIGHT);
        ctx.restore();
      }

      ctx.restore();

      animFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [gameState]);

  // Spacebar and Keydown Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        if (gameState === "playing") {
          placeBlock();
        } else if (gameState === "start" && nickname.trim()) {
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
  }, [gameState, nickname, placeBlock, initGame]);

  // Submit High Score to Supabase
  useEffect(() => {
    if (gameState === "gameover" && score > 0 && nickname.trim() && !hasSubmittedScore.current) {
      hasSubmittedScore.current = true;

      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem("stack_tower_highscore", score.toString());
        triggerConfetti();
      }

      const submit = async () => {
        try {
          await supabase.from("game_scores").insert({
            nickname: nickname.trim().substring(0, 40),
            game_name: "stack_v1",
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
            <span className="text-[11px] text-slate-400">তলা:</span>
            <span className="text-base font-black text-amber-400 font-mono">{score}</span>
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
            {isFullscreen ? <Minimize className="w-4 h-4 text-blue-400" /> : <Maximize className="w-4 h-4" />}
          </button>
          <GameLeaderboard gameName="stack_v1" />
        </div>
      </div>

      {/* Main Full-Height Play Area */}
      <div 
        className="flex-1 w-full min-h-0 relative flex items-center justify-center p-2 sm:p-4 overflow-hidden cursor-pointer"
        onPointerDown={(e) => {
          e.preventDefault();
          if (gameState === "playing") placeBlock();
        }}
      >
        <div className="relative w-full h-full max-w-[440px] max-h-[640px] rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-800 bg-slate-900 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full h-full object-contain block"
          />

          {/* Live Score Counter HUD */}
          <div className="absolute top-6 left-0 right-0 flex flex-col items-center pointer-events-none z-10">
            <motion.div
              key={score}
              initial={{ scale: 1.2, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-5xl font-black font-display tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
            >
              {score}
            </motion.div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
              তলার সংখ্যা (Floors)
            </div>

            {/* Combo Indicator */}
            <AnimatePresence>
              {comboMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs shadow-lg flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {comboMessage}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Game Over Screen */}
          {gameState === "gameover" && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 z-30">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-xs text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-500/10">
                  <Layers className="w-8 h-8" />
                </div>

                <h2 className="text-2xl font-black font-display text-white mb-1">টাওয়ার ভেঙে পড়েছে!</h2>
                <p className="text-sm text-slate-400 mb-6">পরের বারে নিখুঁত টাইমিং করো</p>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 shadow-inner">
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800/80">
                    <span className="text-sm font-semibold text-slate-400">বর্তমান তলা</span>
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
                  onClick={(e) => {
                    e.stopPropagation();
                    setGameState("playing");
                    initGame();
                    audioSystem.playClick();
                  }}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white font-bold text-base shadow-xl shadow-primary/25 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
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
          gameTitle="স্ট্যাক টাওয়ার (Stack Tower)"
          onStart={handleStartGame}
        />
      )}
    </div>
  );
}
