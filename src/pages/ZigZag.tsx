import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import GameLeaderboard from "@/components/GameLeaderboard";
import GameLoginModal from "@/components/GameLoginModal";
import { audioSystem } from "@/utils/audio";
import { triggerConfetti } from "@/utils/confetti";
import { ArrowLeft, RotateCcw, Trophy, Volume2, VolumeX, Sparkles, Navigation, Maximize, Minimize } from "lucide-react";

interface PathBlock {
  x: number;
  y: number;
  hasCrystal: boolean;
}

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const BLOCK_SIZE = 36;
const BALL_RADIUS = 9;
const SPEED = 3.6;

export default function ZigZag() {
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
  const ballX = useRef(CANVAS_WIDTH / 2);
  const ballY = useRef(CANVAS_HEIGHT / 2);
  const ballDirection = useRef<"right" | "left">("right"); // right (+x, -y) or left (-x, -y) in isometric
  const cameraY = useRef(0);
  const pathBlocks = useRef<PathBlock[]>([]);
  const isFalling = useRef(false);
  const fallVy = useRef(0);

  useEffect(() => {
    const saved = localStorage.getItem("zigzag_highscore");
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

  const spawnInitialPath = useCallback(() => {
    const blocks: PathBlock[] = [];
    let curX = CANVAS_WIDTH / 2;
    let curY = CANVAS_HEIGHT / 2 + 100;

    // Start with 5 straight blocks
    for (let i = 0; i < 5; i++) {
      curY -= BLOCK_SIZE;
      blocks.push({ x: curX, y: curY, hasCrystal: false });
    }

    // Generate 50 random zigzag blocks
    for (let i = 0; i < 50; i++) {
      const goRight = Math.random() > 0.5;
      if (goRight) {
        curX += BLOCK_SIZE;
      } else {
        curX -= BLOCK_SIZE;
      }
      curY -= BLOCK_SIZE;
      blocks.push({
        x: curX,
        y: curY,
        hasCrystal: Math.random() < 0.25,
      });
    }

    pathBlocks.current = blocks;
    ballX.current = blocks[0].x;
    ballY.current = blocks[0].y;
  }, []);

  const initGame = useCallback(() => {
    isFalling.current = false;
    fallVy.current = 0;
    ballDirection.current = "right";
    cameraY.current = 0;
    setScore(0);
    hasSubmittedScore.current = false;
    spawnInitialPath();
  }, [spawnInitialPath]);

  // Turn Action (1 Tap anywhere or Space)
  const turnBall = useCallback(() => {
    if (gameState !== "playing" || isFalling.current) return;

    ballDirection.current = ballDirection.current === "right" ? "left" : "right";
    audioSystem.playClick();
  }, [gameState]);

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
        if (!isFalling.current) {
          // Move Ball forward
          if (ballDirection.current === "right") {
            ballX.current += SPEED;
          } else {
            ballX.current -= SPEED;
          }
          ballY.current -= SPEED; // Always moving upwards in screen coords

          // Camera follow
          const targetCamY = ballY.current - CANVAS_HEIGHT / 2;
          cameraY.current += (targetCamY - cameraY.current) * 0.15;

          // Check if Ball is on a valid Path Block
          const onBlock = pathBlocks.current.some((b) => {
            const dx = Math.abs(b.x - ballX.current);
            const dy = Math.abs(b.y - ballY.current);
            return dx < BLOCK_SIZE * 0.85 && dy < BLOCK_SIZE * 0.85;
          });

          if (!onBlock) {
            // Ball fell off the edge!
            isFalling.current = true;
            fallVy.current = 2;
            audioSystem.playGameOver();
          }

          // Check Crystals
          pathBlocks.current.forEach((b) => {
            if (b.hasCrystal) {
              const dist = Math.hypot(b.x - ballX.current, b.y - ballY.current);
              if (dist < BALL_RADIUS + 12) {
                b.hasCrystal = false;
                audioSystem.playCoin();
                setScore((s) => s + 2);
              }
            }
          });

          setScore((s) => s + 1);

          // Generate more path blocks dynamically
          const highestBlock = pathBlocks.current[pathBlocks.current.length - 1];
          if (highestBlock && ballY.current < highestBlock.y + 700) {
            let nextX = highestBlock.x;
            let nextY = highestBlock.y;
            for (let i = 0; i < 20; i++) {
              if (Math.random() > 0.5) nextX += BLOCK_SIZE;
              else nextX -= BLOCK_SIZE;
              nextY -= BLOCK_SIZE;
              pathBlocks.current.push({
                x: nextX,
                y: nextY,
                hasCrystal: Math.random() < 0.25,
              });
            }
          }

          // Cleanup passed blocks
          pathBlocks.current = pathBlocks.current.filter((b) => b.y < ballY.current + 500);
        } else {
          // Falling into abyss animation
          fallVy.current += 0.5;
          ballY.current += fallVy.current;

          if (fallVy.current > 15) {
            setGameState("gameover");
            return;
          }
        }
      }

      ctx.save();
      ctx.translate(0, -cameraY.current);

      // Draw Isometric Path Blocks
      pathBlocks.current.forEach((block) => {
        const bx = block.x - BLOCK_SIZE / 2;
        const by = block.y - BLOCK_SIZE / 2;

        ctx.fillStyle = "#1e293b";
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.roundRect(bx, by, BLOCK_SIZE, BLOCK_SIZE, 4);
        ctx.fill();

        // 3D Depth bottom
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(bx, by + BLOCK_SIZE - 4, BLOCK_SIZE, 6);

        // Crystal Collectible
        if (block.hasCrystal) {
          ctx.fillStyle = "#f43f5e";
          ctx.shadowColor = "#f43f5e";
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(block.x, block.y, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw Rolling Neon Ball
      ctx.shadowColor = "#facc15";
      ctx.shadowBlur = 18;
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(ballX.current, ballY.current, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Inner Highlight
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(ballX.current - 2, ballY.current - 2, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      animFrameId.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [gameState]);

  // Spacebar Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        if (gameState === "playing") {
          turnBall();
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
  }, [gameState, nickname, turnBall, initGame]);

  // Submit High Score to Supabase
  useEffect(() => {
    if (gameState === "gameover" && score > 0 && nickname.trim() && !hasSubmittedScore.current) {
      hasSubmittedScore.current = true;

      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem("zigzag_highscore", score.toString());
        triggerConfetti();
      }

      const submit = async () => {
        try {
          await supabase.from("game_scores").insert({
            nickname: nickname.trim().substring(0, 40),
            game_name: "zigzag_v1",
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
            <Navigation className="w-3.5 h-3.5 text-yellow-400" />
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
            {isFullscreen ? <Minimize className="w-4 h-4 text-yellow-400" /> : <Maximize className="w-4 h-4" />}
          </button>
          <GameLeaderboard gameName="zigzag_v1" />
        </div>
      </div>

      {/* Main Full-Height Play Area */}
      <div 
        className="flex-1 w-full min-h-0 relative flex items-center justify-center p-2 sm:p-4 overflow-hidden cursor-pointer"
        onPointerDown={(e) => {
          e.preventDefault();
          if (gameState === "playing") turnBall();
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
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-500/10">
                  <Navigation className="w-8 h-8" />
                </div>

                <h2 className="text-2xl font-black font-display text-white mb-1">বল খাদে পড়েছে!</h2>
                <p className="text-sm text-slate-400 mb-6">সঠিক টাইমিংয়ে ট্যাপ করে মোড় ঘোরাও</p>

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
                  onClick={(e) => {
                    e.stopPropagation();
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
          gameTitle="জিগ-জ্যাগ রানার (ZigZag)"
          onStart={handleStartGame}
        />
      )}
    </div>
  );
}
