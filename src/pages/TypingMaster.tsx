import { useState, useEffect, useRef, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import GameLeaderboard from "@/components/GameLeaderboard";
import GameLoginModal from "@/components/GameLoginModal";
import { ArrowLeft, RotateCcw, Keyboard, Heart } from "lucide-react";
import { audioSystem } from "@/utils/audio";
import { triggerConfetti } from "@/utils/confetti";

const WORDS = [
  "assignment", "presentation", "cgpa", "midterm", "final",
  "proxy", "changa", "bot tola", "tarzan point", "prantik",
  "dairy gate", "transport", "library", "hall", "viva",
  "syllabus", "lab report", "ju", "jahangirnagar", "alumni"
];

interface FallingWord {
  id: number;
  text: string;
  x: number; // percentage
  y: number; // percentage
  speed: number;
}

export default function TypingMaster() {
  const [words, setWords] = useState<FallingWord[]>([]);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState<"start" | "playing" | "gameover">("start");
  const [nickname, setNickname] = useState("");
  const hasSubmittedScore = useRef(false);
  
  const gameLoopRef = useRef<number>();
  const lastSpawnRef = useRef<number>(0);
  const wordIdCounter = useRef(0);
  const speedMultiplier = useRef(1);

  useEffect(() => {
    const saved = localStorage.getItem("ju_game_nickname_v2");
    if (saved) setNickname(saved);
  }, []);

  useEffect(() => {
    if (gameState === "gameover" && score > 0 && nickname && !hasSubmittedScore.current) {
      hasSubmittedScore.current = true;
      const submitScore = async () => {
        const finalName = nickname.trim().substring(0, 40);
        await supabase.from("game_scores").insert({
          nickname: finalName,
          game_name: "typing_v3",
          score: score
        });
        triggerConfetti();
        audioSystem.playGameOver();
      };
      submitScore();
    }
  }, [gameState, score, nickname]);

  const updateGame = (time: number) => {
    if (gameState !== "playing") return;

    // Spawn new words
    if (time - lastSpawnRef.current > Math.max(1000, 2500 - speedMultiplier.current * 200)) {
      lastSpawnRef.current = time;
      const wordText = WORDS[Math.floor(Math.random() * WORDS.length)];
      const newWord: FallingWord = {
        id: wordIdCounter.current++,
        text: wordText,
        x: Math.random() * 70 + 10, // 10% to 80%
        y: -10,
        speed: 0.2 * speedMultiplier.current,
      };
      setWords((prev) => [...prev, newWord]);
      speedMultiplier.current += 0.05; // gradually increase difficulty
    }

    setWords((prev) => {
      let currentLives = lives;
      const updated = prev.map(w => ({ ...w, y: w.y + w.speed }));
      
      const filtered = updated.filter(w => {
        if (w.y > 100) {
          currentLives -= 1;
          if (currentLives <= 0) {
            audioSystem.playGameOver();
            setGameState("gameover");
          }
          return false;
        }
        return true;
      });

      if (currentLives !== lives) {
        setLives(currentLives);
      }
      return filtered;
    });

    if (lives > 0 && gameState === "playing") {
      gameLoopRef.current = requestAnimationFrame(updateGame);
    }
  };

  useEffect(() => {
    if (gameState === "playing") {
      gameLoopRef.current = requestAnimationFrame(updateGame);
    } else {
      cancelAnimationFrame(gameLoopRef.current!);
    }
    return () => cancelAnimationFrame(gameLoopRef.current!);
  }, [gameState, lives]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);

    const matchIndex = words.findIndex(w => w.text.toLowerCase() === val.toLowerCase().trim());
    if (matchIndex !== -1) {
      // Word matched!
      audioSystem.playCoin();
      setScore(s => s + words[matchIndex].text.length * 10);
      setWords(prev => prev.filter((_, i) => i !== matchIndex));
      setInput("");
    }
  };

  const startGame = () => {
    if (!nickname.trim()) return;
    hasSubmittedScore.current = false;
    audioSystem.playClick();
    setScore(0);
    setLives(3);
    setWords([]);
    setInput("");
    speedMultiplier.current = 1;
    lastSpawnRef.current = performance.now();
    setGameState("playing");
  };

  return (
    <div className="container max-w-lg py-6 pb-24 md:pb-8 flex flex-col items-center min-h-[80vh]">
      <div className="w-full mb-6">
        <Link to="/game" className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          গেম জোনে ফেরত
        </Link>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2">
              <Keyboard className="w-6 h-6 text-indigo-500" />
              এক্সাম নাইট টাইপিং
            </h1>
            <p className="text-sm text-muted-foreground">শব্দ পড়ার আগেই টাইপ করে ফেলো!</p>
          </div>
          <div className="text-right flex gap-4">
             <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">লাইফ</p>
                <div className="flex gap-1 text-red-500">
                  {[...Array(3)].map((_, i) => (
                    <Heart key={i} className={`w-6 h-6 ${i < lives ? 'fill-current' : 'opacity-30'}`} />
                  ))}
                </div>
             </div>
             <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">স্কোর</p>
                <p className="font-display text-2xl font-black text-primary">{score}</p>
             </div>
          </div>
        </div>
      </div>

      <div className="relative w-full aspect-[4/5] bg-card border-4 border-border rounded-xl overflow-hidden shadow-sm flex flex-col">
        {/* Game Area */}
        <div className="flex-1 relative overflow-hidden bg-gradient-to-b from-indigo-50/50 to-transparent">
          <AnimatePresence>
            {words.map((word) => (
              <motion.div
                key={word.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.5, color: '#4f46e5' }}
                className="absolute font-bold text-lg px-3 py-1 rounded-full bg-white border-2 border-indigo-200 shadow-sm whitespace-nowrap"
                style={{ 
                  left: `${word.x}%`, 
                  top: `${word.y}%`,
                  color: input && word.text.toLowerCase().startsWith(input.toLowerCase().trim()) ? '#4f46e5' : '#1f2937'
                }}
              >
                {word.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-muted/50 border-t border-border">
          <input
            type="text"
            value={input}
            onChange={handleInput}
            disabled={gameState !== "playing"}
            placeholder={gameState === "playing" ? "এখানে টাইপ করো..." : ""}
            className="w-full text-center text-xl font-bold p-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 focus:ring-0 outline-none uppercase"
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
        </div>

        {gameState === "start" && !nickname && (
          <GameLoginModal 
            gameTitle="এক্সাম নাইট টাইপিং" 
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
              <h2 className="font-display text-xl font-bold mb-1 text-indigo-600">টাইপিং মাস্টার</h2>
              <p className="text-sm text-muted-foreground mb-4">স্বাগতম, <strong className="text-foreground">{nickname}</strong>!</p>
              
              <button 
                 onClick={startGame}
                 className="w-full mb-3 px-6 py-2.5 rounded-full bg-indigo-600 text-white font-bold hover:scale-105 active:scale-95 transition-all"
              >
                শুরু করো 🚀
              </button>
              
              <button 
                 onClick={(e) => {
                   e.stopPropagation();
                   localStorage.removeItem("ju_game_nickname_v2");
                   setNickname("");
                 }}
                 className="w-full text-xs text-muted-foreground hover:text-indigo-600 transition-colors font-semibold"
              >
                নাম পরিবর্তন করুন
              </button>
            </motion.div>
          </div>
        )}
      </div>

      {gameState === "gameover" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-card p-6 rounded-2xl border-2 border-border text-center shadow-2xl w-full max-w-[400px]"
        >
          <h2 className="font-display text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 mb-2">
            গেম ওভার!
          </h2>
          <p className="text-muted-foreground mb-6">
            তোমার টাইপিং স্কোর <strong>{score}</strong>!
          </p>
          <button
            onClick={startGame}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-display font-bold shadow-md hover:scale-105 active:scale-95 transition-all mb-4"
          >
            <RotateCcw className="h-5 w-5" />
            আবার খেলো
          </button>
          
          <div className="flex justify-center">
            <GameLeaderboard gameName="typing_v3" ascending={false} />
          </div>
        </motion.div>
      )}

      {gameState === "start" && (
        <div className="mt-8 w-full max-w-[400px]">
          <GameLeaderboard gameName="typing_v3" ascending={false} />
        </div>
      )}
    </div>
  );
}
