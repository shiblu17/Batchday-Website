import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw, Trophy, Dices } from "lucide-react";
import { toast } from "sonner";

type PlayerColor = "red" | "green" | "yellow" | "blue";

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

// Ludo Path Coordinates (15x15 board)
// This is a simplified 15x15 board layout
const playerOrder: PlayerColor[] = ["red", "blue", "yellow", "green"];

const startPositions: Record<PlayerColor, number> = {
  red: 0,
  blue: 13,
  yellow: 26,
  green: 39,
};

// Simplified board coordinates for piece placement
const getCellCoords = (absPos: number, color: PlayerColor): [number, number] => {
  // Logic to convert 0-51 path to 15x15 board [row, col]
  // This is a complex mapping, I will use a pre-calculated path for the first 52 tiles
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
    // Home stretch
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
  const [pieceToMove, setPieceToMove] = useState<Piece | null>(null);
  const [canMove, setCanMove] = useState(false);

  const currentPlayer = players[currentPlayerIdx];

  const rollDice = () => {
    if (rolling || canMove) return;
    setRolling(true);
    setDiceRoll(null);
    
    setTimeout(() => {
      const val = Math.floor(Math.random() * 6) + 1;
      setDiceRoll(val);
      setRolling(false);
      
      const p = players[currentPlayerIdx];
      const moveable = p.pieces.filter(pc => {
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
    }, 600);
  };

  const handlePieceClick = (piece: Piece) => {
    if (!canMove || piece.color !== currentPlayer.color || !diceRoll) return;
    
    if (piece.position === -1 && diceRoll !== 6) return;
    if (piece.position >= 52 && piece.position + diceRoll > 57) return;

    movePiece(piece);
  };

  const movePiece = (piece: Piece) => {
    const val = diceRoll!;
    setPlayers(prev => {
      const nextPlayers = [...prev];
      const p = nextPlayers[currentPlayerIdx];
      const pc = p.pieces.find(p => p.id === piece.id)!;
      
      if (pc.position === -1) {
        pc.position = startPositions[pc.color];
      } else {
        pc.position += val;
      }
      
      // Check for capturing logic could go here
      
      return nextPlayers;
    });

    setCanMove(false);
    if (val === 6) {
      setDiceRoll(null);
      toast("আবার চাল!", { duration: 800 });
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
          
          {/* Bases & Path styling */}
          <div className="col-span-6 row-span-6 bg-red-500 border border-slate-300"></div>
          <div className="col-span-3 row-span-6 col-start-7 bg-white"></div>
          <div className="col-span-6 row-span-6 col-start-10 bg-blue-500 border border-slate-300"></div>
          
          <div className="col-span-6 row-span-3 row-start-7 bg-white"></div>
          <div className="col-span-3 row-span-3 col-start-7 row-start-7 bg-slate-900 flex items-center justify-center">
            <Trophy className="text-yellow-400 w-8 h-8" />
          </div>
          <div className="col-span-6 row-span-3 row-start-7 col-start-10 bg-white"></div>

          <div className="col-span-6 row-span-6 row-start-10 bg-green-500 border border-slate-300"></div>
          <div className="col-span-3 row-span-6 row-start-10 col-start-7 bg-white"></div>
          <div className="col-span-6 row-span-6 row-start-10 col-start-10 bg-yellow-400 border border-slate-300"></div>

          {/* Grid Path Styling (Visuals only) */}
          <div className="absolute inset-0 grid grid-cols-15 grid-rows-15 pointer-events-none opacity-20">
            {Array(225).fill(0).map((_, i) => <div key={i} className="border-[0.1px] border-slate-800"></div>)}
          </div>

          {/* Pieces */}
          {players.flatMap(p => p.pieces).map((piece) => {
            const [row, col] = piece.position === -1 ? getBaseCoords(piece) : getCellCoords(piece.position, piece.color);
            const isSelectable = canMove && piece.color === currentPlayer.color && (piece.position !== -1 || diceRoll === 6) && (piece.position < 52 || piece.position + diceRoll! <= 57);
            
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
                <div className={`w-full h-full rounded-full border-2 border-white shadow-lg relative ${colorStyles[piece.color]} ${isSelectable ? "ring-4 ring-white ring-offset-0 scale-125 animate-pulse z-30" : "z-20 opacity-90"}`}>
                  <div className="absolute top-[10%] left-[10%] w-[30%] h-[30%] bg-white/40 rounded-full"></div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Game UI */}
      <div className="w-full flex items-center justify-between bg-card p-6 rounded-3xl border border-border shadow-card px-8">
          <div className="flex flex-col items-center">
            <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${colorStyles[currentPlayer.color].replace('bg-', 'text-')}`}>
              এখন চাল
            </span>
            <div className={`h-2 w-16 rounded-full ${colorStyles[currentPlayer.color]}`}></div>
            <span className="mt-2 text-sm font-bold">{currentPlayer.name}</span>
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={rollDice}
            disabled={rolling || canMove}
            className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl ${rolling ? "bg-slate-400" : colorStyles[currentPlayer.color]}`}
          >
            {rolling ? (
              <div className="grid grid-cols-2 gap-1 animate-spin">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
            ) : diceRoll ? (
              <span className="text-3xl font-black">{diceRoll}</span>
            ) : (
              <Dices className="w-8 h-8" />
            )}
          </motion.button>

          <div className="text-center opacity-50">
            <span className="text-[10px] font-bold uppercase tracking-widest block mb-1">প্লেয়ার</span>
            <div className="flex gap-1 justify-center">
              {playerOrder.map((c, i) => (
                <div key={c} className={`w-3 h-3 rounded-full ${colorStyles[c]} ${i === currentPlayerIdx ? "ring-2 ring-slate-800" : ""}`}></div>
              ))}
            </div>
          </div>
      </div>

      <div className="mt-8 text-center text-xs text-muted-foreground font-medium px-4">
        ৬ পড়লে ঘর থেকে বের হতে পারবেন। ঘর থেকে বের হওয়ার পর গুটির ওপর ক্লিক করে চাল দিতে হবে।
      </div>
    </div>
  );
}
