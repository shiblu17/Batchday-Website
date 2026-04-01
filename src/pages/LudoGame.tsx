import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { X, Dices, Users, Bot, ChevronRight, RotateCcw, Trophy } from "lucide-react";

// ─── TYPES ───────────────────────────────────────────────────────────────────
type PlayerColor = "blue" | "green" | "yellow" | "red";
type PlayerType = "human" | "ai";
type GamePhase = "setup" | "playing" | "finished";

interface Player {
  color: PlayerColor;
  type: PlayerType;
  name: string;
  tokens: number[]; // -1=home, 0-51=main path, 52-56=lane, 57=done
}

// ─── BOARD CONSTANTS ─────────────────────────────────────────────────────────
const LUDO_PATH: [number, number][] = [
  [6,1],[7,1],[8,1],[8,2],[8,3],[8,4],[8,5],
  [9,6],[10,6],[11,6],[12,6],[13,6],[13,7],[13,8],
  [12,8],[11,8],[10,8],[9,8],[8,9],[8,10],[8,11],[8,12],[8,13],
  [7,13],[6,13],[6,12],[6,11],[6,10],[6,9],
  [5,8],[4,8],[3,8],[2,8],[1,8],[1,7],[1,6],
  [2,6],[3,6],[4,6],[5,6],
  [6,5],[6,4],[6,3],[6,2],
  [5,1],[4,1],[3,1],[2,1],[1,1],[1,2],[1,3],[1,4],
];

const HOME_LANES: Record<PlayerColor, [number, number][]> = {
  blue:   [[7,2],[7,3],[7,4],[7,5],[7,6]],
  red:    [[7,12],[7,11],[7,10],[7,9],[7,8]],
  green:  [[2,7],[3,7],[4,7],[5,7],[6,7]],
  yellow: [[12,7],[11,7],[10,7],[9,7],[8,7]],
};

const START_POS: Record<PlayerColor, number> = { blue: 0, red: 13, green: 26, yellow: 39 };
const SAFE_SQUARES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

const COLORS: Record<PlayerColor, { dot: string; light: string; bg: string }> = {
  blue:   { dot: "#38bdf8", light: "#e0f2fe", bg: "#bfdbfe" },
  green:  { dot: "#4ade80", light: "#dcfce7", bg: "#bbf7d0" },
  yellow: { dot: "#facc15", light: "#fef9c3", bg: "#fef08a" },
  red:    { dot: "#f87171", light: "#fee2e2", bg: "#fecaca" },
};

const NAMES: Record<PlayerColor, string> = {
  blue: "নীল", green: "সবুজ", yellow: "হলুদ", red: "লাল",
};

const HOME_ZONES: Record<PlayerColor, [number, number]> = {
  blue: [0, 0], green: [0, 9], yellow: [9, 0], red: [9, 9],
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getPhysPos(pos: number, color: PlayerColor): [number, number] | null {
  if (pos < 0 || pos === 57) return null;
  if (pos < 52) return LUDO_PATH[pos];
  return HOME_LANES[color][pos - 52] ?? null;
}

function getNewPos(current: number, steps: number, color: PlayerColor): number | null {
  if (current === 57) return null;
  if (current === -1) return steps === 6 ? START_POS[color] : null;
  if (current >= 52) {
    const next = current + steps;
    if (next <= 56) return next;
    if (next === 57) return 57;
    return null;
  }
  const distFromStart = (current - START_POS[color] + 52) % 52;
  const toEntry = 50 - distFromStart;
  if (steps <= toEntry) return (current + steps) % 52;
  const laneStep = steps - toEntry - 1;
  if (laneStep < 5) return 52 + laneStep;
  if (laneStep === 5) return 57;
  return null;
}

function rollDice() { return Math.floor(Math.random() * 6) + 1; }
function getDiceFace(n: number) { return ["⚀","⚁","⚂","⚃","⚄","⚅"][n-1] ?? "🎲"; }

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function LudoGame() {
  const navigate = useNavigate();
  const CELL = 40;
  const GRID = 15;
  const BOARD_PX = CELL * GRID; // 600px
  const DICE_SIZE = 56;

  const [phase, setPhase] = useState<GamePhase>("setup");
  const [numPlayers, setNumPlayers] = useState<2 | 4>(4);
  const [playerTypes, setPlayerTypes] = useState<Record<PlayerColor, PlayerType>>({
    blue: "human", green: "ai", yellow: "ai", red: "ai",
  });
  const [players, setPlayers] = useState<Player[]>([]);
  const [curIdx, setCurIdx] = useState(0);
  const [dice, setDice] = useState<number | null>(null);
  const [diceRolled, setDiceRolled] = useState(false);
  const [movable, setMovable] = useState<number[]>([]);
  const [winner, setWinner] = useState<PlayerColor | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [msg, setMsg] = useState("");

  const aiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playersRef = useRef(players);
  const curIdxRef = useRef(curIdx);
  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { curIdxRef.current = curIdx; }, [curIdx]);

  const cur = players[curIdx];

  // Viewport scale
  useEffect(() => {
    function calc() {
      const vh = window.innerHeight - 64;
      const vw = window.innerWidth;
      const needed = BOARD_PX + 56 + 8 + 8 + 56 + 48; // board + 2 rows + controls
      const scale = Math.min(vh / needed, vw / BOARD_PX, 1);
      document.documentElement.style.setProperty("--ludo-scale", String(scale));
    }
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [BOARD_PX]);

  // Next turn
  const nextTurn = useCallback((nextIdx: number, pls: Player[]) => {
    setCurIdx(nextIdx);
    setDice(null);
    setDiceRolled(false);
    setMovable([]);
    if (pls[nextIdx]?.type === "human") {
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 2000);
    }
  }, []);

  // Move token
  const doMove = useCallback((tokenIdx: number, d: number) => {
    const usePls = playersRef.current;
    const useIdx = curIdxRef.current;
    const player = usePls[useIdx];
    const newPos = getNewPos(player.tokens[tokenIdx], d, player.color);
    if (newPos === null) return;

    const newPlayers = usePls.map((p, pi) => {
      if (pi === useIdx) {
        const t = [...p.tokens]; t[tokenIdx] = newPos; return { ...p, tokens: t };
      }
      if (newPos < 52 && !SAFE_SQUARES.has(newPos)) {
        return { ...p, tokens: p.tokens.map(tp => tp === newPos ? -1 : tp) };
      }
      return p;
    });

    setPlayers(newPlayers);
    playersRef.current = newPlayers;

    if (newPlayers[useIdx].tokens.every(t => t === 57)) {
      setWinner(newPlayers[useIdx].color); setPhase("finished"); return;
    }
    if (d === 6) {
      setDice(null); setDiceRolled(false); setMovable([]);
      setMsg(`${player.name} আবার চাল দেবে!`);
    } else {
      nextTurn((useIdx + 1) % newPlayers.length, newPlayers);
      setMsg("");
    }
  }, [nextTurn]);

  // Roll
  const handleRoll = useCallback(() => {
    if (diceRolled || isRolling) return;
    setIsRolling(true); setMsg("");
    let c = 0;
    const itv = setInterval(() => {
      setDice(rollDice()); c++;
      if (c >= 8) {
        clearInterval(itv);
        const final = rollDice();
        setDice(final); setIsRolling(false); setDiceRolled(true);
        const fp = playersRef.current[curIdxRef.current];
        const mv = fp.tokens.reduce<number[]>((acc, pos, i) => {
          if (getNewPos(pos, final, fp.color) !== null) acc.push(i); return acc;
        }, []);
        setMovable(mv);
        if (mv.length === 0) {
          setMsg("কোনো চাল নেই!");
          setTimeout(() => {
            const pls = playersRef.current;
            nextTurn((curIdxRef.current + 1) % pls.length, pls);
            setMsg("");
          }, 1200);
        } else if (mv.length === 1) {
          setTimeout(() => doMove(mv[0], final), 500);
        }
      }
    }, 80);
  }, [diceRolled, isRolling, nextTurn, doMove]);

  // AI effects
  useEffect(() => {
    if (phase !== "playing" || !cur || cur.type !== "ai" || diceRolled) return;
    aiTimer.current = setTimeout(handleRoll, 900);
    return () => { if (aiTimer.current) clearTimeout(aiTimer.current); };
  }, [curIdx, phase, cur?.type, diceRolled, handleRoll]);

  useEffect(() => {
    if (phase !== "playing" || !cur || cur.type !== "ai") return;
    if (!diceRolled || movable.length <= 1) return;
    const d = dice; if (!d) return;
    aiTimer.current = setTimeout(() => {
      doMove(movable[Math.floor(Math.random() * movable.length)], d);
    }, 700);
    return () => { if (aiTimer.current) clearTimeout(aiTimer.current); };
  }, [diceRolled, movable.length, cur?.type, phase, dice, doMove]);

  function startGame() {
    const colors: PlayerColor[] = numPlayers === 4
      ? ["blue","green","yellow","red"] : ["blue","red"];
    const pls: Player[] = colors.map(c => ({
      color: c, type: playerTypes[c], name: NAMES[c], tokens: [-1,-1,-1,-1],
    }));
    setPlayers(pls); setCurIdx(0); setDice(null); setDiceRolled(false);
    setMovable([]); setWinner(null); setPhase("playing"); setMsg("");
    if (pls[0].type === "human") {
      setTimeout(() => { setShowBanner(true); setTimeout(() => setShowBanner(false), 2000); }, 500);
    }
  }

  function cellBg(row: number, col: number): string {
    if (row <= 5 && col <= 5) return COLORS.blue.light;
    if (row <= 5 && col >= 9) return COLORS.green.light;
    if (row >= 9 && col <= 5) return COLORS.yellow.light;
    if (row >= 9 && col >= 9) return COLORS.red.light;
    if (row === 7 && col >= 1 && col <= 5) return COLORS.blue.light;
    if (row === 7 && col >= 9 && col <= 13) return COLORS.red.light;
    if (col === 7 && row >= 1 && row <= 5) return COLORS.green.light;
    if (col === 7 && row >= 9 && row <= 13) return COLORS.yellow.light;
    return "#ffffff";
  }

  const tokenMap: Record<string, Array<{ color: PlayerColor; ti: number }>> = {};
  players.forEach(p => {
    p.tokens.forEach((pos, ti) => {
      const ph = getPhysPos(pos, p.color);
      if (!ph) return;
      const k = `${ph[0]},${ph[1]}`;
      (tokenMap[k] ??= []).push({ color: p.color, ti });
    });
  });

  const bgColor = cur ? COLORS[cur.color].bg : "#bfdbfe";

  // ─── SETUP ───────────────────────────────────────────────────────────────
  if (phase === "setup") {
    const ac: PlayerColor[] = numPlayers === 4
      ? ["blue","green","yellow","red"] : ["blue","red"];
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #bfdbfe 0%, #ddd6fe 100%)" }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md mx-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-black text-gray-800">🎲 লুডু</h1>
              <p className="text-gray-500 text-sm">JU ৫২তম ব্যাচ ডে স্পেশাল</p>
            </div>
            <button onClick={() => navigate("/game")} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="mb-6">
            <p className="text-sm font-bold text-gray-600 mb-3">কতজন খেলবে?</p>
            <div className="grid grid-cols-2 gap-3">
              {([2, 4] as const).map(n => (
                <button key={n} onClick={() => setNumPlayers(n)}
                  className={`flex items-center justify-center gap-2 py-3 rounded-2xl border-2 font-bold transition-all ${
                    numPlayers === n ? "border-blue-400 bg-blue-50 text-blue-600 shadow-md" : "border-gray-200 text-gray-500"
                  }`}><Users className="w-4 h-4" />{n} জন</button>
              ))}
            </div>
          </div>
          <div className="mb-8 space-y-3">
            <p className="text-sm font-bold text-gray-600">খেলোয়াড় ধরন</p>
            {ac.map(color => (
              <div key={color} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50">
                <div className="w-8 h-8 rounded-full border-2 border-white shadow-md flex-shrink-0"
                  style={{ backgroundColor: COLORS[color].dot }} />
                <span className="font-semibold text-gray-700 flex-1 text-sm">{NAMES[color]}</span>
                <div className="flex rounded-xl overflow-hidden border-2 border-gray-200">
                  {(["human", "ai"] as const).map(t => (
                    <button key={t} onClick={() => setPlayerTypes(p => ({ ...p, [color]: t }))}
                      className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold transition-all ${
                        playerTypes[color] === t ? "text-white" : "text-gray-400 hover:bg-gray-50"
                      }`}
                      style={playerTypes[color] === t ? { backgroundColor: COLORS[color].dot } : {}}>
                      {t === "human" ? <Users className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                      {t === "human" ? "মানুষ" : "এআই"}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={startGame}
            className="w-full py-4 rounded-2xl text-white font-black text-lg flex items-center justify-center gap-2 shadow-lg"
            style={{ background: "linear-gradient(135deg, #38bdf8, #818cf8)" }}>
            <Dices className="w-5 h-5" />খেলা শুরু!<ChevronRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // ─── WIN SCREEN ───────────────────────────────────────────────────────────
  if (phase === "finished" && winner) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: COLORS[winner].bg }}>
        <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="bg-white rounded-3xl shadow-2xl p-10 text-center max-w-sm mx-4">
          <motion.div animate={{ rotate: [0,-10,10,-10,0], scale: [1,1.2,1] }}
            transition={{ repeat: Infinity, duration: 2 }} className="text-6xl mb-4">🏆</motion.div>
          <h2 className="text-3xl font-black text-gray-800 mb-1">{NAMES[winner]} জিতেছে!</h2>
          <p className="text-gray-400 mb-8 text-sm">অভিনন্দন 🎉</p>
          <div className="flex gap-3">
            <button onClick={() => setPhase("setup")}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50">
              <RotateCcw className="w-4 h-4" />আবার
            </button>
            <button onClick={() => navigate("/game")}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-white font-bold shadow-lg"
              style={{ backgroundColor: COLORS[winner].dot }}>
              <Trophy className="w-4 h-4" />গেম হাব
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // ─── GAME BOARD ───────────────────────────────────────────────────────────
  // Dice floats to current player's corner
  // Layout: topRow(56px) + gap(8px) + board(600px) + gap(8px) + botRow(56px)
  const TOP_Y = 0;
  const BOT_Y = 56 + 8 + BOARD_PX + 8;
  const dicePosMap: Record<PlayerColor, { x: number; y: number }> = {
    blue:   { x: 4,                       y: TOP_Y },
    green:  { x: BOARD_PX - DICE_SIZE - 4, y: TOP_Y },
    yellow: { x: 4,                       y: BOT_Y },
    red:    { x: BOARD_PX - DICE_SIZE - 4, y: BOT_Y },
  };
  const diceTarget = cur ? dicePosMap[cur.color] : { x: BOARD_PX/2 - DICE_SIZE/2, y: TOP_Y };
  const canRoll = cur?.type === "human" && !diceRolled && !isRolling;

  // Player corner indicator
  function PlayerCorner({ color, flip }: { color: PlayerColor; flip?: boolean }) {
    const p = players.find(pl => pl.color === color);
    if (!p) return <div style={{ width: 100 }} />;
    const isActive = cur?.color === color;
    return (
      <motion.div
        animate={{ scale: isActive ? 1.12 : 1, opacity: isActive ? 1 : 0.5 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`flex items-center gap-2 ${flip ? "flex-row-reverse" : ""}`}
      >
        <div className="w-10 h-10 rounded-xl border-2 border-white shadow-lg flex items-center justify-center"
          style={{ backgroundColor: COLORS[color].dot }}>
          {p.type === "ai" ? <Bot className="w-4 h-4 text-white" /> : <Users className="w-4 h-4 text-white" />}
        </div>
        <span className={`text-xs font-bold text-gray-600 ${flip ? "text-right" : ""}`}>{p.name}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="h-screen w-full flex flex-col items-center justify-center overflow-hidden select-none"
      style={{ paddingTop: 64 }}
      animate={{ backgroundColor: bgColor }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex flex-col items-center"
        style={{ transform: `scale(var(--ludo-scale, 1))`, transformOrigin: "center center" }}>

        {/* ─── Main wrapper (relative for floating dice) ─── */}
        <div className="relative" style={{ width: BOARD_PX }}>

          {/* TOP ROW */}
          <div className="flex justify-between items-center px-1 mb-2" style={{ height: 56 }}>
            <PlayerCorner color="blue" />
            <PlayerCorner color="green" flip />
          </div>

          {/* BOARD */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl"
            style={{ width: BOARD_PX, height: BOARD_PX, border: "4px solid #374151", backgroundColor: "#f9fafb" }}>

            {/* Grid */}
            {Array.from({ length: GRID }, (_, row) => (
              <div key={row} className="flex" style={{ height: CELL }}>
                {Array.from({ length: GRID }, (_, col) => {
                  const k = `${row},${col}`;
                  const here = tokenMap[k] ?? [];
                  const pathIdx = LUDO_PATH.findIndex(([r,c]) => r===row && c===col);
                  const isSafe = pathIdx>=0 && SAFE_SQUARES.has(pathIdx);
                  return (
                    <div key={col}
                      className="relative flex items-center justify-center border border-gray-200 flex-shrink-0"
                      style={{ width: CELL, height: CELL, backgroundColor: cellBg(row, col) }}
                    >
                      {isSafe && <span className="absolute text-[8px] opacity-20 select-none">⭐</span>}
                      {here.length > 0 && (
                        <div className="flex flex-wrap gap-[2px] items-center justify-center z-10 w-full h-full p-1">
                          {here.slice(0, 4).map(({ color, ti }) => {
                            const isMovable = cur?.color===color && diceRolled && movable.includes(ti);
                            const sz = here.length > 2 ? 13 : 20;
                            return (
                              <motion.div
                                key={`${color}-${ti}`}
                                layout
                                initial={{ scale: 0.3, opacity: 0 }}
                                animate={isMovable ? {
                                  scale: [1, 1.5, 1, 1.5, 1],
                                  y: [0, -7, 0, -7, 0],
                                  boxShadow: [
                                    `0 2px 5px ${COLORS[color].dot}44`,
                                    `0 0 22px 9px ${COLORS[color].dot}cc`,
                                    `0 2px 5px ${COLORS[color].dot}44`,
                                    `0 0 22px 9px ${COLORS[color].dot}cc`,
                                    `0 2px 5px ${COLORS[color].dot}44`,
                                  ],
                                } : {
                                  scale: 1, y: 0, opacity: 1,
                                  boxShadow: `0 2px 5px rgba(0,0,0,0.15)`,
                                }}
                                transition={isMovable
                                  ? { duration: 1.0, repeat: Infinity, ease: "easeInOut" }
                                  : { type: "spring", stiffness: 420, damping: 22, opacity: { duration: 0.15 } }}
                                onClick={() => { if (isMovable && dice) doMove(ti, dice); }}
                                className="rounded-full border-2 border-white flex-shrink-0"
                                style={{
                                  width: sz, height: sz,
                                  backgroundColor: COLORS[color].dot,
                                  cursor: isMovable ? "pointer" : "default",
                                  zIndex: isMovable ? 20 : 10,
                                }}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Home zone overlays */}
            {(["blue","green","yellow","red"] as PlayerColor[])
              .filter(c => players.some(p => p.color===c))
              .map(color => {
                const [rS,cS] = HOME_ZONES[color];
                const player = players.find(p => p.color===color)!;
                const isActive = cur?.color===color;
                return (
                  <div key={color} className="absolute pointer-events-none"
                    style={{ left: cS*CELL, top: rS*CELL, width: 6*CELL, height: 6*CELL }}>
                    <motion.div
                      className="absolute inset-2 rounded-2xl flex items-center justify-center"
                      animate={{ boxShadow: isActive ? `0 0 30px 10px ${COLORS[color].dot}66` : "none" }}
                      transition={{ duration: 0.5 }}
                      style={{ backgroundColor: `${COLORS[color].dot}33`, border: `3px solid ${COLORS[color].dot}66` }}
                    >
                      <div className="rounded-2xl p-3 grid grid-cols-2 gap-3 items-center justify-items-center"
                        style={{ backgroundColor: `${COLORS[color].dot}22`, width: 4*CELL-16, height: 4*CELL-16 }}>
                        {[0,1,2,3].map(i => (
                          <motion.div key={i}
                            animate={{ scale: player.tokens[i]===-1 && isActive ? [1, 1.14, 1] : 1 }}
                            transition={{ repeat: Infinity, duration: 1.4, delay: i*0.22 }}
                            className="rounded-full border-4 border-white shadow-lg"
                            style={{
                              width: 34, height: 34,
                              backgroundColor: player.tokens[i]===-1 ? COLORS[color].dot : `${COLORS[color].dot}44`,
                              transition: "background-color 0.3s",
                            }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  </div>
                );
              })}

            {/* Center triangles */}
            <div className="absolute" style={{ left: 6*CELL, top: 6*CELL, width: 3*CELL, height: 3*CELL }}>
              <svg width={3*CELL} height={3*CELL} viewBox="0 0 120 120">
                <polygon points="60,60 0,0 120,0"    fill={`${COLORS.green.dot}88`} />
                <polygon points="60,60 120,0 120,120" fill={`${COLORS.red.dot}88`} />
                <polygon points="60,60 120,120 0,120" fill={`${COLORS.yellow.dot}88`} />
                <polygon points="60,60 0,120 0,0"    fill={`${COLORS.blue.dot}88`} />
              </svg>
            </div>
          </div>

          {/* BOTTOM ROW */}
          <div className="flex justify-between items-center px-1 mt-2" style={{ height: 56 }}>
            <PlayerCorner color="yellow" />
            <PlayerCorner color="red" flip />
          </div>

          {/* ── FLOATING DICE — spring-animates to current player's corner ── */}
          <motion.button
            animate={{ x: diceTarget.x, y: diceTarget.y }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            onClick={canRoll ? handleRoll : undefined}
            whileHover={canRoll ? { scale: 1.12 } : {}}
            whileTap={canRoll ? { scale: 0.88 } : {}}
            className="absolute top-0 left-0 flex items-center justify-center rounded-2xl bg-white shadow-2xl"
            style={{
              width: DICE_SIZE, height: DICE_SIZE,
              border: `3px solid ${cur ? COLORS[cur.color].dot : "#e5e7eb"}`,
              cursor: canRoll ? "pointer" : "default",
              zIndex: 30,
              boxShadow: cur
                ? `0 6px 24px ${COLORS[cur.color].dot}88, 0 2px 8px rgba(0,0,0,0.12)`
                : undefined,
            }}
          >
            <motion.span className="text-3xl leading-none flex items-center justify-center"
              animate={isRolling
                ? { rotate: [0,35,-35,35,-35,0], scale: [1,1.4,0.7,1.4,0.7,1] }
                : {}}
              transition={{ duration: 0.4, repeat: isRolling ? Infinity : 0 }}
            >
              {dice !== null ? getDiceFace(dice) : <Dices className="w-7 h-7 text-gray-400" />}
            </motion.span>
          </motion.button>

        </div>{/* end wrapper */}

        {/* Message */}
        <AnimatePresence>
          {msg && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-2 px-5 py-2 rounded-full bg-white/80 backdrop-blur text-gray-700 font-semibold text-sm shadow-md">
              {msg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom controls */}
        <div className="flex items-center justify-between mt-2 px-1" style={{ width: BOARD_PX }}>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setPhase("setup")}
            className="w-11 h-11 rounded-full bg-white/70 backdrop-blur shadow flex items-center justify-center hover:bg-white transition-all">
            <X className="w-5 h-5 text-gray-600" />
          </motion.button>
          <motion.div
            animate={{ backgroundColor: cur ? `${COLORS[cur.color].dot}33` : "rgba(255,255,255,0.7)" }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 backdrop-blur shadow-md">
            <motion.div
              animate={cur ? { scale: [1,1.4,1] } : {}}
              transition={{ repeat: Infinity, duration: 0.85 }}
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: cur ? COLORS[cur.color].dot : "#9ca3af" }}
            />
            <span className="font-bold text-gray-700 text-sm">{cur?.name ?? ""} এর পালা</span>
          </motion.div>
          <div className="w-11" />
        </div>

      </div>{/* end scaled */}

      {/* "Your Turn!" Banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", bounce: 0.4 }}
            className="fixed bottom-16 right-0 px-8 py-5 rounded-l-3xl text-white font-black text-2xl shadow-2xl z-50"
            style={{ backgroundColor: cur ? COLORS[cur.color].dot : "#38bdf8", rotate: "-5deg" }}
          >
            তোমার পালা! 🎲
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
