import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import GameLeaderboard from "@/components/GameLeaderboard";
import GameLoginModal from "@/components/GameLoginModal";
import { audioSystem } from "@/utils/audio";
import { triggerConfetti } from "@/utils/confetti";
import { ArrowLeft, RotateCcw, Trophy, Volume2, VolumeX, Sparkles, Orbit, Maximize, Minimize } from "lucide-react";

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const GRAVITY = 0.28;
const JUMP_FORCE = -6.2;
const BALL_RADIUS = 9;

const COLORS = [
  { name: "yellow", hex: "#facc15" },
  { name: "pink", hex: "#ec4899" },
  { name: "cyan", hex: "#06b6d4" },
  { name: "purple", hex: "#a855f7" },
];

interface Obstacle {
  y: number;
  type: "circle" | "cross" | "double_circle";
  angle: number;
  speed: number;
  radius: number;
  starCollected: boolean;
  colorSwitched: boolean;
}

export default function ColorSwitch() {
  const [gameState, setGameState] = useState<"start" | "playing" | "gameover">("start");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [nickname, setNickname] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameId = useRef<number>();
  const hasSubmittedScore = useRef(false);

  // Game Physics State Refs
  const ballY = useRef(CANVAS_HEIGHT - 120);
  const ballVy = useRef(0);
  const ballColor = useRef(COLORS[0].hex);
  const cameraY = useRef(0);
  const targetCameraY = useRef(0);
  const obstacles = useRef<Obstacle[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("color_switch_highscore");
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

  const getRandomColor = useCallback(() => {
    return COLORS[Math.floor(Math.random() * COLORS.length)].hex;
  }, []);

  const spawnObstacle = useCallback((y: number): Obstacle => {
    const types: ("circle" | "cross" | "double_circle")[] = ["circle", "cross", "circle", "double_circle"];
    const type = types[Math.floor(Math.random() * types.length)];
    return {
      y,
      type,
      angle: 0,
      speed: (Math.random() > 0.5 ? 1 : -1) * (0.02 + Math.random() * 0.015),
      radius: 75,
      starCollected: false,
      colorSwitched: false,
    };
  }, []);

  const initGame = useCallback(() => {
    ballY.current = CANVAS_HEIGHT - 120;
    ballVy.current = 0;
    ballColor.current = getRandomColor();
    cameraY.current = 0;
    targetCameraY.current = 0;

    const obs: Obstacle[] = [];
    for (let i = 0; i < 5; i++) {
      obs.push(spawnObstacle(CANVAS_HEIGHT - 280 - i * 270));
    }
    obstacles.current = obs;

    setScore(0);
    hasSubmittedScore.current = false;
  }, [getRandomColor, spawnObstacle]);

  const jump = useCallback(() => {
    if (gameState !== "playing") return;
    ballVy.current = JUMP_FORCE;
    audioSystem.playJump();
  }, [gameState]);

  // Main Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      ctx.fillStyle = "#0a0a14";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      if (gameState === "playing") {
        ballVy.current += GRAVITY;
        ballY.current += ballVy.current;

        const screenBallY = ballY.current - cameraY.current;
        if (screenBallY < CANVAS_HEIGHT / 2) {
          targetCameraY.current = ballY.current - CANVAS_HEIGHT / 2;
        }
        cameraY.current += (targetCameraY.current - cameraY.current) * 0.1;

        if (ballY.current - cameraY.current > CANVAS_HEIGHT + 20) {
          audioSystem.playGameOver();
          setGameState("gameover");
          return;
        }

        const highestObs = obstacles.current[obstacles.current.length - 1];
        if (highestObs && ballY.current < highestObs.y + 600) {
          obstacles.current.push(spawnObstacle(highestObs.y - 270));
        }

        obstacles.current = obstacles.current.filter((obs) => obs.y < ballY.current + 800);
      }

      ctx.save();
      ctx.translate(0, -cameraY.current);

      obstacles.current.forEach((obs) => {
        obs.angle += obs.speed;
        const cx = CANVAS_WIDTH / 2;
        const cy = obs.y;

        if (obs.type === "circle" || obs.type === "double_circle") {
          const thickness = 14;
          for (let i = 0; i < 4; i++) {
            const startAngle = obs.angle + (i * Math.PI) / 2;
            const endAngle = startAngle + Math.PI / 2;

            ctx.strokeStyle = COLORS[i].hex;
            ctx.lineWidth = thickness;
            ctx.shadowColor = COLORS[i].hex;
            ctx.shadowBlur = 8;

            ctx.beginPath();
            ctx.arc(cx, cy, obs.radius, startAngle, endAngle);
            ctx.stroke();

            if (gameState === "playing") {
              const dx = cx - CANVAS_WIDTH / 2;
              const dy = cy - ballY.current;
              const dist = Math.sqrt(dx * dx + dy * dy);

              if (dist >= obs.radius - thickness / 2 - BALL_RADIUS && dist <= obs.radius + thickness / 2 + BALL_RADIUS) {
                let ballAngle = Math.atan2(ballY.current - cy, CANVAS_WIDTH / 2 - cx);
                if (ballAngle < 0) ballAngle += Math.PI * 2;

                let segAngle = (ballAngle - (obs.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
                const segIndex = Math.floor(segAngle / (Math.PI / 2)) % 4;

                if (COLORS[segIndex].hex !== ballColor.current) {
                  audioSystem.playGameOver();
                  setGameState("gameover");
                  return;
                }
              }
            }
          }
        }

        if (obs.type === "cross") {
          const armLength = 70;
          for (let i = 0; i < 4; i++) {
            const armAngle = obs.angle + (i * Math.PI) / 2;
            const ax = cx + Math.cos(armAngle) * armLength;
            const ay = cy + Math.sin(armAngle) * armLength;

            ctx.strokeStyle = COLORS[i].hex;
            ctx.lineWidth = 14;
            ctx.shadowColor = COLORS[i].hex;
            ctx.shadowBlur = 8;

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(ax, ay);
            ctx.stroke();

            if (gameState === "playing") {
              const distToCenter = Math.hypot(CANVAS_WIDTH / 2 - cx, ballY.current - cy);
              if (distToCenter < armLength + BALL_RADIUS) {
                let ballAngle = Math.atan2(ballY.current - cy, CANVAS_WIDTH / 2 - cx);
                if (ballAngle < 0) ballAngle += Math.PI * 2;
                const diff = Math.abs(((ballAngle - armAngle + Math.PI) % (Math.PI * 2)) - Math.PI);
                if (diff < 0.22 && COLORS[i].hex !== ballColor.current) {
                  audioSystem.playGameOver();
                  setGameState("gameover");
                  return;
                }
              }
            }
          }
        }

        if (!obs.starCollected) {
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = "#facc15";
          ctx.shadowBlur = 12;

          ctx.beginPath();
          ctx.arc(cx, cy, 10, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#facc15";
          ctx.beginPath();
          ctx.arc(cx, cy, 6, 0, Math.PI * 2);
          ctx.fill();

          if (gameState === "playing" && Math.abs(ballY.current - cy) < BALL_RADIUS + 12) {
            obs.starCollected = true;
            audioSystem.playCoin();
            setScore((s) => s + 1);
          }
        }

        const switcherY = cy - obs.radius - 60;
        if (!obs.colorSwitched) {
          for (let i = 0; i < 4; i++) {
            ctx.fillStyle = COLORS[i].hex;
            ctx.beginPath();
            ctx.moveTo(cx, switcherY);
            ctx.arc(cx, switcherY, 12, (i * Math.PI) / 2, ((i + 1) * Math.PI) / 2);
            ctx.fill();
          }

          if (gameState === "playing" && Math.abs(ballY.current - switcherY) < BALL_RADIUS + 14) {
            obs.colorSwitched = true;
            audioSystem.playJump();
            const otherColors = COLORS.filter((c) => c.hex !== ballColor.current);
            ballColor.current = otherColors[Math.floor(Math.random() * otherColors.length)].hex;
          }
        }
      });

      // Player Ball
      ctx.shadowColor = ballColor.current;
      ctx.shadowBlur = 18;
      ctx.fillStyle = ballColor.current;
      ctx.beginPath();
      ctx.arc(CANVAS_WIDTH / 2, ballY.current, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(CANVAS_WIDTH / 2 - 2, ballY.current - 2, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      animFrameId.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [gameState, spawnObstacle]);

  // Spacebar Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        if (gameState === "playing") {
          jump();
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
  }, [gameState, nickname, jump, initGame]);

  // Submit High Score to Supabase
  useEffect(() => {
    if (gameState === "gameover" && score > 0 && nickname.trim() && !hasSubmittedScore.current) {
      hasSubmittedScore.current = true;

      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem("color_switch_highscore", score.toString());
        triggerConfetti();
      }

      const submit = async () => {
        try {
          await supabase.from("game_scores").insert({
            nickname: nickname.trim().substring(0, 40),
            game_name: "color_switch_v1",
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
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-base font-black text-yellow-400 font-mono">{score}</span>
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
            {isFullscreen ? <Minimize className="w-4 h-4 text-fuchsia-400" /> : <Maximize className="w-4 h-4" />}
          </button>
          <GameLeaderboard gameName="color_switch_v1" />
        </div>
      </div>

      {/* Main Full-Height Play Area */}
      <div 
        className="flex-1 w-full min-h-0 relative flex items-center justify-center p-2 sm:p-4 overflow-hidden cursor-pointer"
        onPointerDown={(e) => {
          e.preventDefault();
          if (gameState === "playing") jump();
        }}
      >
        <div className="relative w-full h-full max-w-[440px] max-h-[640px] rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-800 bg-slate-900 flex items-center justify-center">
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
                <div className="w-16 h-16 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-fuchsia-500/10">
                  <Orbit className="w-8 h-8" />
                </div>

                <h2 className="text-2xl font-black font-display text-white mb-1">ভুল রঙে স্পর্শ লেগেছে!</h2>
                <p className="text-sm text-slate-400 mb-6">বলের রঙের সাথে রিংয়ের রঙ মেলাও</p>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 shadow-inner">
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800/80">
                    <span className="text-sm font-semibold text-slate-400">অর্জিত স্টার</span>
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
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white font-bold text-base shadow-xl shadow-fuchsia-600/25 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
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
          gameTitle="কালার সুইচ (Color Switch)"
          onStart={handleStartGame}
        />
      )}
    </div>
  );
}
