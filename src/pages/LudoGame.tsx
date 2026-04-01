import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Settings, RotateCcw, Trophy, Volume2, VolumeX } from "lucide-react";

// ─── TYPES ───────────────────────────────────────────────────────────────────
type PlayerColor = "red" | "green" | "blue" | "yellow";
type PlayerType = "human" | "ai";
type GamePhase = "setup" | "playing" | "finished";

interface Player {
  color: PlayerColor;
  type: PlayerType;
  name: string;
  tokens: number[]; // -1=home, 0-51=path, 52-56=lane, 57=done
}

interface MovingState {
  playerIdx: number;
  tokenIdx: number;
  path: number[]; // list of positions to visit
  target: number;
}

// ─── COLORS (Flat Modern Palette) ───────────────────────────────────────────
const COLORS: Record<PlayerColor, { vivid: string; dark: string; light: string; bg: string }> = {
  red:    { vivid: "#FF4D4D", dark: "#D63031", light: "#FFDADA", bg: "#FFF5F5" },
  green:  { vivid: "#2ECC71", dark: "#27AE60", light: "#D5F5E3", bg: "#F4FFF8" },
  blue:   { vivid: "#3498DB", dark: "#2980B9", light: "#D6EAF8", bg: "#F5FAFF" },
  yellow: { vivid: "#F1C40F", dark: "#F39C12", light: "#FEF9E7", bg: "#FFFDF2" },
};

const NAMES: Record<PlayerColor, string> = {
  red: "লাল", green: "সবুজ", blue: "নীল", yellow: "হলুদ",
};

const HOME_ZONES: Record<PlayerColor, [number, number]> = {
  red: [0, 0], green: [0, 9], blue: [9, 0], yellow: [9, 9],
};

// ─── AUDIO ASSETS ────────────────────────────────────────────────────────────
const AUDIO = {
  move: "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3", // pop
  capture: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3", // metallic
  win: "https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3", // festive
  dice: "https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3", // shake
};

// ─── STANDARD LUDO PATH (52 squares, clockwise) ───────────────────────────────
const CORRECT_PATH: [number, number][] = [
  // Red start zone
  [6,1], [7,1], [8,1], [8,2], [8,3], [8,4], [8,5], [9,6], [10,6], [11,6], [12,6], [13,6], [13,7],
  // Blue start zone
  [13,8], [12,8], [11,8], [10,8], [9,8], [8,9], [8,10], [8,11], [8,12], [8,13], [7,13], [6,13], [6,12],
  // Yellow start zone
  [6,11], [6,10], [6,9], [5,8], [4,8], [3,8], [2,8], [1,8], [1,7], [1,6], [2,6], [3,6], [4,6],
  // Green start zone
  [5,6], [6,5], [6,4], [6,3], [6,2], [5,1], [4,1], [3,1], [2,1], [1,1], [1,2], [1,3], [1,4]
];

const START_POS: Record<PlayerColor, number> = {
  red: 0, blue: 13, yellow: 26, green: 39,
};

const SAFE_SET = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

const HOME_LANES: Record<PlayerColor, [number, number][]> = {
  red:    [[7,2],[7,3],[7,4],[7,5],[7,6]],
  blue:   [[12,7],[11,7],[10,7],[9,7],[8,7]],
  yellow: [[7,12],[7,11],[7,10],[7,9],[7,8]],
  green:  [[2,7],[3,7],[4,7],[5,7],[6,7]],
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getPhysPos(pos: number, color: PlayerColor): [number, number] | null {
  if (pos < 0 || pos === 57) return null;
  if (pos < 52) return CORRECT_PATH[pos];
  return HOME_LANES[color][pos - 52] ?? null;
}

function getNewPos(cur: number, steps: number, color: PlayerColor): number | null {
  const sp = START_POS[color];
  if (cur === 57) return null;
  if (cur === -1) return steps === 6 ? sp : null;
  if (cur >= 52) {
    const next = cur + steps;
    if (next <= 56) return next;
    if (next === 57) return 57;
    return null;
  }
  const dist = (cur - sp + 52) % 52;
  const toEntry = 50 - dist;
  if (steps <= toEntry) return (cur + steps) % 52;
  const laneStep = steps - toEntry - 1;
  if (laneStep < 5) return 52 + laneStep;
  if (laneStep === 5) return 57;
  return null;
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function Token({ color, size = 28, glow = false, shadow = true }: {
  color: PlayerColor; size?: number; glow?: boolean; shadow?: boolean;
}) {
  const c = COLORS[color];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle at 35% 35%, ${c.vivid} 0%, ${c.dark} 100%)`,
        border: `2px solid rgba(255,255,255,0.4)`,
        boxShadow: glow 
          ? `0 0 15px ${c.vivid}, 0 0 5px white`
          : shadow ? "0 4px 6px rgba(0,0,0,0.3)" : "none",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{
        width: "40%",
        height: "40%",
        borderRadius: "50%",
        background: "rgba(255,255,255,0.2)",
        position: "absolute",
        top: "15%",
        left: "15%",
      }} />
    </div>
  );
}

function DiceFace({ n, sz = 52 }: { n: number; sz?: number }) {
  const layouts: Record<number, [number,number][]> = {
    1: [[50,50]],
    2: [[25,25],[75,75]],
    3: [[25,25],[50,50],[75,75]],
    4: [[25,25],[75,25],[25,75],[75,75]],
    5: [[25,25],[75,25],[50,50],[25,75],[75,75]],
    6: [[25,20],[75,20],[25,50],[75,50],[25,80],[75,80]],
  };
  const dots = layouts[n] ?? [];
  return (
    <svg width={sz} height={sz} viewBox="0 0 100 100">
      <rect x="5" y="5" width="90" height="90" rx="15" fill="white" stroke="#eee" strokeWidth="1"/>
      {dots.map(([x,y],i) => <circle key={i} cx={x} cy={y} r="8" fill="#333"/>)}
    </svg>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function LudoGame() {
  const navigate = useNavigate();
  const CELL = 42;
  const GRID = 15;
  const BOARD_PX = CELL * GRID;
  const DICE_SZ = 64;

  const [phase, setPhase] = useState<GamePhase>("setup");
  const [numPlayers, setNumPlayers] = useState<2|4>(4);
  const [playerTypes, setPlayerTypes] = useState<Record<PlayerColor,PlayerType>>({
    red:"human", green:"ai", blue:"ai", yellow:"ai",
  });
  const [players, setPlayers] = useState<Player[]>([]);
  const [curIdx, setCurIdx] = useState(0);
  const [dice, setDice] = useState<number|null>(null);
  const [diceRolled, setDiceRolled] = useState(false);
  const [movable, setMovable] = useState<number[]>([]);
  const [winner, setWinner] = useState<PlayerColor|null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [msg, setMsg] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Animation state
  const [moving, setMoving] = useState<MovingState | null>(null);

  const playersRef = useRef(players);
  const curIdxRef = useRef(curIdx);
  const isMovingRef = useRef(false);

  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { curIdxRef.current = curIdx; }, [curIdx]);

  const playSfx = useCallback((type: keyof typeof AUDIO) => {
    if (!soundEnabled) return;
    const a = new Audio(AUDIO[type]);
    a.volume = 0.5;
    a.play().catch(() => {});
  }, [soundEnabled]);

  const nextTurn = useCallback((ni: number, pls: Player[]) => {
    setCurIdx(ni);
    setDice(null);
    setDiceRolled(false);
    setMovable([]);
  }, []);

  // Step-by-step movement logic
  useEffect(() => {
    if (!moving) return;
    const { playerIdx, tokenIdx, path, target } = moving;
    if (path.length === 0) {
      // Finalize move
      const pls = playersRef.current;
      const player = pls[playerIdx];
      let captured = false;
      
      const newPlayers = pls.map((p, pi) => {
        if (pi === playerIdx) {
          const t = [...p.tokens]; t[tokenIdx] = target; return {...p, tokens: t};
        }
        if (target < 52 && !SAFE_SET.has(target)) {
          const tIndices = p.tokens.map((tp, i) => tp === target ? i : -1).filter(i => i !== -1);
          if (tIndices.length > 0) {
            captured = true;
            return {...p, tokens: p.tokens.map(tp => tp === target ? -1 : tp)};
          }
        }
        return p;
      });

      setPlayers(newPlayers);
      playersRef.current = newPlayers;
      setMoving(null);
      isMovingRef.current = false;

      if (captured) playSfx("capture");

      if (newPlayers[playerIdx].tokens.every(t => t === 57)) {
        setWinner(newPlayers[playerIdx].color);
        setPhase("finished");
        playSfx("win");
        return;
      }

      if (dice === 6 || captured) {
        setDice(null); setDiceRolled(false); setMovable([]);
        setMsg(captured ? "সুন্দর! আবার চাল!" : "ছক্কা! আবার চাল!");
      } else {
        nextTurn((playerIdx + 1) % newPlayers.length, newPlayers);
        setMsg("");
      }
      return;
    }

    const timer = setTimeout(() => {
      const currentPos = path[0];
      const newPath = path.slice(1);
      
      const newPlayers = playersRef.current.map((p, pi) => {
        if (pi === playerIdx) {
          const t = [...p.tokens]; t[tokenIdx] = currentPos; return {...p, tokens: t};
        }
        return p;
      });
      setPlayers(newPlayers);
      playSfx("move");
      setMoving({ ...moving, path: newPath });
    }, 200);

    return () => clearTimeout(timer);
  }, [moving, dice, nextTurn, playSfx]);

  const doMove = useCallback((tokenIdx: number, d: number) => {
    if (isMovingRef.current) return;
    const pls = playersRef.current;
    const idx = curIdxRef.current;
    const player = pls[idx];
    const currentPos = player.tokens[tokenIdx];
    const targetPos = getNewPos(currentPos, d, player.color);
    if (targetPos === null) return;

    isMovingRef.current = true;
    
    // Calculate path
    const path: number[] = [];
    if (currentPos === -1) {
      path.push(START_POS[player.color]);
    } else {
      let temp = currentPos;
      for (let i = 0; i < d; i++) {
        temp = getNewPos(temp, 1, player.color)!;
        path.push(temp);
      }
    }

    setMoving({
      playerIdx: idx,
      tokenIdx,
      path,
      target: targetPos
    });
  }, []);

  const handleRoll = useCallback(() => {
    if (diceRolled || isRolling || isMovingRef.current) return;
    setIsRolling(true); setMsg("");
    playSfx("dice");
    
    let c = 0;
    const itv = setInterval(() => {
      setDice(Math.floor(Math.random() * 6) + 1);
      c++;
      if (c >= 12) {
        clearInterval(itv);
        const final = Math.floor(Math.random() * 6) + 1;
        setDice(final);
        setIsRolling(false);
        setDiceRolled(true);
        
        const fp = playersRef.current[curIdxRef.current];
        const mv = fp.tokens.reduce<number[]>((acc, pos, i) => {
          if (getNewPos(pos, final, fp.color) !== null) acc.push(i);
          return acc;
        }, []);
        
        setMovable(mv);
        if (mv.length === 0) {
          setMsg("কোনো চাল নেই!");
          setTimeout(() => {
            const pls2 = playersRef.current;
            nextTurn((curIdxRef.current + 1) % pls2.length, pls2);
            setMsg("");
          }, 1000);
        } else if (mv.length === 1 && fp.type === "human") {
          setTimeout(() => doMove(mv[0], final), 400);
        }
      }
    }, 60);
  }, [diceRolled, isRolling, nextTurn, doMove, playSfx]);

  // AI Turn Logic
  useEffect(() => {
    if (phase !== "playing" || winner || isMovingRef.current) return;
    const player = playersRef.current[curIdx];
    if (player?.type !== "ai") return;

    if (!diceRolled && !isRolling) {
      const timer = setTimeout(handleRoll, 800);
      return () => clearTimeout(timer);
    }

    if (diceRolled && movable.length > 0) {
      const timer = setTimeout(() => {
        const bestMove = movable[Math.floor(Math.random() * movable.length)];
        doMove(bestMove, dice!);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [curIdx, diceRolled, isRolling, movable, phase, winner, doMove, handleRoll, dice]);

  const startGame = () => {
    const colors: PlayerColor[] = numPlayers === 4 
      ? ["red", "green", "blue", "yellow"] 
      : ["red", "yellow"];
    const pls: Player[] = colors.map(c => ({
      color: c, type: playerTypes[c], name: NAMES[c], tokens: [-1,-1,-1,-1],
    }));
    setPlayers(pls);
    setCurIdx(0);
    setPhase("playing");
    setWinner(null);
    setDice(null);
    setDiceRolled(false);
    setMovable([]);
    setMsg("");
  };

  // ─── RENDER HELPERS ────────────────────────────────────────────────────────

  function getCellBg(row: number, col: number) {
    // Homes
    if (row < 6 && col < 6) return COLORS.red.bg;
    if (row < 6 && col >= 9) return COLORS.green.bg;
    if (row >= 9 && col < 6) return COLORS.blue.bg;
    if (row >= 9 && col >= 9) return COLORS.yellow.bg;
    
    // Lanes
    if (row === 7 && col >= 1 && col <= 5) return COLORS.red.light;
    if (row === 7 && col >= 9 && col <= 13) return COLORS.yellow.light;
    if (col === 7 && row >= 1 && row <= 5) return COLORS.green.light;
    if (col === 7 && row >= 9 && row <= 13) return COLORS.blue.light;

    // Start Squares
    const isStart = (r:number, c:number) => {
      if (r===6 && c===1) return COLORS.red.vivid;
      if (r===13 && c===8) return COLORS.blue.vivid;
      if (r===6 && c===13) return COLORS.yellow.vivid;
      if (r===1 && c===6) return COLORS.green.vivid;
      return null;
    };
    const startColor = isStart(row, col);
    if (startColor) return startColor;

    return "#ffffff";
  }

  const tokenMap: Record<string, Array<{color: PlayerColor; ti: number}>> = {};
  players.forEach(p => {
    p.tokens.forEach((pos, ti) => {
      const ph = getPhysPos(pos, p.color);
      if (!ph) return;
      const key = `${ph[0]},${ph[1]}`;
      if (!tokenMap[key]) tokenMap[key] = [];
      tokenMap[key].push({color: p.color, ti});
    });
  });

  if (phase === "setup") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-4 select-none">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} 
          className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-8 border border-gray-100">
          
          <div className="flex justify-between items-center mb-8">
            <button onClick={() => navigate("/")} className="p-3 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-400" />
            </button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Ludo Modern</h1>
            <div className="w-12" />
          </div>

          <div className="space-y-8">
            <div>
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Players</p>
              <div className="flex gap-4">
                {[2, 4].map(n => (
                  <button key={n} onClick={() => setNumPlayers(n as 2|4)} 
                    className={`flex-1 py-4 rounded-3xl font-bold transition-all ${numPlayers === n ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-gray-50 text-gray-400"}`}>
                    {n} Players
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-2">Configure</p>
              {(numPlayers === 4 ? ["red", "green", "blue", "yellow"] : ["red", "yellow"] as PlayerColor[]).map((c, i) => (
                <div key={c} className="flex items-center gap-4 p-4 bg-gray-50 rounded-3xl">
                  <Token color={c} size={32} shadow={false} />
                  <span className="flex-1 font-bold text-gray-700">Player {i+1} ({NAMES[c]})</span>
                  <div className="flex bg-white rounded-2xl p-1 shadow-sm">
                    {["human", "ai"].map(t => (
                      <button key={t} onClick={() => setPlayerTypes(prev => ({...prev, [c]: t}))}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${playerTypes[c] === t ? `bg-[${COLORS[c].vivid}] text-white shadow-md` : "text-gray-300"}`}
                        style={{ backgroundColor: playerTypes[c] === t ? COLORS[c].vivid : "" }}>
                        {t === "human" ? "👤" : "🤖"}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={startGame} className="w-full py-5 bg-indigo-600 text-white rounded-[32px] text-xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3">
               Start Game
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (phase === "finished" && winner) {
     return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} 
            className="bg-white rounded-[50px] shadow-2xl p-12 text-center max-w-sm w-full">
            <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-6" />
            <h2 className="text-4xl font-black mb-2" style={{ color: COLORS[winner].vivid }}>{NAMES[winner]} জিতেছে!</h2>
            <p className="text-gray-400 font-medium mb-10">অভিনন্দন! আপনি চমৎকার খেলেছেন।</p>
            <div className="flex gap-4">
              <button onClick={() => setPhase("setup")} className="flex-1 py-4 bg-gray-100 rounded-[24px] font-bold text-gray-600 flex items-center justify-center gap-2">
                <RotateCcw className="w-5 h-5" /> আবার
              </button>
              <button onClick={() => navigate("/")} className="flex-1 py-4 bg-indigo-600 rounded-[24px] font-bold text-white shadow-lg shadow-indigo-100">
                হোম
              </button>
            </div>
          </motion.div>
        </div>
     );
  }

  const curPlayer = players[curIdx];
  if (!curPlayer) return null;
  const canRoll = !diceRolled && !isRolling && !isMovingRef.current && curPlayer.type === "human";

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F8FAFC] select-none p-4"
      style={{ scale: "var(--ludo-scale, 1)" }}>
      
      {/* Header Info */}
      <div className="w-full max-w-[650px] flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setPhase("setup")} className="p-3 bg-white rounded-2xl shadow-sm">
            <ArrowLeft className="w-6 h-6 text-gray-400" />
          </button>
          <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-3 bg-white rounded-2xl shadow-sm">
            {soundEnabled ? <Volume2 className="w-6 h-6 text-indigo-500" /> : <VolumeX className="w-6 h-6 text-gray-400" />}
          </button>
        </div>
        <div className="px-6 py-3 bg-white rounded-full shadow-sm flex items-center gap-3">
          <Token color={curPlayer.color} size={20} shadow={false} />
          <span className="font-bold text-gray-700">{curPlayer.name} এর পালা</span>
        </div>
        <div className="w-24" />
      </div>

      <div className="relative">
        {/* Main Board */}
        <div className="bg-white p-2 rounded-[32px] shadow-xl border border-white">
          <div className="relative overflow-hidden rounded-[24px] border border-gray-100"
            style={{ width: BOARD_PX, height: BOARD_PX }}>
            
            {/* Grid */}
            {Array.from({length: GRID}).map((_, r) => (
              <div key={r} className="flex">
                {Array.from({length: GRID}).map((_, c) => {
                  const key = `${r},${c}`;
                  const tokensHere = tokenMap[key] ?? [];
                  const bg = getCellBg(r, c);
                  const isSafe = SAFE_SET.has(CORRECT_PATH.findIndex(p => p[0]===r && p[1]===c));
                  
                  return (
                    <div key={c} className="relative flex items-center justify-center border-[0.5px] border-gray-100"
                      style={{ width: CELL, height: CELL, backgroundColor: bg }}>
                      {isSafe && tokensHere.length === 0 && <span className="text-[10px] opacity-20">★</span>}
                      
                      <div className="flex flex-wrap items-center justify-center gap-0.5 z-10 w-full h-full p-0.5">
                        {tokensHere.map(({color, ti}) => {
                          const isMovable = curPlayer.color === color && diceRolled && movable.includes(ti) && !isMovingRef.current;
                          return (
                            <motion.div key={`${color}-${ti}`}
                              layoutId={`${color}-${ti}`}
                              initial={false}
                              animate={isMovable ? { y: [0, -10, 0], scale: [1, 1.1, 1] } : { y: 0, scale: 1 }}
                              transition={isMovable ? { repeat: Infinity, duration: 0.6 } : { type: "spring", stiffness: 300, damping: 20 }}
                              onClick={() => isMovable && doMove(ti, dice!)}
                              className={isMovable ? "cursor-pointer" : ""}>
                              <Token color={color} size={tokensHere.length > 2 ? 14 : CELL * 0.7} glow={isMovable} />
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Home Base Overlays */}
            {(["red", "green", "blue", "yellow"] as PlayerColor[]).map(c => {
               const [r, col] = HOME_ZONES[c];
               const player = players.find(p => p.color === c);
               if (!player) return null;
               const isActive = curPlayer.color === c;
               return (
                 <div key={c} className="absolute p-4 flex items-center justify-center"
                   style={{ top: r * CELL, left: col * CELL, width: 6 * CELL, height: 6 * CELL }}>
                   <div className="w-full h-full bg-white/90 rounded-[40px] shadow-inner grid grid-cols-2 gap-4 p-4 border border-white">
                      {[0, 1, 2, 3].map(i => (
                        <div key={i} className="flex items-center justify-center">
                          {player.tokens[i] === -1 ? (
                            <Token color={c} size={CELL * 0.9} glow={isActive && dice === 6 && !isMovingRef.current} />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100" />
                          )}
                        </div>
                      ))}
                   </div>
                 </div>
               );
            })}

            {/* Center Finish */}
            <div className="absolute" style={{ top: 6 * CELL, left: 6 * CELL, width: 3 * CELL, height: 3 * CELL }}>
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <path d="M0 0 L50 50 L100 0 Z" fill={COLORS.green.vivid} />
                <path d="M100 0 L50 50 L100 100 Z" fill={COLORS.yellow.vivid} />
                <path d="M100 100 L50 50 L0 100 Z" fill={COLORS.blue.vivid} />
                <path d="M0 100 L50 50 L0 0 Z" fill={COLORS.red.vivid} />
              </svg>
            </div>
          </div>
        </div>

        {/* Dice Area */}
        <div className="absolute -right-24 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
           {canRoll && (
             <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1 }}
               className="text-indigo-600 font-black text-2xl">↓</motion.div>
           )}
           <button onClick={canRoll ? handleRoll : undefined} disabled={!canRoll}
             className={`w-20 h-20 rounded-3xl bg-white shadow-xl flex items-center justify-center transition-all ${canRoll ? "ring-4 ring-indigo-500 scale-110" : "opacity-80 disabled:cursor-not-allowed"}`}>
              <motion.div animate={isRolling ? { rotate: [0, 90, 180, 270, 360], scale: [1, 0.8, 1] } : {}}
                transition={{ repeat: isRolling ? Infinity : 0, duration: 0.2 }}>
                {dice ? <DiceFace n={dice} sz={52} /> : <span className="text-3xl">🎲</span>}
              </motion.div>
           </button>
           {msg && (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
               className="bg-indigo-600 text-white px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap shadow-lg">
                {msg}
             </motion.div>
           )}
        </div>
      </div>
    </div>
  );
}
