import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import GameLeaderboard from "@/components/GameLeaderboard";
import GameLoginModal from "@/components/GameLoginModal";
import { audioSystem } from "@/utils/audio";
import { triggerConfetti } from "@/utils/confetti";
import { ArrowLeft, RotateCcw, Trophy, Volume2, VolumeX, Sparkles, Orbit, Maximize, Minimize } from "lucide-react";

interface FloorSlice {
  startAngle: number;
  endAngle: number;
  type: "safe" | "danger" | "gap";
}

interface Floor {
  y: number;
  slices: FloorSlice[];
  passed: boolean;
  destroyed: boolean;
}

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const PILLAR_X = CANVAS_WIDTH / 2;
const BALL_X = CANVAS_WIDTH / 2;
const BALL_RADIUS = 9;
const FLOOR_RADIUS = 135;
const FLOOR_GAP = 120;
const BALL_BASE_Y = 220;

export default function HelixJump() {
  const [gameState, setGameState] = useState<"start" | "playing" | "gameover">("start");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [nickname, setNickname] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameId = useRef<number>();
  const hasSubmittedScore = useRef(false);

  // Engine Refs
  const rotation = useRef(0);
  const rotationVelocity = useRef(0);
  const touchLastX = useRef<number | null>(null);

  const ballVy = useRef(0);
  const ballY = useRef(BALL_BASE_Y);
  const cameraY = useRef(0);
  const streak = useRef(0);
  const isFireball = useRef(false);
  const floors = useRef<Floor[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("helix_jump_highscore");
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

  const spawnFloor = useCallback((y: number): Floor => {
    // Generate randomized slices: 1 gap, 1-2 dangers, rest safe
    const gapAngle = Math.random() * Math.PI * 2;
    const gapSize = 1.05; // radians

    const slices: FloorSlice[] = [
      { startAngle: gapAngle, endAngle: gapAngle + gapSize, type: "gap" },
    ];

    // Danger zone
    const dangerAngle = (gapAngle + Math.PI + (Math.random() - 0.5) * 0.8) % (Math.PI * 2);
    const dangerSize = 0.7;
    slices.push({
      startAngle: dangerAngle,
      endAngle: dangerAngle + dangerSize,
      type: "danger",
    });

    // Fill remaining with safe
    slices.push({
      startAngle: gapAngle + gapSize,
      endAngle: gapAngle + Math.PI * 2,
      type: "safe",
    });

    return {
      y,
      slices,
      passed: false,
      destroyed: false,
    };
  }, []);

  const initGame = useCallback(() => {
    rotation.current = 0;
    rotationVelocity.current = 0;
    ballVy.current = 0;
    ballY.current = BALL_BASE_Y;
    cameraY.current = 0;
    streak.current = 0;
    isFireball.current = false;
    setScore(0);
    hasSubmittedScore.current = false;

    // Generate initial 12 floors
    const initialFloors: Floor[] = [];
    for (let i = 0; i < 12; i++) {
      initialFloors.push(spawnFloor(BALL_BASE_Y + 50 + i * FLOOR_GAP));
    }
    floors.current = initialFloors;
  }, [spawnFloor]);

  // Touch and Drag Controls for rotating pillar
  const handlePointerDown = (e: React.PointerEvent) => {
    touchLastX.current = e.clientX;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (touchLastX.current === null) return;
    const deltaX = e.clientX - touchLastX.current;
    rotationVelocity.current = deltaX * 0.009;
    rotation.current += rotationVelocity.current;
    touchLastX.current = e.clientX;
  };

  const handlePointerUp = () => {
    touchLastX.current = null;
  };

  // Main Render & Physics
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      // Dark Neon Background
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      if (gameState === "playing") {
        // Apply rotation inertia
        rotationVelocity.current *= 0.92;
        rotation.current += rotationVelocity.current;

        // Ball gravity
        ballVy.current += 0.36;
        ballY.current += ballVy.current;

        // Camera follow
        const targetCamY = ballY.current - BALL_BASE_Y;
        cameraY.current += (targetCamY - cameraY.current) * 0.15;

        // Check floor collisions
        floors.current.forEach((floor) => {
          if (floor.destroyed) return;

          // Check if ball is hitting this floor's horizontal plane
          if (
            ballY.current + BALL_RADIUS >= floor.y &&
            ballY.current - BALL_RADIUS <= floor.y + 12 &&
            ballVy.current > 0
          ) {
            // Find current hit slice based on rotation
            let hitAngle = (Math.PI / 2 - (rotation.current % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

            // Check if ball falls inside the GAP slice
            const inGap = floor.slices.some(
              (s) => s.type === "gap" && hitAngle >= (s.startAngle % (Math.PI * 2)) && hitAngle <= (s.endAngle % (Math.PI * 2))
            );

            if (inGap) {
              // Ball passes cleanly through gap!
              if (!floor.passed) {
                floor.passed = true;
                streak.current += 1;
                setScore((s) => s + 1);
                audioSystem.playCoin();

                if (streak.current >= 3) {
                  isFireball.current = true;
                }
              }
            } else {
              // Hits platform surface
              if (isFireball.current) {
                // Fireball smashes through floor!
                floor.destroyed = true;
                isFireball.current = false;
                streak.current = 0;
                audioSystem.playJump();
                setScore((s) => s + 2);
              } else {
                // Check if hit danger slice
                const inDanger = floor.slices.some(
                  (s) => s.type === "danger" && hitAngle >= (s.startAngle % (Math.PI * 2)) && hitAngle <= (s.endAngle % (Math.PI * 2))
                );

                if (inDanger) {
                  // DEAD!
                  audioSystem.playGameOver();
                  setGameState("gameover");
                  return;
                }

                // Bounce normally
                ballY.current = floor.y - BALL_RADIUS;
                ballVy.current = -7.5;
                streak.current = 0;
                audioSystem.playJump();
              }
            }
          }
        });

        // Spawn more floors dynamically as ball descends
        const lowestFloor = floors.current[floors.current.length - 1];
        if (lowestFloor && ballY.current > lowestFloor.y - 600) {
          floors.current.push(spawnFloor(lowestFloor.y + FLOOR_GAP));
        }

        // Clean up passed floors
        floors.current = floors.current.filter((f) => f.y > ballY.current - 400);
      }

      ctx.save();
      ctx.translate(0, -cameraY.current);

      // Draw Central Cylindrical Pillar
      ctx.fillStyle = "#1e293b";
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 10;
      ctx.fillRect(PILLAR_X - 18, -100, 36, ballY.current + 1200);

      // Draw Rotating Floor Discs with 3D Elliptical Projection
      floors.current.forEach((floor) => {
        if (floor.destroyed) return;

        const fy = floor.y;
        const currentRot = rotation.current;

        floor.slices.forEach((slice) => {
          if (slice.type === "gap") return; // Gaps are empty space

          const sAngle = slice.startAngle + currentRot;
          const eAngle = slice.endAngle + currentRot;

          ctx.fillStyle = slice.type === "danger" ? "#ef4444" : "#06b6d4";
          ctx.shadowColor = slice.type === "danger" ? "#ef4444" : "#06b6d4";
          ctx.shadowBlur = 8;

          ctx.beginPath();
          // Elliptical slice projection
          ctx.ellipse(PILLAR_X, fy, FLOOR_RADIUS, FLOOR_RADIUS * 0.32, 0, sAngle, eAngle);
          ctx.lineTo(PILLAR_X, fy);
          ctx.fill();
        });
      });

      // Draw Bouncing Neon Ball
      ctx.shadowColor = isFireball.current ? "#f97316" : "#facc15";
      ctx.shadowBlur = 16;
      ctx.fillStyle = isFireball.current ? "#f97316" : "#facc15";
      ctx.beginPath();
      ctx.arc(BALL_X, ballY.current, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Inner highlight
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(BALL_X - 2, ballY.current - 2, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      animFrameId.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [gameState, spawnFloor]);

  // Submit High Score to Supabase
  useEffect(() => {
    if (gameState === "gameover" && score > 0 && nickname.trim() && !hasSubmittedScore.current) {
      hasSubmittedScore.current = true;

      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem("helix_jump_highscore", score.toString());
        triggerConfetti();
      }

      const submit = async () => {
        try {
          await supabase.from("game_scores").insert({
            nickname: nickname.trim().substring(0, 40),
            game_name: "helix_jump_v1",
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
            <Orbit className="w-3.5 h-3.5 text-cyan-400" />
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
          <GameLeaderboard gameName="helix_jump_v1" />
        </div>
      </div>

      {/* Main Full-Height Play Area */}
      <div 
        className="flex-1 w-full min-h-0 relative flex items-center justify-center p-2 sm:p-4 overflow-hidden touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="relative w-full h-full max-w-[440px] max-h-[640px] rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-800 bg-slate-900 flex items-center justify-center">
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
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-500/10">
                  <Orbit className="w-8 h-8" />
                </div>

                <h2 className="text-2xl font-black font-display text-white mb-1">লাল অংশে লেগেছে!</h2>
                <p className="text-sm text-slate-400 mb-6">টাওয়ার ঘুরিয়ে ফাঁকা অংশ দিয়ে ড্রপ করো</p>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 shadow-inner">
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800/80">
                    <span className="text-sm font-semibold text-slate-400">অতিক্রম করা ফ্লোর</span>
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

      {/* Start Game Modal - At Root Level */}
      {gameState === "start" && (
        <GameLoginModal
          gameTitle="হেলিক্স জাম্প (Helix Jump)"
          onStart={handleStartGame}
        />
      )}
    </div>
  );
}
