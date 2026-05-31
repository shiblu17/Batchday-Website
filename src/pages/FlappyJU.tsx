import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import GameLeaderboard from "@/components/GameLeaderboard";
import GameLoginModal from "@/components/GameLoginModal";
import { Play, RotateCcw, Trophy, Gamepad2 } from "lucide-react";

const GRAVITY = 0.4;
const JUMP = -7;
const PIPE_SPEED = 2.2;
const PIPE_WIDTH = 60;
const PIPE_GAP = 220;
const BIRD_SIZE = 34;
const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;

interface PipeData {
  x: number;
  topHeight: number;
  passed: boolean;
}

export default function FlappyJU() {
  const [gameState, setGameState] = useState<"start" | "playing" | "gameover">("start");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [nickname, setNickname] = useState("");

  // Refs for high performance physics without React re-renders lag
  const birdY = useRef(GAME_HEIGHT / 2);
  const birdVelocity = useRef(0);
  const pipes = useRef<PipeData[]>([]);
  const gameLoop = useRef<number>();

  const birdRef = useRef<HTMLDivElement>(null);
  const pipesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("flappy_ju_highscore");
    if (saved) setHighScore(parseInt(saved, 10));
    
    const savedNick = localStorage.getItem("ju_game_nickname_v2");
    if (savedNick) setNickname(savedNick);
  }, []);

  const jump = useCallback((e?: React.MouseEvent | React.PointerEvent) => {
    if (gameState === "start") {
      if (!nickname.trim()) return;
      setGameState("playing");
      birdY.current = GAME_HEIGHT / 2;
      birdVelocity.current = JUMP;
      pipes.current = [];
      setScore(0);
    } else if (gameState === "playing") {
      birdVelocity.current = JUMP;
    } else if (gameState === "gameover") {
      setGameState("start");
    }
  }, [gameState, nickname]);

  // Handle Spacebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger spacebar jump if typing nickname
      if (e.code === "Space" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [jump]);

  const updatePhysics = useCallback(() => {
    if (gameState !== "playing") return;

    // Apply gravity
    birdVelocity.current += GRAVITY;
    birdY.current += birdVelocity.current;

    // Floor & Ceiling collision
    if (birdY.current >= GAME_HEIGHT - BIRD_SIZE) {
      birdY.current = GAME_HEIGHT - BIRD_SIZE;
      endGame();
    }
    if (birdY.current <= 0) {
      birdY.current = 0;
      birdVelocity.current = 0;
    }

    // Pipe logic
    let currentPipes = pipes.current;
    
    // Spawn new pipes
    if (currentPipes.length === 0 || currentPipes[currentPipes.length - 1].x < GAME_WIDTH - 220) {
      const topHeight = Math.random() * (GAME_HEIGHT - PIPE_GAP - 100) + 50;
      currentPipes.push({
        x: GAME_WIDTH,
        topHeight,
        passed: false,
      });
    }

    // Move pipes and check collisions
    let collision = false;
    currentPipes.forEach((p) => {
      p.x -= PIPE_SPEED;

      // Hitbox logic (make it forgiving)
      const hitboxMarginX = 6;
      const hitboxMarginY = 6;
      
      const birdRect = {
        left: 50 + hitboxMarginX,
        right: 50 + BIRD_SIZE - hitboxMarginX,
        top: birdY.current + hitboxMarginY,
        bottom: birdY.current + BIRD_SIZE - hitboxMarginY,
      };

      const topPipeRect = {
        left: p.x,
        right: p.x + PIPE_WIDTH,
        top: 0,
        bottom: p.topHeight,
      };

      const bottomPipeRect = {
        left: p.x,
        right: p.x + PIPE_WIDTH,
        top: p.topHeight + PIPE_GAP,
        bottom: GAME_HEIGHT,
      };

      const intersect = (r1: any, r2: any) => {
        return !(
          r2.left > r1.right ||
          r2.right < r1.left ||
          r2.top > r1.bottom ||
          r2.bottom < r1.top
        );
      };

      if (intersect(birdRect, topPipeRect) || intersect(birdRect, bottomPipeRect)) {
        collision = true;
      }

      // Score logic
      if (!p.passed && p.x + PIPE_WIDTH < 50) {
        p.passed = true;
        setScore((s) => s + 1);
      }
    });

    if (collision) {
      endGame();
      return;
    }

    // Filter out off-screen pipes
    pipes.current = currentPipes.filter((p) => p.x > -PIPE_WIDTH);

    // Update DOM directly for max performance 60fps
    if (birdRef.current) {
      birdRef.current.style.transform = `translateY(${birdY.current}px) rotate(${Math.min(birdVelocity.current * 3, 90)}deg)`;
    }

    if (pipesRef.current) {
      pipesRef.current.innerHTML = pipes.current
        .map(
          (p) => `
        <div style="position:absolute; left:${p.x}px; top:0; width:${PIPE_WIDTH}px; height:${p.topHeight}px; background:linear-gradient(to right, #4ade80, #22c55e); border:3px solid #14532d; border-radius:4px"></div>
        <div style="position:absolute; left:${p.x}px; top:${p.topHeight + PIPE_GAP}px; width:${PIPE_WIDTH}px; height:${GAME_HEIGHT - (p.topHeight + PIPE_GAP)}px; background:linear-gradient(to right, #4ade80, #22c55e); border:3px solid #14532d; border-radius:4px"></div>
      `
        )
        .join("");
    }

    gameLoop.current = requestAnimationFrame(updatePhysics);
  }, [gameState]);

  const endGame = () => {
    setGameState("gameover");
    setScore((currentScore) => {
      if (currentScore > highScore) {
        setHighScore(currentScore);
        localStorage.setItem("flappy_ju_highscore", currentScore.toString());
      }
      
      // Submit score silently to Supabase if valid
      if (currentScore > 0 && nickname.trim() !== "") {
        supabase.from("game_scores").insert({
          nickname: nickname.trim().substring(0, 40),
          game_name: "flappy_v2",
          score: currentScore
        }).then();
      }
      
      return currentScore;
    });
  };

  useEffect(() => {
    if (gameState === "playing") {
      gameLoop.current = requestAnimationFrame(updatePhysics);
    }
    return () => {
      if (gameLoop.current) cancelAnimationFrame(gameLoop.current);
    };
  }, [gameState, updatePhysics]);

  return (
    <div className="container max-w-lg py-6 pb-24 md:pb-8 flex flex-col items-center">
      <div className="w-full mb-4 flex justify-between items-center px-2">
        <div>
          <h1 className="font-display text-2xl font-bold">JU জোন 🎮</h1>
          <p className="text-sm text-muted-foreground">Flappy Student</p>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl font-bold text-primary">{score}</p>
          <p className="text-xs text-muted-foreground font-semibold flex items-center justify-end gap-1">
            <Trophy className="h-3 w-3 text-amber-500" /> Best: {highScore}
          </p>
        </div>
      </div>

      <div
        className="relative overflow-hidden rounded-2xl border-4 border-input shadow-card w-full bg-sky-200 cursor-pointer select-none"
        style={{ height: GAME_HEIGHT, maxWidth: GAME_WIDTH }}
        onPointerDown={(e) => {
          if ((e.target as Element).closest('button, input, select, .z-20, .z-50')) return;
          jump(e);
        }}
      >
        {/* Sky Background Elements */}
        <div className="absolute top-10 left-10 w-20 h-10 bg-white/60 rounded-full blur-md" />
        <div className="absolute top-24 right-10 w-24 h-12 bg-white/50 rounded-full blur-md" />
        
        {/* City/Campus Silhouette */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-primary/10" style={{ clipPath: 'polygon(0% 100%, 0% 80%, 10% 90%, 20% 60%, 40% 70%, 50% 40%, 70% 80%, 80% 60%, 100% 70%, 100% 100%)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-primary/20" style={{ clipPath: 'polygon(0% 100%, 0% 50%, 15% 40%, 30% 70%, 45% 30%, 60% 60%, 80% 20%, 100% 50%, 100% 100%)' }} />

        {/* Game Elements (Rendered Directly bypasses React re-render lag) */}
        {gameState === "playing" && <div ref={pipesRef} className="absolute inset-0 pointer-events-none" />}
        
        {/* Player Bird */}
        {(gameState === "playing" || gameState === "start") && (
          <div
            ref={birdRef}
            className="absolute left-[50px] z-10 flex items-center justify-center bg-primary rounded-lg text-white shadow-lg shadow-primary/30"
            style={{ width: BIRD_SIZE, height: BIRD_SIZE, top: gameState === "start" ? GAME_HEIGHT / 2 : 0, transition: gameState === "start" ? "none" : "transform 0.1s linear" }}
          >
            🚌
          </div>
        )}

        {/* UI Overlays */}
        {gameState === "start" && !nickname && (
          <GameLoginModal 
            gameTitle="Flappy Student" 
            onStart={(name) => {
              setNickname(name);
              localStorage.setItem("ju_game_nickname_v2", name);
              // Instead of calling jump() which might not work well with synthetic events inside onStart,
              // we can set the state directly
              setGameState("playing");
              birdY.current = GAME_HEIGHT / 2;
              birdVelocity.current = JUMP;
              pipes.current = [];
              setScore(0);
            }} 
          />
        )}
        
        {gameState === "start" && nickname && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-20"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card p-6 rounded-3xl text-center shadow-2xl max-w-[80%] border-2 border-border"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary mb-4 shadow-lg">
                <Gamepad2 className="h-8 w-8 text-primary-foreground" />
              </div>
              <h2 className="font-display text-2xl font-black mb-2">Flappy Student</h2>
              <p className="text-sm text-muted-foreground mb-6">
                স্বাগতম, <strong className="text-primary text-lg">{nickname}</strong>!
              </p>

              <button 
                 onClick={jump}
                 className="w-full mb-3 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-display font-bold text-lg shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                শুরু করো 🚀
              </button>
              
              <button 
                 onClick={(e) => {
                   e.stopPropagation();
                   localStorage.removeItem("ju_game_nickname_v2");
                   setNickname("");
                 }}
                 className="w-full text-xs text-muted-foreground hover:text-primary transition-colors mb-4 font-semibold"
              >
                নাম পরিবর্তন করুন
              </button>
              
              <div className="border-t border-border pt-4">
                <GameLeaderboard gameName="flappy_v2" ascending={false} />
              </div>
            </motion.div>
          </div>
        )}

        {gameState === "gameover" && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-20"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotate: -5 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              className="bg-card p-6 rounded-2xl text-center shadow-2xl max-w-[80%] border-2 border-border"
            >
              <h2 className="font-display text-3xl font-bold text-destructive mb-1">গেম ওভার!</h2>
              <p className="text-muted-foreground mb-6 text-sm">আবার চেষ্টা করো</p>
              
              <div className="bg-muted rounded-xl p-4 mb-6">
                <p className="text-sm text-muted-foreground uppercase font-bold tracking-wider mb-1">তোমার স্কোর</p>
                <p className="font-display text-4xl font-black text-primary">{score}</p>
              </div>

              <button onClick={jump} className="w-full flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-secondary text-secondary-foreground font-display font-bold shadow-md hover:scale-105 active:scale-95 transition-all mb-4">
                <RotateCcw className="h-5 w-5" />
                আবার খেলো
              </button>
              
              <div className="flex justify-center">
                <GameLeaderboard gameName="flappy_v2" ascending={false} />
              </div>
            </motion.div>
          </div>
        )}
      </div>
      <p className="text-center text-xs text-muted-foreground mt-4">Spacebar চেপে অথবা স্ক্রিনে ট্যাপ করে খেলো</p>
    </div>
  );
}
