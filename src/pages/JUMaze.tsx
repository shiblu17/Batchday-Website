import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import GameLeaderboard from "@/components/GameLeaderboard";
import GameLoginModal from "@/components/GameLoginModal";
import { ArrowLeft, RotateCcw, Map as MapIcon, ArrowUp, ArrowDown, ArrowLeft as ArrowLeftIcon, ArrowRight } from "lucide-react";
import { audioSystem } from "@/utils/audio";
import { triggerConfetti } from "@/utils/confetti";

// 0: path, 1: wall
const MAZE_GRID = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const START_POS = { x: 1, y: 1 };
const END_POS = { x: 13, y: 11 };

export default function JUMaze() {
  const [playerPos, setPlayerPos] = useState(START_POS);
  const [gameState, setGameState] = useState<"start" | "playing" | "gameover">("start");
  const [nickname, setNickname] = useState("");
  const [timeElapsed, setTimeElapsed] = useState(0);
  const hasSubmittedScore = useRef(false);
  const timerRef = useRef<number>();

  useEffect(() => {
    const saved = localStorage.getItem("ju_game_nickname_v2");
    if (saved) setNickname(saved);
  }, []);

  useEffect(() => {
    if (gameState === "playing") {
      timerRef.current = window.setInterval(() => {
        setTimeElapsed((t) => t + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState]);

  useEffect(() => {
    if (gameState === "gameover" && timeElapsed > 0 && nickname && !hasSubmittedScore.current) {
      hasSubmittedScore.current = true;
      const submitScore = async () => {
        const finalName = nickname.trim().substring(0, 40);
        await supabase.from("game_scores").insert({
          nickname: finalName,
          game_name: "jumaze_v3",
          score: timeElapsed
        });
        triggerConfetti();
        audioSystem.playGameOver();
      };
      submitScore();
    }
  }, [gameState, timeElapsed, nickname]);

  const movePlayer = useCallback((dx: number, dy: number) => {
    if (gameState !== "playing") return;

    setPlayerPos((prev) => {
      const newX = prev.x + dx;
      const newY = prev.y + dy;

      if (newY >= 0 && newY < MAZE_GRID.length && newX >= 0 && newX < MAZE_GRID[0].length) {
        if (MAZE_GRID[newY][newX] === 0) {
          audioSystem.playClick();
          
          if (newX === END_POS.x && newY === END_POS.y) {
            setGameState("gameover");
            audioSystem.playCoin();
          }
          return { x: newX, y: newY };
        }
      }
      return prev;
    });
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp": movePlayer(0, -1); break;
        case "ArrowDown": movePlayer(0, 1); break;
        case "ArrowLeft": movePlayer(-1, 0); break;
        case "ArrowRight": movePlayer(1, 0); break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [movePlayer]);

  const startGame = () => {
    if (!nickname.trim()) return;
    hasSubmittedScore.current = false;
    audioSystem.playClick();
    setPlayerPos(START_POS);
    setTimeElapsed(0);
    setGameState("playing");
  };

  return (
    <div className="container max-w-lg py-6 pb-24 md:pb-8 flex flex-col items-center min-h-[80vh] touch-none">
      <div className="w-full mb-6">
        <Link to="/game" className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          গেম জোনে ফেরত
        </Link>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2">
              <MapIcon className="w-6 h-6 text-green-600" />
              জাবি মেজ
            </h1>
            <p className="text-sm text-muted-foreground">বটতলায় পৌঁছাও দ্রুততম সময়ে!</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">সময় (সেকেন্ড)</p>
            <p className="font-display text-2xl font-black text-primary">{timeElapsed}</p>
          </div>
        </div>
      </div>

      <div className="relative bg-card border-4 border-border rounded-xl p-1 overflow-hidden shadow-sm">
        <div 
          className="grid gap-0 bg-green-50"
          style={{ gridTemplateColumns: `repeat(${MAZE_GRID[0].length}, 1fr)` }}
        >
          {MAZE_GRID.map((row, y) => (
            row.map((cell, x) => (
              <div 
                key={`${x}-${y}`}
                className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-sm sm:text-xl ${
                  cell === 1 ? 'bg-green-800 border border-green-900/50' : 'bg-transparent'
                }`}
              >
                {x === START_POS.x && y === START_POS.y && cell !== 1 && <span className="opacity-30">🏁</span>}
                {x === END_POS.x && y === END_POS.y && <span className="animate-pulse">🏫</span>}
                {x === playerPos.x && y === playerPos.y && (
                  <motion.div
                    layoutId="player"
                    className="absolute z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  >
                    🎓
                  </motion.div>
                )}
              </div>
            ))
          ))}
        </div>

        {gameState === "start" && !nickname && (
          <GameLoginModal 
            gameTitle="জাবি মেজ" 
            onStart={(name) => {
              setNickname(name);
              localStorage.setItem("ju_game_nickname_v2", name);
              startGame();
            }} 
          />
        )}

        {gameState === "start" && nickname && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-20">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card p-6 rounded-2xl text-center shadow-xl border border-border w-[90%]"
            >
              <h2 className="font-display text-xl font-bold mb-1 text-green-600">জাবি মেজ</h2>
              <p className="text-sm text-muted-foreground mb-4">স্বাগতম, <strong className="text-foreground">{nickname}</strong>!</p>
              
              <button 
                 onClick={startGame}
                 className="w-full mb-3 px-6 py-2.5 rounded-full bg-green-600 text-white font-bold hover:scale-105 active:scale-95 transition-all"
              >
                শুরু করো 🚀
              </button>
              
              <button 
                 onClick={(e) => {
                   e.stopPropagation();
                   localStorage.removeItem("ju_game_nickname_v2");
                   setNickname("");
                 }}
                 className="w-full text-xs text-muted-foreground hover:text-green-600 transition-colors font-semibold"
              >
                নাম পরিবর্তন করুন
              </button>
            </motion.div>
          </div>
        )}
      </div>

      {/* On-screen controls for mobile */}
      <div className="grid grid-cols-3 gap-2 mt-8 md:hidden max-w-[200px]">
        <div />
        <button 
          onClick={() => movePlayer(0, -1)}
          className="bg-muted p-4 rounded-xl flex justify-center items-center active:bg-primary/20"
        ><ArrowUp /></button>
        <div />
        <button 
          onClick={() => movePlayer(-1, 0)}
          className="bg-muted p-4 rounded-xl flex justify-center items-center active:bg-primary/20"
        ><ArrowLeftIcon /></button>
        <button 
          onClick={() => movePlayer(0, 1)}
          className="bg-muted p-4 rounded-xl flex justify-center items-center active:bg-primary/20"
        ><ArrowDown /></button>
        <button 
          onClick={() => movePlayer(1, 0)}
          className="bg-muted p-4 rounded-xl flex justify-center items-center active:bg-primary/20"
        ><ArrowRight /></button>
      </div>

      {gameState === "gameover" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-card p-6 rounded-2xl border-2 border-border text-center shadow-2xl w-full max-w-[400px]"
        >
          <h2 className="font-display text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600 mb-2">
            মিশন সাকসেস! 🎉
          </h2>
          <p className="text-muted-foreground mb-6">
            তুমি বটতলায় পৌঁছেছো <strong>{timeElapsed}</strong> সেকেন্ডে!
          </p>
          <button
            onClick={startGame}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-green-600 text-white font-display font-bold shadow-md hover:scale-105 active:scale-95 transition-all mb-4"
          >
            <RotateCcw className="h-5 w-5" />
            আবার খেলো
          </button>
          
          <div className="flex justify-center">
            <GameLeaderboard gameName="jumaze_v3" ascending={true} />
          </div>
        </motion.div>
      )}

      {gameState === "start" && (
        <div className="mt-8 w-full max-w-[400px]">
          <GameLeaderboard gameName="jumaze_v3" ascending={true} />
        </div>
      )}
    </div>
  );
}
