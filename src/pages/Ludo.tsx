import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw, Trophy, Dices, Sparkles } from "lucide-react";
import { toast } from "sonner";

type PlayerColor = "red" | "blue" | "yellow" | "green";

interface Piece {
  id: number;
  position: number; // -1 for base, 0-51 for main path, 52-57 for home stretch
  color: PlayerColor;
}

interface Player {
  color: PlayerColor;
  pieces: Piece[];
  name: string;
}

const playerOrder: PlayerColor[] = ["red", "blue", "yellow", "green"];

const startPositions: Record<PlayerColor, number> = {
  red: 0,
  blue: 13,
  yellow: 26,
  green: 39,
};

const getCellCoords = (absPos: number, color: PlayerColor): [number, number] => {
  const path = [
    [6,1],[6,2],[6,3],[6,4],[6,5], // Red start area
    [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
    [0,7],[0,8],
    [1,8],[2,8],[3,8],[4,8],[5,8],
    [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
    [7,14],[8,14],
    [8,13],[8,12],[8,11],[8,10],[8,9],
    [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
    [14,7],[14,6],
    [13,6],[12,6],[11,6],[10,6],[9,6],
    [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
    [7,0],[6,0]
  ];
  
  if (absPos < 0) return [0,0];
  if (absPos >= 52) {
    const offset = absPos - 52;
    if (color === "red") return [7, 1 + offset];
    if (color === "blue") return [1 + offset, 7];
    if (color === "yellow") return [7, 13 - offset];
    if (color === "green") return [13 - offset, 7];
    return [7, 7];
  }
  
  return path[absPos] as [number, number];
};

const getBaseCoords = (piece: Piece): [number, number] => {
  const offsets = [[1,1], [1,4], [4,1], [4,4]];
  const baseOffsets: Record<PlayerColor, [number, number]> = {
    red: [0,0],
    blue: [0,9],
    yellow: [9,9],
    green: [9,0]
  };
  const base = baseOffsets[piece.color];
  const off = offsets[piece.id];
  return [base[0] + off[0], base[1] + off[1]];
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export default function Ludo() {
  const [players, setPlayers] = useState<Player[]>([
    { color: "red", pieces: Array(4).fill(null).map((_, i) => ({ id: i, position: -1, color: "red" })), name: "লাল" },
    { color: "blue", pieces: Array(4).fill(null).map((_, i) => ({ id: i, position: -1, color: "blue" })), name: "নীল" },
    { color: "yellow", pieces: Array(4).fill(null).map((_, i) => ({ id: i, position: -1, color: "yellow" })), name: "হলুদ" },
    { color: "green", pieces: Array(4).fill(null).map((_, i) => ({ id: i, position: -1, color: "green" })), name: "সবুজ" },
  ]);

  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [diceRoll, setDiceRoll] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [canMove, setCanMove] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [winner, setWinner] = useState<PlayerColor | null>(null);

  const currentPlayer = players[currentPlayerIdx];

  const rollDice = () => {
    if (rolling || canMove || isAnimating || winner) return;
    setRolling(true);
    setDiceRoll(null);
    
    // Cycle numbers during rolling
    const interval = setInterval(() => {
      setDiceRoll(Math.floor(Math.random() * 6) + 1);
    }, 80);

    setTimeout(() => {
      clearInterval(interval);
      const val = Math.floor(Math.random() * 6) + 1;
      setDiceRoll(val);
      setRolling(false);
      
      const moveable = players[currentPlayerIdx].pieces.filter(pc => {
        if (pc.position === -1) return val === 6;
        if (pc.position >= 52) return pc.position + val <= 57;
        return true;
      });
      
      if (moveable.length === 0) {
        toast("কোনো মুভ নেই!", { duration: 1000 });
        setTimeout(() => nextTurn(), 1000);
      } else {
        setCanMove(true);
      }
    }, 800);
  };

  const handlePieceClick = (piece: Piece) => {
    if (!canMove || isAnimating || piece.color !== currentPlayer.color || !diceRoll) return;
    
    if (piece.position === -1 && diceRoll !== 6) return;
    if (piece.position >= 52 && (piece.position + diceRoll > 57)) return;

    animateMovement(piece);
  };

  const animateMovement = async (piece: Piece) => {
    setIsAnimating(true);
    setCanMove(false);
    const steps = diceRoll!;
    let currentPos = piece.position;
    const pieceId = piece.id;
    const color = piece.color;

    if (currentPos === -1) {
      // Move out of base
      setPlayers(prev => {
        const next = [...prev];
        next[currentPlayerIdx].pieces.find(p => p.id === pieceId)!.position = startPositions[color];
        return next;
      });
      await delay(300);
    } else {
      // Step-by-step movement
      for (let i = 0; i < steps; i++) {
        currentPos += 1;
        setPlayers(prev => {
          const next = [...prev];
          next[currentPlayerIdx].pieces.find(p => p.id === pieceId)!.position = currentPos;
          return next;
        });
        await delay(200); // Wait for each step animation
      }
    }

    // Checking captures
    const finalPos = currentPos === -1 ? startPositions[color] : currentPos;
    const [fRow, fCol] = getCellCoords(finalPos, color);
    
    let captured = false;
    // Check other players' pieces at the same [row, col]
    // (Excluding safe spots)
    const isSafeSpot = finalPos === startPositions[color] || (finalPos === (startPositions[color] + 8) % 52); // Simplified safe spots
    
    if (!isSafeSpot && finalPos < 52) {
      setPlayers(prev => {
        const next = [...prev];
        next.forEach((p, pIdx) => {
          if (pIdx !== currentPlayerIdx) {
            p.pieces.forEach(pc => {
              const [pr, pc_col] = pc.position === -1 ? [-1, -1] : getCellCoords(pc.position, pc.color);
              if (pr === fRow && pc_col === fCol) {
                pc.position = -1; // Send home
                captured = true;
              }
            });
          }
        });
        return next;
      });
    }

    if (captured) {
        toast.success("গুটি কাটা হয়েছে!", { icon: "⚔️" });
        await delay(300);
    }

    if (currentPos === 57) {
        toast.success("হোমে পৌঁছে গেছে! 🎉", { icon: "🏠" });
        // Check for overall winner
        if (players[currentPlayerIdx].pieces.every(p => p.position === 57)) {
            setWinner(color);
        }
    }

    setIsAnimating(false);
    if (diceRoll === 6 || captured) {
      setDiceRoll(null);
      toast("আবার চাল!", { duration: 600 });
    } else {
      nextTurn();
    }
  };

  const nextTurn = () => {
    setDiceRoll(null);
    setCanMove(false);
    setCurrentPlayerIdx(prev => (prev + 1) % 4);
  };

  const resetGame = () => {
    setPlayers([
      { color: "red", pieces: Array(4).fill(null).map((_, i) => ({ id: i, position: -1, color: "red" })), name: "লাল" },
      { color: "blue", pieces: Array(4).fill(null).map((_, i) => ({ id: i, position: -1, color: "blue" })), name: "নীল" },
      { color: "yellow", pieces: Array(4).fill(null).map((_, i) => ({ id: i, position: -1, color: "yellow" })), name: "হলুদ" },
      { color: "green", pieces: Array(4).fill(null).map((_, i) => ({ id: i, position: -1, color: "green" })), name: "সবুজ" },
    ]);
    setCurrentPlayerIdx(0);
    setDiceRoll(null);
    setCanMove(false);
    setWinner(null);
  };

  const colorStyles = {
    red: "bg-red-500",
    blue: "bg-blue-500",
    yellow: "bg-yellow-400",
    green: "bg-green-500"
  };

  return (
    <div className="container max-w-lg py-6 pb-24 md:pb-8 flex flex-col items-center">
      <div className="w-full mb-6 flex justify-between items-center px-2">
        <Link to="/game" className="flex items-center text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          গেম জোন
        </Link>
        <button onClick={resetGame} className="p-2 hover:bg-muted rounded-full">
          <RotateCcw className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      <div className="relative mb-8 bg-slate-100 p-2 rounded-2xl shadow-xl border border-slate-200">
        {/* Ludo Board */}
        <div className="grid grid-cols-15 grid-rows-15 w-[90vw] h-[90vw] max-w-[450px] max-h-[450px] bg-white relative border-2 border-slate-400 overflow-hidden">
          
          {/* Bases & Center Area */}
          <div className="col-span-6 row-span-6 bg-red-500 border border-slate-300"></div>
          <div className="col-span-3 row-span-6 col-start-7 bg-white"></div>
          <div className="col-span-6 row-span-6 col-start-10 bg-blue-500 border border-slate-300"></div>
          
          <div className="col-span-6 row-span-3 row-start-7 bg-white"></div>
          <div className="col-span-3 row-span-3 col-start-7 row-start-7 bg-slate-900 flex items-center justify-center p-2">
             <Trophy className={`w-8 h-8 text-yellow-400 ${winner ? "animate-bounce" : ""}`} />
          </div>
          <div className="col-span-6 row-span-3 row-start-7 col-start-10 bg-white"></div>

          <div className="col-span-6 row-span-6 row-start-10 bg-green-500 border border-slate-300"></div>
          <div className="col-span-3 row-span-6 row-start-10 col-start-7 bg-white"></div>
          <div className="col-span-6 row-span-6 row-start-10 col-start-10 bg-yellow-400 border border-slate-300"></div>

          {/* Grid Path Decoration */}
          <div className="absolute inset-0 grid grid-cols-15 grid-rows-15 pointer-events-none opacity-20">
            {Array(225).fill(0).map((_, i) => <div key={i} className="border-[0.1px] border-slate-800"></div>)}
          </div>

          {/* Pieces */}
          {players.flatMap(p => p.pieces).map((piece) => {
            const [row, col] = piece.position === -1 ? getBaseCoords(piece) : getCellCoords(piece.position, piece.color);
            const isMyTurn = !isAnimating && canMove && piece.color === currentPlayer.color;
            const isSelectable = isMyTurn && (piece.position !== -1 || diceRoll === 6) && (piece.position < 52 || piece.position + diceRoll! <= 57);
            
            return (
              <motion.div
                key={`${piece.color}-${piece.id}`}
                layout
                onClick={() => handlePieceClick(piece)}
                style={{
                  gridRowStart: row + 1,
                  gridColumnStart: col + 1,
                }}
                className={`w-full h-full p-[10%] z-10 cursor-pointer flex items-center justify-center`}
              >
                <div className={`w-full h-full rounded-full border-2 border-white shadow-lg relative ${colorStyles[piece.color]} ${isSelectable ? "ring-4 ring-white ring-offset-0 scale-125 z-40" : "z-20 opacity-90"}`}>
                  <div className="absolute top-[10%] left-[10%] w-[30%] h-[30%] bg-white/40 rounded-full"></div>
                  {isSelectable && (
                    <motion.div
                      animate={{ y: [-2, 0, -2] }}
                      transition={{ repeat: Infinity, duration: 0.6 }}
                      className="absolute -top-4 left-1/2 -translate-x-1/2"
                    >
                      <Sparkles className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Game UI Area */}
      <div className="w-full flex items-center justify-between bg-card p-6 rounded-3xl border border-border shadow-2xl relative overflow-hidden group">
          {/* Animated background pulse for current player */}
          <div className={`absolute -left-10 -top-10 w-32 h-32 blur-[40px] opacity-20 transition-colors duration-500 ${colorStyles[currentPlayer.color]}`}></div>
          
          <div className="flex flex-col items-start z-10">
            <span className={`text-[10px] font-black uppercase tracking-[0.3em] mb-1 ${colorStyles[currentPlayer.color].replace('bg-', 'text-')}`}>
              Turn: {currentPlayer.name}
            </span>
            <div className="flex gap-1.5 mt-1">
               {playerOrder.map((c, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentPlayerIdx ? `w-12 ${colorStyles[c]}` : "w-1.5 bg-slate-200"}`}></div>
               ))}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={rollDice}
            disabled={rolling || canMove || isAnimating || winner}
            className={`relative w-20 h-20 rounded-[2.5rem] flex items-center justify-center text-white shadow-xl overflow-hidden transition-all duration-500 ${rolling ? "bg-slate-400 rotate-180" : colorStyles[currentPlayer.color]}`}
          >
            {rolling ? (
              <div className="grid grid-cols-2 gap-1.5">
                {[1, 2, 3, 4].map(i => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.3, delay: i * 0.1 }}
                    className="w-2 h-2 bg-white rounded-full"
                  ></motion.div>
                ))}
              </div>
            ) : diceRoll ? (
              <motion.span 
                initial={{ scale: 0.5, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                className="text-4xl font-black"
              >
                {diceRoll}
              </motion.span>
            ) : (
              <Dices className="w-10 h-10" />
            )}
            
            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
          </motion.button>
          
          <AnimatePresence>
             {canMove && !isAnimating && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="hidden sm:flex flex-col items-end z-10"
                >
                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Select Piece</p>
                   <Sparkles className="w-4 h-4 text-emerald-500 mt-1" />
                </motion.div>
             )}
          </AnimatePresence>
      </div>

      <div className="mt-8 text-center text-xs text-muted-foreground font-medium px-4 opacity-70">
        ৬ পড়লে ঘর থেকে বের হতে পারবেন। ঘর থেকে বের হওয়ার পর গুটির ওপর ক্লিক করে চাল দিয়ে হবে।
      </div>
    </div>
  );
}
