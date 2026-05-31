import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import GameLeaderboard from "@/components/GameLeaderboard";
import GameLoginModal from "@/components/GameLoginModal";
import { ArrowLeft, RotateCcw, Footprints, Trophy, Keyboard } from "lucide-react";

const GRAVITY = 0.8;
const JUMP_VELOCITY = -14;
const BASE_SPEED = 5;
const GAME_WIDTH = 600;
const GAME_HEIGHT = 200;
const GROUND_Y = 160;
const PLAYER_SIZE = 40;

const OBSTACLES = ["🐒", "🐕", "🛺", "📚"];

interface ObstacleData {
  id: number;
  x: number;
  emoji: string;
  passed: boolean;
}

export default function DinoRun() {
  const [gameState, setGameState] = useState<"start" | "playing" | "gameover">("start");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [nickname, setNickname] = useState("");

  // Refs for high performance physics without React re-renders
  const playerY = useRef(GROUND_Y - PLAYER_SIZE);
  const playerVelocity = useRef(0);
  const obstacles = useRef<ObstacleData[]>([]);
  const gameLoop = useRef<number>();
  const frameCount = useRef(0);
  const currentSpeed = useRef(BASE_SPEED);

  const playerRef = useRef<HTMLDivElement>(null);
  const obstaclesRef = useRef<HTMLDivElement>(null);
  const hasSubmittedScore = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem("dinorun_ju_highscore");
    if (saved) setHighScore(parseInt(saved, 10));
    
    const savedNick = localStorage.getItem("ju_game_nickname_v2");
    if (savedNick) setNickname(savedNick);
  }, []);

  const jump = useCallback((e?: React.MouseEvent | React.PointerEvent) => {
    if (gameState === "start") {
      if (!nickname.trim()) return;
      setGameState("playing");
      playerY.current = GROUND_Y - PLAYER_SIZE;
      playerVelocity.current = 0;
      obstacles.current = [];
      frameCount.current = 0;
      currentSpeed.current = BASE_SPEED;
      setScore(0);
      hasSubmittedScore.current = false;
    } else if (gameState === "playing") {
      // Only jump if on the ground
      if (playerY.current >= GROUND_Y - PLAYER_SIZE - 2) {
        playerVelocity.current = JUMP_VELOCITY;
      }
    } else if (gameState === "gameover") {
      setGameState("start");
    }
  }, [gameState, nickname]);

  // Handle Spacebar & Up Arrow
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent jump if typing in input
      if ((e.code === "Space" || e.code === "ArrowUp") && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [jump]);

  const updatePhysics = useCallback(() => {
    if (gameState !== "playing") return;

    frameCount.current += 1;
    
    // Increase speed slightly over time
    if (frameCount.current % 500 === 0) {
      currentSpeed.current += 0.5;
    }

    // Apply gravity
    playerVelocity.current += GRAVITY;
    playerY.current += playerVelocity.current;

    // Ground collision
    if (playerY.current >= GROUND_Y - PLAYER_SIZE) {
      playerY.current = GROUND_Y - PLAYER_SIZE;
      playerVelocity.current = 0;
    }

    let currentObstacles = obstacles.current;

    // Spawn new obstacles randomly
    const lastObstacle = currentObstacles[currentObstacles.length - 1];
    const distanceSinceLast = lastObstacle ? GAME_WIDTH - lastObstacle.x : GAME_WIDTH;
    
    if (currentObstacles.length === 0 || (distanceSinceLast > 250 && Math.random() < 0.02)) {
      currentObstacles.push({
        id: Date.now(),
        x: GAME_WIDTH,
        emoji: OBSTACLES[Math.floor(Math.random() * OBSTACLES.length)],
        passed: false
      });
    }

    // Move obstacles & Check collisions
    let collision = false;
    currentObstacles.forEach((obs) => {
      obs.x -= currentSpeed.current;

      // Hitbox logic (forgiving hitboxes)
      const pRect = {
        left: 50 + 10,
        right: 50 + PLAYER_SIZE - 10,
        top: playerY.current + 5,
        bottom: playerY.current + PLAYER_SIZE - 5,
      };

      const obsRect = {
        left: obs.x + 8,
        right: obs.x + 35 - 8,
        top: GROUND_Y - 35 + 8,
        bottom: GROUND_Y,
      };

      const intersect = (r1: any, r2: any) => {
        return !(
          r2.left > r1.right ||
          r2.right < r1.left ||
          r2.top > r1.bottom ||
          r2.bottom < r1.top
        );
      };

      if (intersect(pRect, obsRect)) {
        collision = true;
      }

      // Score logic
      if (!obs.passed && obs.x < 50) {
        obs.passed = true;
      }
    });

    if (collision) {
      endGame();
      return;
    }

    // Update Score based on frames survived
    if (frameCount.current % 10 === 0) {
      setScore((s) => s + 1);
    }

    // Filter out off-screen obstacles
    obstacles.current = currentObstacles.filter((obs) => obs.x > -50);

    // Update DOM directly for max performance 60fps
    if (playerRef.current) {
      playerRef.current.style.transform = `translateY(${playerY.current}px)`;
    }

    if (obstaclesRef.current) {
      obstaclesRef.current.innerHTML = obstacles.current
        .map(
          (obs) => `
        <div style="position:absolute; left:${obs.x}px; top:${GROUND_Y - 35}px; font-size:32px; line-height:1;">
          ${obs.emoji}
        </div>
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
        localStorage.setItem("dinorun_ju_highscore", currentScore.toString());
      }
      return currentScore;
    });
  };

  useEffect(() => {
    if (gameState === "gameover" && score > 0 && nickname.trim() !== "" && !hasSubmittedScore.current) {
      hasSubmittedScore.current = true;
      const submitScore = async () => {
        const finalName = nickname.trim().substring(0, 40);
        await supabase.from("game_scores").insert({
          nickname: finalName,
          game_name: "dinorun_v3",
          score: score
        });
      };
      submitScore();
    }
  }, [gameState, score, nickname]);

  useEffect(() => {
    if (gameState === "playing") {
      gameLoop.current = requestAnimationFrame(updatePhysics);
    }
    return () => {
      if (gameLoop.current) cancelAnimationFrame(gameLoop.current);
    };
  }, [gameState, updatePhysics]);

  return (
    <div className="container max-w-2xl py-6 pb-24 md:pb-8 flex flex-col items-center min-h-[80vh]">
      <div className="w-full mb-6 max-w-2xl">
        <Link to="/game" className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          গেম জোনে ফেরত
        </Link>
        <div className="flex justify-between items-end px-2">
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2">
              <Footprints className="w-6 h-6 text-orange-500" />
              জাবি রানার 🏃
            </h1>
            <p className="text-sm text-muted-foreground">ক্যাম্পাসের বাধা পার হও!</p>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl font-black text-primary">{String(score).padStart(5, '0')}</p>
            <p className="text-xs text-muted-foreground font-semibold flex items-center justify-end gap-1">
              <Trophy className="h-3 w-3 text-amber-500" /> HI: {String(highScore).padStart(5, '0')}
            </p>
          </div>
        </div>
      </div>

      <div
        className="relative overflow-hidden rounded-3xl border-2 border-border shadow-card w-full bg-surface cursor-pointer select-none"
        style={{ height: GAME_HEIGHT, maxWidth: "100%" }}
        onPointerDown={(e) => {
          if ((e.target as Element).closest('button, input, select, .z-20, .z-50')) return;
          jump(e);
        }}
      >
        {/* Background Scenery Elements */}
        {gameState !== "start" && (
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ animation: `slideBg ${50/currentSpeed.current}s linear infinite`}}>
            <svg width="1200" height="200" viewBox="0 0 1200 200" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,160 L100,140 L200,160 L300,130 L400,160 L500,145 L600,160 L700,140 L800,160 L900,130 L1000,160 L1100,145 L1200,160" stroke="#000" strokeWidth="2" fill="none" opacity="0.2" />
              <text x="150" y="100" fontSize="24" fill="#000" opacity="0.3">🌳</text>
              <text x="450" y="120" fontSize="30" fill="#000" opacity="0.3">🏛️</text>
              <text x="750" y="100" fontSize="24" fill="#000" opacity="0.3">🌳</text>
              <text x="1050" y="120" fontSize="30" fill="#000" opacity="0.3">🏛️</text>
            </svg>
          </div>
        )}

        {/* The Ground Line */}
        <div 
          className="absolute left-0 right-0 border-t-2 border-foreground/30" 
          style={{ top: GROUND_Y }}
        />

        {/* Game Elements (DOM Refs) */}
        {gameState === "playing" && <div ref={obstaclesRef} className="absolute inset-0 pointer-events-none" />}
        
        {/* Player Character */}
        {(gameState === "playing" || gameState === "start") && (
          <div
            ref={playerRef}
            className="absolute left-[50px] z-10 flex items-center justify-center text-[40px] leading-none"
            style={{ 
              top: gameState === "start" ? GROUND_Y - PLAYER_SIZE : 0, 
            }}
          >
            🏃
          </div>
        )}

        {/* Overlays */}
        {gameState === "start" && !nickname && (
          <GameLoginModal 
            gameTitle="জাবি রানার" 
            onStart={(name) => {
              setNickname(name);
              localStorage.setItem("ju_game_nickname_v2", name);
              setGameState("playing");
              playerY.current = GROUND_Y - PLAYER_SIZE;
              playerVelocity.current = 0;
              obstacles.current = [];
              frameCount.current = 0;
              currentSpeed.current = BASE_SPEED;
              setScore(0);
            }} 
          />
        )}

        {gameState === "start" && nickname && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-20"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card p-6 rounded-3xl text-center shadow-xl border border-border w-[90%] max-w-[320px]"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 mb-4">
                <Footprints className="h-8 w-8 text-orange-500" />
              </div>
              <p className="font-display font-bold text-xl mb-1 text-orange-600">জাবি রানার</p>
              <p className="text-sm text-muted-foreground mb-4">স্বাগতম, <strong className="text-foreground">{nickname}</strong>!</p>

              <button 
                 onClick={jump}
                 className="w-full flex justify-center items-center gap-2 mb-2 px-6 py-2.5 rounded-full bg-orange-500 text-white font-bold hover:scale-105 active:scale-95 transition-all mx-auto"
              >
                শুরু করো 🚀
              </button>
              
              <button 
                 onClick={(e) => {
                   e.stopPropagation();
                   localStorage.removeItem("ju_game_nickname_v2");
                   setNickname("");
                 }}
                 className="w-full text-xs text-muted-foreground hover:text-orange-500 transition-colors mb-3 font-semibold"
              >
                নাম পরিবর্তন করুন
              </button>
              
              <div className="flex justify-center border-t border-border pt-4 mt-1">
                <GameLeaderboard gameName="dinorun_v3" ascending={false} />
              </div>
            </motion.div>
          </div>
        )}

        {gameState === "gameover" && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-md z-20"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card px-8 py-6 rounded-3xl text-center shadow-xl border border-border w-[90%] max-w-[320px]"
            >
              <h2 className="font-display text-2xl font-black text-foreground mb-4">গেম ওভার</h2>
              <button 
                onClick={jump}
                className="w-full flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-foreground text-background font-bold hover:scale-105 active:scale-95 transition-transform mx-auto mb-4"
              >
                <RotateCcw className="h-4 w-4" />
                আবার খেলো
              </button>
              
              <div className="flex justify-center">
                <GameLeaderboard gameName="dinorun_v3" ascending={false} />
              </div>
            </motion.div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideBg {
          from { transform: translateX(0); }
          to { transform: translateX(-600px); }
        }
      `}} />
    </div>
  );
}
