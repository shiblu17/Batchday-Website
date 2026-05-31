import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import GameLeaderboard from "@/components/GameLeaderboard";
import GameLoginModal from "@/components/GameLoginModal";
import { ArrowLeft, RotateCcw, BrainCircuit } from "lucide-react";

const EMOJIS = ["🎓", "🚌", "🎸", "☕", "💻", "📷", "🏆", "🏀"];
const INITIAL_CARDS = [...EMOJIS, ...EMOJIS].map((emoji, i) => ({
  id: i,
  emoji,
  isFlipped: false,
  isMatched: false,
}));

// Fisher-Yates shuffle
const shuffleCards = () => {
  const arr = [...INITIAL_CARDS];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export default function MemoryMatch() {
  const [cards, setCards] = useState(shuffleCards());
  const [moves, setMoves] = useState(0);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [gameState, setGameState] = useState<"start" | "playing" | "gameover">("start");
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    const savedNick = localStorage.getItem("ju_game_nickname_v2");
    if (savedNick) setNickname(savedNick);
  }, []);

  useEffect(() => {
    if (gameState !== "playing") return;
    if (flippedIds.length === 2) {
      const [first, second] = flippedIds;
      if (cards[first].emoji === cards[second].emoji) {
        setCards((c) =>
          c.map((card, i) =>
            i === first || i === second ? { ...card, isMatched: true } : card
          )
        );
      } else {
        setTimeout(() => {
          setCards((c) =>
            c.map((card, i) =>
              i === first || i === second ? { ...card, isFlipped: false } : card
            )
          );
        }, 1000);
      }
      setMoves((m) => m + 1);
      setFlippedIds([]);
    }
  }, [flippedIds, cards]);

  useEffect(() => {
    if (gameState === "playing" && cards.length > 0 && cards.every((c) => c.isMatched)) {
      setGameState("gameover");
      
      // Submit score (score is number of moves, so lower is better)
      if (moves > 0 && nickname.trim() !== "") {
        supabase.from("game_scores").insert({
          nickname: nickname.trim().substring(0, 20),
          game_name: "memory_v2",
          score: moves
        }).then();
      }
    }
  }, [cards, gameState, moves, nickname]);

  const handleFlip = (index: number) => {
    if (gameState !== "playing" || flippedIds.length >= 2 || cards[index].isFlipped || cards[index].isMatched) return;
    
    setCards((c) =>
      c.map((card, i) => (i === index ? { ...card, isFlipped: true } : card))
    );
    setFlippedIds((prev) => [...prev, index]);
  };

  const startGame = () => {
    if (!nickname.trim()) return;
    setCards(shuffleCards());
    setMoves(0);
    setFlippedIds([]);
    setGameState("playing");
  };

  const resetGame = () => {
    startGame();
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
              <BrainCircuit className="w-6 h-6 text-fuchsia-500" />
              JU মেমোরি ম্যাচ
            </h1>
            <p className="text-sm text-muted-foreground">সবগুলো কার্ড মিলিয়ে ফেলো!</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">চাল (Moves)</p>
            <p className="font-display text-2xl font-black text-primary">{moves}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full max-w-[400px] relative">
        {cards.map((card, i) => (
          <button
            key={card.id}
            onClick={() => handleFlip(i)}
            className="aspect-square relative perspective-1000"
            disabled={card.isMatched || gameState !== "playing"}
          >
            <motion.div
              className={`w-full h-full duration-500 preserve-3d relative ${
                card.isFlipped || card.isMatched ? "rotate-y-180" : ""
              }`}
              initial={false}
              animate={{ rotateY: card.isFlipped || card.isMatched ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <div className="absolute w-full h-full backface-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-600 shadow-sm border-2 border-fuchsia-700/50 flex items-center justify-center">
                <BrainCircuit className="w-6 h-6 text-white/50" />
              </div>
              <div
                className="absolute w-full h-full backface-hidden rounded-xl sm:rounded-2xl bg-card shadow-sm border-2 border-border flex items-center justify-center text-4xl"
                style={{ transform: "rotateY(180deg)" }}
              >
                {card.emoji}
              </div>
            </motion.div>
          </button>
        ))}
        {gameState === "start" && !nickname && (
          <GameLoginModal 
            gameTitle="JU মেমোরি ম্যাচ" 
            onStart={(name) => {
              setNickname(name);
              localStorage.setItem("ju_game_nickname_v2", name);
              setCards(shuffleCards());
              setMoves(0);
              setFlippedIds([]);
              setGameState("playing");
            }} 
          />
        )}

        {gameState === "start" && nickname && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-20 rounded-2xl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card p-6 rounded-2xl text-center shadow-xl border border-border w-[90%]"
            >
              <h2 className="font-display text-xl font-bold mb-1 text-fuchsia-600">মেমোরি ম্যাচ</h2>
              <p className="text-sm text-muted-foreground mb-4">স্বাগতম, <strong className="text-foreground">{nickname}</strong>!</p>
              
              <button 
                 onClick={startGame}
                 className="w-full mb-3 px-6 py-2.5 rounded-full bg-fuchsia-600 text-white font-bold hover:scale-105 active:scale-95 transition-all"
              >
                শুরু করো 🚀
              </button>
              
              <button 
                 onClick={(e) => {
                   e.stopPropagation();
                   localStorage.removeItem("ju_game_nickname_v2");
                   setNickname("");
                 }}
                 className="w-full text-xs text-muted-foreground hover:text-fuchsia-600 transition-colors mb-3 font-semibold"
              >
                নাম পরিবর্তন করুন
              </button>
              
              <div className="flex justify-center border-t border-border pt-4 mt-1">
                <GameLeaderboard gameName="memory_v2" ascending={true} />
              </div>
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
          <h2 className="font-display text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-purple-600 mb-2">
            অভিনন্দন! 🎉
          </h2>
          <p className="text-muted-foreground mb-6">
            তুমি মাত্র <strong>{moves}</strong> চালে গেমটি শেষ করেছো।
          </p>
          <button
            onClick={resetGame}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-fuchsia-600 text-white font-display font-bold shadow-md hover:scale-105 active:scale-95 transition-all mb-4"
          >
            <RotateCcw className="h-5 w-5" />
            আবার খেলো
          </button>
          
          <div className="flex justify-center">
            <GameLeaderboard gameName="memory_v2" ascending={true} />
          </div>
        </motion.div>
      )}

      {/* Required custom CSS for 3D flip effect since Tailwind doesn't have it natively built-in without plugins */}
      <style dangerouslySetInnerHTML={{__html: `
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}} />
    </div>
  );
}
