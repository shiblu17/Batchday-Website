import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw, Trophy, Star, Sparkles, Dices } from "lucide-react";
import { toast } from "sonner";

type PlayerColor = "red" | "blue" | "yellow" | "green";

interface Piece {
  id: number;
  position: number; // -1: base, 0-51: path, 52-57: home
  color: PlayerColor;
}

interface Player {
  color: PlayerColor;
  pieces: Piece[];
  name: string;
  avatar: string;
}

const COLORS: Record<PlayerColor, string> = {
  red: "#f84b4b",
  blue: "#2b8fff",
  yellow: "#ffcf2b",
  green: "#1dc164",
};

const COLOR_STYLES: Record<PlayerColor, string> = {
  red: "bg-[#f84b4b] border-[#d43535] text-[#f84b4b]",
  blue: "bg-[#2b8fff] border-[#1e6ed4] text-[#2b8fff]",
  yellow: "bg-[#ffcf2b] border-[#d4ac1e] text-[#ffcf2b]",
  green: "bg-[#1dc164] border-[#16964d] text-[#1dc164]",
};

const SAFE_SPOTS = [0, 8, 13, 21, 26, 34, 39, 47];

const startPositions: Record<PlayerColor, number> = {
  red: 0,
  blue: 13,
  yellow: 26,
  green: 39,
};

const getCellCoords = (absPos: number, color: PlayerColor): [number, number] => {
  const path = [
    [6,1],[6,2],[6,3],[6,4],[6,5], [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
    [0,7],[0,8], [1,8],[2,8],[3,8],[4,8],[5,8], [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
    [7,14],[8,14], [8,13],[8,12],[8,11],[8,10],[8,9], [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
    [14,7],[14,6], [13,6],[12,6],[11,6],[10,6],[9,6], [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
    [7,0],[6,0]
  ];
  if (absPos >= 52) {
    const offset = absPos - 52;
    if (color === "red") return [7, 1 + offset];
    if (color === "blue") return [1 + offset, 7];
    if (color === "yellow") return [7, 13 - offset];
    if (color === "green") return [13 - offset, 7];
  }
  return path[absPos] as [number, number];
};

const getBaseCoords = (piece: Piece): [number, number] => {
  const offsets = [[1.5, 1.5], [1.5, 3.5], [3.5, 1.5], [3.5, 3.5]];
  const basePos: Record<PlayerColor, [number, number]> = {
    red: [0, 0], blue: [0, 9], yellow: [9, 9], green: [9, 0]
  };
  const base = basePos[piece.color];
  const off = offsets[piece.id];
  return [base[0] + off[0], base[1] + off[1]];
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export default function Ludo() {
  const [players, setPlayers] = useState<Player[]>([
    { color: "red", pieces: Array(4).fill(null).map((_, i) => ({ id: i, position: -1, color: "red" })), name: "Team Red", avatar: "🔴" },
    { color: "blue", pieces: Array(4).fill(null).map((_, i) => ({ id: i, position: -1, color: "blue" })), name: "Team Blue", avatar: "🔵" },
    { color: "yellow", pieces: Array(4).fill(null).map((_, i) => ({ id: i, position: -1, color: "yellow" })), name: "Team Yellow", avatar: "🟡" },
    { color: "green", pieces: Array(4).fill(null).map((_, i) => ({ id: i, position: -1, color: "green" })), name: "Team Green", avatar: "🟢" },
  ]);

  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [diceRoll, setDiceRoll] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [canMove, setCanMove] = useState(false);
  const [winner, setWinner] = useState<PlayerColor | null>(null);

  const currentPlayer = players[currentPlayerIdx];

  const updatePiecePos = (color: PlayerColor, id: number, pos: number) => {
    setPlayers(prev => prev.map(p => {
      if (p.color !== color) return p;
      return {
        ...p,
        pieces: p.pieces.map(piece => 
          piece.id === id ? { ...piece, position: pos } : piece
        )
      };
    }));
  };

  const nextTurn = useCallback(() => {
    setDiceRoll(null);
    setCanMove(false);
    setCurrentPlayerIdx(prev => (prev + 1) % 4);
  }, []);

  const movePiece = async (piece: Piece) => {
    if (!canMove || isAnimating || winner) return;
    setIsAnimating(true);
    setCanMove(false);
    const val = diceRoll!;
    let currentPos = piece.position;

    if (currentPos === -1) {
      updatePiecePos(piece.color, piece.id, startPositions[piece.color]);
      await delay(300);
    } else {
      for (let i = 0; i < val; i++) {
        currentPos++;
        updatePiecePos(piece.color, piece.id, currentPos);
        await delay(180);
      }
    }

    // Capture logic
    if (currentPos < 52 && !SAFE_SPOTS.includes(currentPos)) {
      const [r, c] = getCellCoords(currentPos, piece.color);
      let captured = false;
      
      setPlayers(prev => prev.map((p, idx) => {
        if (idx === currentPlayerIdx) return p;
        return {
          ...p,
          pieces: p.pieces.map(pce => {
            if (pce.position === -1) return pce;
            const [pr, pc] = getCellCoords(pce.position, pce.color);
            if (pr === r && pc === c) {
              captured = true;
              return { ...pce, position: -1 };
            }
            return pce;
          })
        };
      }));

      if (captured) {
        toast.success("Piece Captured! ⚔️");
        await delay(400);
        setDiceRoll(null);
        setIsAnimating(false);
        return;
      }
    }

    if (players[currentPlayerIdx].pieces.every(p => p.position === 57)) {
       setWinner(playerOrder[currentPlayerIdx]);
       toast.success(`${players[currentPlayerIdx].name} Wins! 🏆`);
    }

    setIsAnimating(false);
    if (val === 6) {
      setDiceRoll(null);
      toast("Roll Again!");
    } else {
      nextTurn();
    }
  };

  const rollDice = () => {
    if (rolling || canMove || isAnimating || !!winner) return;
    setRolling(true);
    let count = 0;
    const interval = setInterval(() => {
      setDiceRoll(Math.floor(Math.random() * 6) + 1);
      if (++count > 15) {
        clearInterval(interval);
        const val = Math.floor(Math.random() * 6) + 1;
        setDiceRoll(val);
        setRolling(false);
        
        const possibleMoves = players[currentPlayerIdx].pieces.filter(p => 
          (p.position === -1 ? val === 6 : p.position + val <= 57)
        );

        if (possibleMoves.length === 0) {
          toast("No moves possible!", { duration: 1000 });
          setTimeout(nextTurn, 1000);
        } else {
          setCanMove(true);
        }
      }
    }, 40);
  };

  const resetGame = () => {
    setPlayers([
      { color: "red", pieces: Array(4).fill(null).map((_, i) => ({ id: i, position: -1, color: "red" })), name: "Team Red", avatar: "👤" },
      { color: "blue", pieces: Array(4).fill(null).map((_, i) => ({ id: i, position: -1, color: "blue" })), name: "Team Blue", avatar: "👤" },
      { color: "yellow", pieces: Array(4).fill(null).map((_, i) => ({ id: i, position: -1, color: "yellow" })), name: "Team Yellow", avatar: "👤" },
      { color: "green", pieces: Array(4).fill(null).map((_, i) => ({ id: i, position: -1, color: "green" })), name: "Team Green", avatar: "👤" },
    ]);
    setCurrentPlayerIdx(0);
    setDiceRoll(null);
    setCanMove(false);
    setIsAnimating(false);
    setWinner(null);
  };

  const getDiceDots = (num: number) => {
    const dotPatterns: Record<number, number[]> = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8],
    };
    return (
      <div className="grid grid-cols-3 grid-rows-3 gap-1 w-full h-full p-2">
        {Array(9).fill(0).map((_, i) => (
          <div key={i} className={`flex items-center justify-center`}>
            {dotPatterns[num]?.includes(i) && <div className="w-2 h-2 rounded-full bg-slate-800 shadow-sm" />}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container max-w-2xl py-6 flex flex-col items-center min-h-screen bg-[#e8eaf6] font-display overflow-x-hidden">
      <div className="w-full flex justify-between items-center mb-6 px-4">
        <Link to="/game" className="flex items-center text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-white/80 px-4 py-2 rounded-full shadow-sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> কাম টু গেম জোন
        </Link>
        <h1 className="font-display font-black text-2xl tracking-tighter text-slate-800 bg-white/50 px-6 py-2 rounded-full">LUDO KING LIVE</h1>
        <button onClick={resetGame} className="p-3 bg-white rounded-full shadow-md text-orange-500 active:scale-95 transition-transform"><RotateCcw className="w-5 h-5"/></button>
      </div>

      {/* Ludo Board Area */}
      <div className="relative p-4 bg-[#f8e08e] rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-b-[12px] border-[#d4b454] max-w-full">
        <div className="grid grid-cols-15 grid-rows-15 w-[90vw] h-[90vw] max-w-[500px] max-h-[500px] bg-white border-2 border-black/30 relative overflow-hidden rounded-sm">
          
          {/* Main Layout Sections */}
          <div className="col-span-6 row-span-6 bg-[#f84b4b] border-[1px] border-black/20 p-4 shadow-inner flex items-center justify-center">
            <div className="w-full h-full bg-white/90 rounded-2xl grid grid-cols-2 gap-4 p-4 shadow-[inset_0_4px_10px_rgba(0,0,0,0.1)]">
              {Array(4).fill(0).map((_, i) => <div key={i} className="bg-[#f84b4b15] rounded-full border-[6px] border-[#f84b4b25] flex items-center justify-center" />)}
            </div>
          </div>
          
          <div className="col-span-3 row-span-6 col-start-7 bg-white relative">
            <div className="absolute inset-0 grid grid-rows-6">
              {Array(6).fill(0).map((_, i) => <div key={i} className={`border-[0.5px] border-black/10 ${i > 0 && i < 6 ? "bg-[#f84b4b]" : "bg-white"} ${i === 2 ? "relative" : ""}`}>
                {i === 2 && <Star className="absolute inset-0 m-auto text-black/10 w-6 h-6" />}
              </div>)}
            </div>
          </div>

          <div className="col-span-6 row-span-6 col-start-10 bg-[#2b8fff] border-[1px] border-black/20 p-4 shadow-inner flex items-center justify-center">
            <div className="w-full h-full bg-white/90 rounded-2xl grid grid-cols-2 gap-4 p-4 shadow-[inset_0_4px_10px_rgba(0,0,0,0.1)]">
              {Array(4).fill(0).map((_, i) => <div key={i} className="bg-[#2b8fff15] rounded-full border-[6px] border-[#2b8fff25] flex items-center justify-center" />)}
            </div>
          </div>

          <div className="col-span-6 row-span-3 row-start-7 bg-white relative">
             <div className="absolute inset-0 grid grid-cols-6">
              {Array(6).fill(0).map((_, i) => <div key={i} className={`border-[0.5px] border-black/10 ${i > 0 && i < 6 ? "bg-[#1dc164]" : "bg-white"} ${i === 2 ? "relative" : ""}`}>
                {i === 2 && <Star className="absolute inset-0 m-auto text-black/10 w-6 h-6" />}
              </div>)}
            </div>
          </div>

          <div className="col-span-3 row-span-3 col-start-7 row-start-7 bg-white relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <div className="w-0 h-0 border-l-[60px] border-l-transparent border-r-[60px] border-r-transparent border-t-[60px] border-t-[#f84b4b] absolute top-0"></div>
              <div className="w-0 h-0 border-t-[60px] border-t-transparent border-b-[60px] border-b-transparent border-l-[60px] border-l-[#1dc164] absolute left-0"></div>
              <div className="w-0 h-0 border-t-[60px] border-t-transparent border-b-[60px] border-b-transparent border-r-[60px] border-r-[#2b8fff] absolute right-0"></div>
              <div className="w-0 h-0 border-l-[60px] border-l-transparent border-r-[60px] border-r-transparent border-b-[60px] border-b-[#ffcf2b] absolute bottom-0"></div>
              <div className="z-10 bg-white/20 backdrop-blur-sm p-1 rounded-full border border-white/30 rotate-12 scale-110">
                <Trophy className={`text-white w-8 h-8 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] ${winner ? "animate-bounce scale-150 rotate-0" : ""}`} />
              </div>
            </div>
          </div>

          <div className="col-span-6 row-span-3 row-start-7 col-start-10 bg-white relative">
            <div className="absolute inset-0 grid grid-cols-6">
              {Array(6).fill(0).map((_, i) => <div key={i} className={`border-[0.5px] border-black/10 ${i >= 0 && i < 5 ? "bg-[#2b8fff]" : "bg-white"} ${i === 3 ? "relative" : ""}`}>
                {i === 3 && <Star className="absolute inset-0 m-auto text-black/10 w-6 h-6" />}
              </div>)}
            </div>
          </div>

          <div className="col-span-6 row-span-6 row-start-10 bg-[#1dc164] border-[1px] border-black/20 p-4 shadow-inner flex items-center justify-center">
            <div className="w-full h-full bg-white/90 rounded-2xl grid grid-cols-2 gap-4 p-4 shadow-[inset_0_4px_10px_rgba(0,0,0,0.1)]">
              {Array(4).fill(0).map((_, i) => <div key={i} className="bg-[#1dc16415] rounded-full border-[6px] border-[#1dc16425] flex items-center justify-center" />)}
            </div>
          </div>

          <div className="col-span-3 row-span-6 row-start-10 col-start-7 bg-white relative">
             <div className="absolute inset-0 grid grid-rows-6">
              {Array(6).fill(0).map((_, i) => <div key={i} className={`border-[0.5px] border-black/10 ${i >= 0 && i < 5 ? "bg-[#ffcf2b]" : "bg-white"} ${i === 3 ? "relative" : ""}`}>
                {i === 3 && <Star className="absolute inset-0 m-auto text-black/10 w-6 h-6" />}
              </div>)}
            </div>
          </div>

          <div className="col-span-6 row-span-6 row-start-10 col-start-10 bg-[#ffcf2b] border-[1px] border-black/20 p-4 shadow-inner flex items-center justify-center">
            <div className="w-full h-full bg-white/90 rounded-2xl grid grid-cols-2 gap-4 p-4 shadow-[inset_0_4px_10px_rgba(0,0,0,0.1)]">
              {Array(4).fill(0).map((_, i) => <div key={i} className="bg-[#ffcf2b15] rounded-full border-[6px] border-[#ffcf2b25] flex items-center justify-center" />)}
            </div>
          </div>

          {/* Grid Layout Cell Markers - Stars and Decor */}
          <div className="absolute inset-0 grid grid-cols-15 grid-rows-15 pointer-events-none">
             {Array(225).fill(0).map((_, i) => (
                <div key={i} className="border-[0.2px] border-black/5 flex items-center justify-center" />
             ))}
          </div>

          {/* Pieces */}
          {players.flatMap(p => p.pieces).map((pc) => {
            const [r, c] = pc.position === -1 ? getBaseCoords(pc) : getCellCoords(pc.position, pc.color);
            const isTarget = canMove && pc.color === currentPlayer.color && (pc.position === -1 ? diceRoll === 6 : pc.position + diceRoll! <= 57);
            return (
              <motion.div
                key={`${pc.color}-${pc.id}`}
                layout
                onClick={() => isTarget && movePiece(pc)}
                style={{ gridRowStart: Math.floor(r + 1), gridColumnStart: Math.floor(c + 1) }}
                className={`w-full h-full p-1 z-20 cursor-pointer flex items-center justify-center ${isTarget ? "z-40" : ""}`}
              >
                <div 
                   className={`w-[85%] h-[85%] rounded-[50%_50%_45%_45%] border-b-[6px] border-black/40 relative shadow-[0_5px_15px_rgba(0,0,0,0.3)] transition-all duration-300 ${isTarget ? "ring-2 ring-white scale-125 z-50 brightness-110" : ""}`} 
                   style={{ backgroundColor: COLORS[pc.color] }}
                >
                   <div className="absolute top-[10%] left-[20%] w-[35%] h-[25%] bg-white/40 rounded-full blur-[1px]"></div>
                   <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4/5 h-1 bg-black/10 rounded-full"></div>
                   {isTarget && (
                     <motion.div
                       animate={{ opacity: [0, 1, 0], scale: [1, 1.2, 1] }}
                       transition={{ repeat: Infinity, duration: 1 }}
                       className="absolute -top-1 -right-1"
                     >
                       <Sparkles className="w-5 h-5 text-yellow-300" />
                     </motion.div>
                   )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Control Panel / Bottom UI */}
      <div className="mt-10 w-full max-w-[480px] grid grid-cols-2 gap-6 px-4">
        
        {/* Active Player Status */}
        <div className={`bg-white rounded-[2rem] p-4 flex items-center gap-4 shadow-xl border-l-[12px] transition-all duration-500 ${currentPlayer.color === "red" ? "border-[#f84b4b]" : currentPlayer.color === "blue" ? "border-[#2b8fff]" : currentPlayer.color === "yellow" ? "border-[#ffcf2b]" : "border-[#1dc164]"}`}>
           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner bg-slate-100`}>
             {currentPlayer.avatar}
           </div>
           <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Turn</span>
              <span className="text-sm font-black text-slate-700 truncate max-w-[100px]">{currentPlayer.name}</span>
           </div>
        </div>

        {/* Dice Area */}
        <div className="relative group">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={rollDice}
            disabled={rolling || canMove || isAnimating || !!winner}
            className={`w-full h-full bg-white rounded-[2rem] p-4 flex items-center justify-center shadow-xl border border-slate-200 disabled:opacity-80 relative overflow-hidden transition-all`}
          >
             {rolling ? (
               <div className="w-16 h-16 bg-slate-100 rounded-2xl animate-spin-slow flex items-center justify-center">
                  <Dices className="w-10 h-10 text-slate-300" />
               </div>
             ) : (
               <div className={`w-18 h-18 bg-slate-50 rounded-2xl shadow-inner border-2 transition-colors ${diceRoll ?'border-slate-200' : 'border-dashed border-slate-300'}`}>
                  {diceRoll ? getDiceDots(diceRoll) : <Dices className="w-10 h-10 text-slate-200 m-auto mt-2" />}
               </div>
             )}
             
             {/* Simple Turn Indicator Pulse */}
             {!diceRoll && !rolling && !winner && (
               <div className={`absolute inset-0 bg-gradient-to-r opacity-5 pointer-events-none animate-pulse ${currentPlayer.color === "red" ? "from-red-500" : currentPlayer.color === "blue" ? "from-blue-500" : currentPlayer.color === "yellow" ? "from-yellow-500" : "from-green-500"}`}></div>
             )}
          </motion.button>
        </div>
      </div>

      <div className="mt-8 bg-white/40 backdrop-blur-md px-8 py-3 rounded-full border border-white/50 shadow-sm">
        <p className="text-[11px] font-black tracking-widest text-slate-500 uppercase">
           {winner ? `${players.find(p => p.color === winner)?.name} Wins! 👑` : canMove ? "সিলেক্ট ইওর গুটি টু মুভ" : "রোল দ্যা ডাইস টু স্টার্ট"}
        </p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 1s linear infinite;
        }
      `}} />
    </div>
  );
}
