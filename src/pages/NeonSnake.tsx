import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import GameLeaderboard from "@/components/GameLeaderboard";
import GameLoginModal from "@/components/GameLoginModal";
import { audioSystem } from "@/utils/audio";
import { triggerConfetti } from "@/utils/confetti";
import { ArrowLeft, RotateCcw, Trophy, Volume2, VolumeX, Sparkles, ArrowUp, ArrowDown, ArrowLeft as ArrowLeftIcon, ArrowRight, Maximize, Minimize } from "lucide-react";

interface Point {
  x: number;
  y: number;
}

interface BonusFood extends Point {
  timer: number;
}

const GRID_SIZE = 20;
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 440;
const COLS = Math.floor(CANVAS_WIDTH / GRID_SIZE);
const ROWS = Math.floor(CANVAS_HEIGHT / GRID_SIZE);

export default function NeonSnake() {
  const [gameState, setGameState] = useState<"start" | "playing" | "gameover">("start");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [nickname, setNickname] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameInterval = useRef<NodeJS.Timeout>();
  const hasSubmittedScore = useRef(false);

  // Snake State Refs
  const snake = useRef<Point[]>([
    { x: 10, y: 11 },
    { x: 10, y: 12 },
    { x: 10, y: 13 },
  ]);
  const direction = useRef<Point>({ x: 0, y: -1 });
  const nextDirection = useRef<Point>({ x: 0, y: -1 });
  const food = useRef<Point>({ x: 10, y: 5 });
  const bonusFood = useRef<BonusFood | null>(null);
  const speed = useRef(110); // ms per tick

  // Touch Swipe coordinates
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("neon_snake_highscore");
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

  const spawnFood = useCallback(() => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * COLS),
        y: Math.floor(Math.random() * ROWS),
      };
      const onSnake = snake.current.some((seg) => seg.x === newFood.x && seg.y === newFood.y);
      if (!onSnake) break;
    }
    food.current = newFood;

    // Chance to spawn bonus food (every ~4-5 regular foods)
    if (Math.random() < 0.28 && !bonusFood.current) {
      let bFood: Point;
      while (true) {
        bFood = {
          x: Math.floor(Math.random() * COLS),
          y: Math.floor(Math.random() * ROWS),
        };
        const onSnake = snake.current.some((seg) => seg.x === bFood.x && seg.y === bFood.y);
        const onRegular = bFood.x === newFood.x && bFood.y === newFood.y;
        if (!onSnake && !onRegular) break;
      }
      bonusFood.current = { ...bFood, timer: 60 };
    }
  }, []);

  const initGame = useCallback(() => {
    snake.current = [
      { x: 10, y: 11 },
      { x: 10, y: 12 },
      { x: 10, y: 13 },
    ];
    direction.current = { x: 0, y: -1 };
    nextDirection.current = { x: 0, y: -1 };
    bonusFood.current = null;
    speed.current = 110;
    setScore(0);
    hasSubmittedScore.current = false;
    spawnFood();
  }, [spawnFood]);

  const changeDirection = useCallback((newDir: Point) => {
    if (newDir.x !== 0 && direction.current.x === -newDir.x) return;
    if (newDir.y !== 0 && direction.current.y === -newDir.y) return;
    nextDirection.current = newDir;
  }, []);

  // Tick logic
  const gameTick = useCallback(() => {
    direction.current = nextDirection.current;
    const head = {
      x: snake.current[0].x + direction.current.x,
      y: snake.current[0].y + direction.current.y,
    };

    // Wall collision
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      audioSystem.playGameOver();
      setGameState("gameover");
      return;
    }

    // Self collision
    if (snake.current.some((seg) => seg.x === head.x && seg.y === head.y)) {
      audioSystem.playGameOver();
      setGameState("gameover");
      return;
    }

    // Move forward
    const newSnake = [head, ...snake.current];

    // Check regular food
    if (head.x === food.current.x && head.y === food.current.y) {
      audioSystem.playCoin();
      setScore((s) => s + 10);
      speed.current = Math.max(65, speed.current - 1.5);
      spawnFood();
    }
    // Check bonus food
    else if (bonusFood.current && head.x === bonusFood.current.x && head.y === bonusFood.current.y) {
      audioSystem.playJump();
      setScore((s) => s + 50);
      bonusFood.current = null;
    } else {
      newSnake.pop();
    }

    // Tick bonus food timer
    if (bonusFood.current) {
      bonusFood.current.timer -= 1;
      if (bonusFood.current.timer <= 0) bonusFood.current = null;
    }

    snake.current = newSnake;
  }, [spawnFood]);

  // Game Loop interval
  useEffect(() => {
    if (gameState === "playing") {
      gameInterval.current = setInterval(gameTick, speed.current);
    }
    return () => {
      if (gameInterval.current) clearInterval(gameInterval.current);
    };
  }, [gameState, gameTick]);

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Grid lines
      ctx.strokeStyle = "rgba(0, 255, 204, 0.04)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }

      // Food
      const fx = food.current.x * GRID_SIZE + GRID_SIZE / 2;
      const fy = food.current.y * GRID_SIZE + GRID_SIZE / 2;
      ctx.shadowColor = "#f43f5e";
      ctx.shadowBlur = 15;
      ctx.fillStyle = "#f43f5e";
      ctx.beginPath();
      ctx.arc(fx, fy, GRID_SIZE / 2 - 2, 0, Math.PI * 2);
      ctx.fill();

      // Bonus Food
      if (bonusFood.current) {
        const bx = bonusFood.current.x * GRID_SIZE + GRID_SIZE / 2;
        const by = bonusFood.current.y * GRID_SIZE + GRID_SIZE / 2;
        ctx.shadowColor = "#eab308";
        ctx.shadowBlur = 20;
        ctx.fillStyle = "#facc15";
        ctx.beginPath();
        ctx.arc(bx, by, GRID_SIZE / 2 - 1, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(bx, by, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Snake
      snake.current.forEach((seg, index) => {
        const sx = seg.x * GRID_SIZE;
        const sy = seg.y * GRID_SIZE;
        const isHead = index === 0;

        ctx.shadowColor = isHead ? "#38bdf8" : "#06b6d4";
        ctx.shadowBlur = isHead ? 16 : 8;

        const hue = (180 + (index * 3)) % 360;
        ctx.fillStyle = isHead ? "#38bdf8" : `hsl(${hue}, 90%, 55%)`;

        ctx.beginPath();
        ctx.roundRect(sx + 1, sy + 1, GRID_SIZE - 2, GRID_SIZE - 2, isHead ? 6 : 4);
        ctx.fill();

        if (isHead) {
          ctx.fillStyle = "#ffffff";
          const eyeSize = 3;
          let e1 = { x: sx + 4, y: sy + 4 };
          let e2 = { x: sx + GRID_SIZE - 7, y: sy + 4 };

          if (direction.current.y === 1) {
            e1 = { x: sx + 4, y: sy + GRID_SIZE - 7 };
            e2 = { x: sx + GRID_SIZE - 7, y: sy + GRID_SIZE - 7 };
          } else if (direction.current.x === -1) {
            e1 = { x: sx + 4, y: sy + 4 };
            e2 = { x: sx + 4, y: sy + GRID_SIZE - 7 };
          } else if (direction.current.x === 1) {
            e1 = { x: sx + GRID_SIZE - 7, y: sy + 4 };
            e2 = { x: sx + GRID_SIZE - 7, y: sy + GRID_SIZE - 7 };
          }

          ctx.fillRect(e1.x, e1.y, eyeSize, eyeSize);
          ctx.fillRect(e2.x, e2.y, eyeSize, eyeSize);
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT") return;

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault();
          changeDirection({ x: 0, y: -1 });
          break;
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault();
          changeDirection({ x: 0, y: 1 });
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          e.preventDefault();
          changeDirection({ x: -1, y: 0 });
          break;
        case "ArrowRight":
        case "d":
        case "D":
          e.preventDefault();
          changeDirection({ x: 1, y: 0 });
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [changeDirection]);

  // Touch Swipe Support
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (Math.max(absX, absY) > 20) {
      if (absX > absY) {
        changeDirection(dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 });
      } else {
        changeDirection(dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 });
      }
    }
    touchStart.current = null;
  };

  // Submit High Score to Supabase
  useEffect(() => {
    if (gameState === "gameover" && score > 0 && nickname.trim() && !hasSubmittedScore.current) {
      hasSubmittedScore.current = true;

      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem("neon_snake_highscore", score.toString());
        triggerConfetti();
      }

      const submit = async () => {
        try {
          await supabase.from("game_scores").insert({
            nickname: nickname.trim().substring(0, 40),
            game_name: "snake_v1",
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

        {/* Live Score Counter in Top Header */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">স্কোর:</span>
            <span className="text-base font-black text-cyan-400 font-mono">{score}</span>
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
            {isFullscreen ? <Minimize className="w-4 h-4 text-cyan-400" /> : <Maximize className="w-4 h-4" />}
          </button>
          <GameLeaderboard gameName="snake_v1" />
        </div>
      </div>

      {/* Main Full-Height Play Area */}
      <div className="flex-1 w-full min-h-0 relative flex items-center justify-center p-2 sm:p-4 overflow-hidden">
        <div
          className="relative w-full h-full max-w-[480px] max-h-[500px] rounded-3xl overflow-hidden shadow-2xl border-2 border-cyan-900/50 bg-slate-900 flex items-center justify-center"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full h-full object-contain block"
          />

          {/* Game Over Screen */}
          {gameState === "gameover" && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 z-30">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-xs text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/10">
                  <Sparkles className="w-8 h-8" />
                </div>

                <h2 className="text-2xl font-black font-display text-white mb-1">সাপ দেয়ালে লেগেছে!</h2>
                <p className="text-sm text-slate-400 mb-6">রিফ্লেক্স আরো শার্প করো</p>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 shadow-inner">
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800/80">
                    <span className="text-sm font-semibold text-slate-400">বর্তমান স্কোর</span>
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
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-base shadow-xl shadow-cyan-500/25 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  আবার খেলো (Replay)
                </button>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Virtual D-Pad - Bottom Fixed */}
      <div className="w-full max-w-[280px] mx-auto grid grid-cols-3 gap-1.5 shrink-0 px-2 pb-3 pt-1 z-20">
        <div />
        <button
          onClick={() => changeDirection({ x: 0, y: -1 })}
          className="h-11 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 active:bg-cyan-500/20 active:text-cyan-400 active:border-cyan-500/50 flex items-center justify-center shadow-md active:scale-95 transition-all"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
        <div />

        <button
          onClick={() => changeDirection({ x: -1, y: 0 })}
          className="h-11 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 active:bg-cyan-500/20 active:text-cyan-400 active:border-cyan-500/50 flex items-center justify-center shadow-md active:scale-95 transition-all"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => changeDirection({ x: 0, y: 1 })}
          className="h-11 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 active:bg-cyan-500/20 active:text-cyan-400 active:border-cyan-500/50 flex items-center justify-center shadow-md active:scale-95 transition-all"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
        <button
          onClick={() => changeDirection({ x: 1, y: 0 })}
          className="h-11 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 active:bg-cyan-500/20 active:text-cyan-400 active:border-cyan-500/50 flex items-center justify-center shadow-md active:scale-95 transition-all"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Start Game Modal - Outside Any Sub-container */}
      {gameState === "start" && (
        <GameLoginModal
          gameTitle="নিওন স্নেক আর্কেড (Neon Snake)"
          onStart={handleStartGame}
        />
      )}
    </div>
  );
}
