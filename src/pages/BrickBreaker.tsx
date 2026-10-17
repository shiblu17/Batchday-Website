import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import GameLeaderboard from "@/components/GameLeaderboard";
import GameLoginModal from "@/components/GameLoginModal";
import { audioSystem } from "@/utils/audio";
import { triggerConfetti } from "@/utils/confetti";
import { ArrowLeft, RotateCcw, Trophy, Volume2, VolumeX, Heart, Zap, Maximize, Minimize } from "lucide-react";

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isFireball: boolean;
}

interface Brick {
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  color: string;
}

interface PowerUp {
  x: number;
  y: number;
  type: "multiball" | "wide" | "fireball";
  vy: number;
}

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 580;
const PADDLE_HEIGHT = 12;
const BASE_PADDLE_WIDTH = 80;

export default function BrickBreaker() {
  const [gameState, setGameState] = useState<"start" | "playing" | "gameover">("start");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [nickname, setNickname] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameId = useRef<number>();
  const hasSubmittedScore = useRef(false);

  // Game Engine Refs
  const paddleX = useRef((CANVAS_WIDTH - BASE_PADDLE_WIDTH) / 2);
  const paddleWidth = useRef(BASE_PADDLE_WIDTH);
  const balls = useRef<Ball[]>([]);
  const bricks = useRef<Brick[]>([]);
  const powerUps = useRef<PowerUp[]>([]);

  const playBrickSound = useCallback((freq = 440) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      audioSystem.playCoin();
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("brick_breaker_highscore");
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

  const spawnBricks = useCallback(() => {
    const rows = 5;
    const cols = 7;
    const padding = 6;
    const brickW = (CANVAS_WIDTH - 24 - (cols - 1) * padding) / cols;
    const brickH = 18;
    const startY = 60;

    const newBricks: Brick[] = [];
    const colors = [
      { hp: 3, hex: "#f59e0b" },
      { hp: 2, hex: "#ec4899" },
      { hp: 1, hex: "#06b6d4" },
      { hp: 1, hex: "#10b981" },
      { hp: 1, hex: "#8b5cf6" },
    ];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        newBricks.push({
          x: 12 + c * (brickW + padding),
          y: startY + r * (brickH + padding),
          w: brickW,
          h: brickH,
          hp: colors[r].hp,
          color: colors[r].hex,
        });
      }
    }
    bricks.current = newBricks;
  }, []);

  const initGame = useCallback(() => {
    paddleWidth.current = BASE_PADDLE_WIDTH;
    paddleX.current = (CANVAS_WIDTH - BASE_PADDLE_WIDTH) / 2;
    balls.current = [
      {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT - 60,
        vx: 3 * (Math.random() > 0.5 ? 1 : -1),
        vy: -4.5,
        radius: 6,
        isFireball: false,
      },
    ];
    powerUps.current = [];
    setLives(3);
    setScore(0);
    hasSubmittedScore.current = false;
    spawnBricks();
  }, [spawnBricks]);

  // Main Render & Physics
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      if (gameState === "playing") {
        for (let i = balls.current.length - 1; i >= 0; i--) {
          const ball = balls.current[i];
          ball.x += ball.vx;
          ball.y += ball.vy;

          if (ball.x - ball.radius <= 0) {
            ball.x = ball.radius;
            ball.vx = Math.abs(ball.vx);
          } else if (ball.x + ball.radius >= CANVAS_WIDTH) {
            ball.x = CANVAS_WIDTH - ball.radius;
            ball.vx = -Math.abs(ball.vx);
          }
          if (ball.y - ball.radius <= 0) {
            ball.y = ball.radius;
            ball.vy = Math.abs(ball.vy);
          }

          const pLeft = paddleX.current;
          const pRight = paddleX.current + paddleWidth.current;
          const pTop = CANVAS_HEIGHT - 35;

          if (
            ball.y + ball.radius >= pTop &&
            ball.y - ball.radius <= pTop + PADDLE_HEIGHT &&
            ball.x >= pLeft - 4 &&
            ball.x <= pRight + 4 &&
            ball.vy > 0
          ) {
            ball.vy = -Math.abs(ball.vy);
            const hitOffset = (ball.x - (pLeft + paddleWidth.current / 2)) / (paddleWidth.current / 2);
            ball.vx = hitOffset * 5.5;
            audioSystem.playClick();
          }

          for (let bIndex = bricks.current.length - 1; bIndex >= 0; bIndex--) {
            const brick = bricks.current[bIndex];
            if (
              ball.x + ball.radius >= brick.x &&
              ball.x - ball.radius <= brick.x + brick.w &&
              ball.y + ball.radius >= brick.y &&
              ball.y - ball.radius <= brick.y + brick.h
            ) {
              if (!ball.isFireball) {
                ball.vy = -ball.vy;
              }

              brick.hp -= 1;
              playBrickSound(350 + (5 - brick.hp) * 100);
              setScore((s) => s + 15);

              if (brick.hp <= 0) {
                bricks.current.splice(bIndex, 1);

                if (Math.random() < 0.25) {
                  const types: ("multiball" | "wide" | "fireball")[] = ["multiball", "wide", "fireball"];
                  powerUps.current.push({
                    x: brick.x + brick.w / 2,
                    y: brick.y + brick.h / 2,
                    type: types[Math.floor(Math.random() * types.length)],
                    vy: 2.2,
                  });
                }
              }
              break;
            }
          }

          if (ball.y - ball.radius > CANVAS_HEIGHT) {
            balls.current.splice(i, 1);
          }
        }

        if (balls.current.length === 0) {
          setLives((l) => {
            const nextLives = l - 1;
            if (nextLives <= 0) {
              audioSystem.playGameOver();
              setGameState("gameover");
            } else {
              balls.current = [
                {
                  x: CANVAS_WIDTH / 2,
                  y: CANVAS_HEIGHT - 60,
                  vx: 3 * (Math.random() > 0.5 ? 1 : -1),
                  vy: -4.5,
                  radius: 6,
                  isFireball: false,
                },
              ];
            }
            return nextLives;
          });
        }

        if (bricks.current.length === 0) {
          triggerConfetti();
          setScore((s) => s + 200);
          spawnBricks();
        }

        for (let pIdx = powerUps.current.length - 1; pIdx >= 0; pIdx--) {
          const p = powerUps.current[pIdx];
          p.y += p.vy;

          const pLeft = paddleX.current;
          const pRight = paddleX.current + paddleWidth.current;
          const pTop = CANVAS_HEIGHT - 35;

          if (p.y >= pTop && p.y <= pTop + PADDLE_HEIGHT + 10 && p.x >= pLeft && p.x <= pRight) {
            audioSystem.playCoin();
            if (p.type === "multiball" && balls.current[0]) {
              const base = balls.current[0];
              balls.current.push(
                { ...base, vx: -3.5, vy: -4 },
                { ...base, vx: 3.5, vy: -4 }
              );
            } else if (p.type === "wide") {
              paddleWidth.current = Math.min(130, paddleWidth.current + 25);
              setTimeout(() => {
                paddleWidth.current = BASE_PADDLE_WIDTH;
              }, 8000);
            } else if (p.type === "fireball") {
              balls.current.forEach((b) => (b.isFireball = true));
              setTimeout(() => {
                balls.current.forEach((b) => (b.isFireball = false));
              }, 6000);
            }
            powerUps.current.splice(pIdx, 1);
            continue;
          }

          if (p.y > CANVAS_HEIGHT + 20) {
            powerUps.current.splice(pIdx, 1);
          }
        }
      }

      // Draw Bricks
      bricks.current.forEach((brick) => {
        ctx.shadowColor = brick.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = brick.color;
        ctx.beginPath();
        ctx.roundRect(brick.x, brick.y, brick.w, brick.h, 4);
        ctx.fill();

        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.fillRect(brick.x + 2, brick.y + 2, brick.w - 4, 3);
      });

      // Draw Paddle
      const pLeft = paddleX.current;
      const pTop = CANVAS_HEIGHT - 35;
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.roundRect(pLeft, pTop, paddleWidth.current, PADDLE_HEIGHT, 6);
      ctx.fill();

      // Draw Balls
      balls.current.forEach((ball) => {
        ctx.shadowColor = ball.isFireball ? "#ef4444" : "#ffffff";
        ctx.shadowBlur = 12;
        ctx.fillStyle = ball.isFireball ? "#f97316" : "#ffffff";
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Powerups
      powerUps.current.forEach((p) => {
        ctx.shadowColor = p.type === "fireball" ? "#ef4444" : p.type === "wide" ? "#10b981" : "#3b82f6";
        ctx.shadowBlur = 10;
        ctx.fillStyle = p.type === "fireball" ? "#ef4444" : p.type === "wide" ? "#10b981" : "#3b82f6";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
        ctx.fill();
      });

      animFrameId.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [gameState, playBrickSound, spawnBricks]);

  // Touch and Mouse Paddle Movement
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const scale = CANVAS_WIDTH / rect.width;
    const x = clientX * scale - paddleWidth.current / 2;
    paddleX.current = Math.max(0, Math.min(CANVAS_WIDTH - paddleWidth.current, x));
  };

  // Submit High Score to Supabase
  useEffect(() => {
    if (gameState === "gameover" && score > 0 && nickname.trim() && !hasSubmittedScore.current) {
      hasSubmittedScore.current = true;

      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem("brick_breaker_highscore", score.toString());
        triggerConfetti();
      }

      const submit = async () => {
        try {
          await supabase.from("game_scores").insert({
            nickname: nickname.trim().substring(0, 40),
            game_name: "brick_breaker_v1",
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

        {/* Live HUD: Lives & Score */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {[...Array(3)].map((_, i) => (
              <Heart
                key={i}
                className={`w-4 h-4 ${i < lives ? "text-rose-500 fill-rose-500" : "text-slate-700"}`}
              />
            ))}
          </div>

          <div className="px-3 py-1 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-sm font-black text-amber-400 font-mono">{score} PTS</span>
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
            {isFullscreen ? <Minimize className="w-4 h-4 text-amber-400" /> : <Maximize className="w-4 h-4" />}
          </button>
          <GameLeaderboard gameName="brick_breaker_v1" />
        </div>
      </div>

      {/* Main Full-Height Play Area */}
      <div 
        className="flex-1 w-full min-h-0 relative flex items-center justify-center p-2 sm:p-4 overflow-hidden"
        onPointerMove={handlePointerMove}
      >
        <div className="relative w-full h-full max-w-[440px] max-h-[620px] rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-800 bg-slate-900 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full h-full object-contain block cursor-ew-resize"
          />

          {/* Game Over Screen */}
          {gameState === "gameover" && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 z-30">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-xs text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/10">
                  <Zap className="w-8 h-8" />
                </div>

                <h2 className="text-2xl font-black font-display text-white mb-1">বল ড্রপ হয়েছে!</h2>
                <p className="text-sm text-slate-400 mb-6">প্যাডেল দিয়ে বল রিবাউন্ড করো</p>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 shadow-inner">
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800/80">
                    <span className="text-sm font-semibold text-slate-400">সর্বমোট স্কোর</span>
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
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-base shadow-xl shadow-amber-500/25 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
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
          gameTitle="ব্রিক ব্রেকার (Brick Breaker)"
          onStart={handleStartGame}
        />
      )}
    </div>
  );
}
