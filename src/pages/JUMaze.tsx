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
const MAZE_WIDTH = 15;
const MAZE_HEIGHT = 15;

const generateMaze = (width: number, height: number) => {
  const maze = Array(height).fill(0).map(() => Array(width).fill(1));
  
  const carve = (x: number, y: number) => {
    maze[y][x] = 0;
    
    const dirs = [
      [0, -2], [0, 2], [-2, 0], [2, 0]
    ].sort(() => Math.random() - 0.5);
    
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && maze[ny][nx] === 1) {
        maze[y + dy / 2][x + dx / 2] = 0;
        carve(nx, ny);
      }
    }
  };
  
  carve(1, 1);
  
  // Ensure the end position is always accessible (rarely it might get blocked if dimensions are weird, but odd dimensions are safe)
  maze[height - 2][width - 2] = 0;
  
  // Optionally, knock down a few random walls to make it a bit less linear/more complex with multiple paths
  for (let i = 0; i < 5; i++) {
    const rx = Math.floor(Math.random() * ((width - 3) / 2)) * 2 + 1;
    const ry = Math.floor(Math.random() * ((height - 3) / 2)) * 2 + 1;
    if (rx > 0 && ry > 0) {
      const dirs = [[0, 1], [1, 0]];
      const d = dirs[Math.floor(Math.random() * 2)];
      maze[ry + d[0]][rx + d[1]] = 0;
    }
  }
  
  return maze;
};

const START_POS = { x: 1, y: 1 };
const END_POS = { x: MAZE_WIDTH - 2, y: MAZE_HEIGHT - 2 };

export default function JUMaze() {
  const [mazeGrid, setMazeGrid] = useState<number[][]>(() => generateMaze(MAZE_WIDTH, MAZE_HEIGHT));
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

      if (newY >= 0 && newY < mazeGrid.length && newX >= 0 && newX < mazeGrid[0].length) {
        if (mazeGrid[newY][newX] === 0) {
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
    setMazeGrid(generateMaze(MAZE_WIDTH, MAZE_HEIGHT));
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
          style={{ gridTemplateColumns: `repeat(${MAZE_WIDTH}, 1fr)` }}
        >
          {mazeGrid.map((row, y) => (
            row.map((cell, x) => (
              <div 
                key={`${x}-${y}`}
                className={`w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center text-xs sm:text-lg ${
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
