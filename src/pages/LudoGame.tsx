import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Settings, RotateCcw, Trophy } from "lucide-react";

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

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
// Color layout (reference): Red=top-left, Green=top-right, Blue=bot-left, Yellow=bot-right
const COLORS: Record<PlayerColor, {
  vivid: string; dark: string; light: string; bg: string; label: string;
}> = {
  red:    { vivid: "#e53935", dark: "#b71c1c", light: "#ffcdd2", bg: "#ffebee", label: "#fff" },
  green:  { vivid: "#43a047", dark: "#1b5e20", light: "#c8e6c9", bg: "#e8f5e9", label: "#fff" },
  blue:   { vivid: "#1e88e5", dark: "#0d47a1", light: "#bbdefb", bg: "#e3f2fd", label: "#fff" },
  yellow: { vivid: "#fdd835", dark: "#f57f17", light: "#fff9c4", bg: "#fffde7", label: "#333" },
};

const NAMES: Record<PlayerColor, string> = {
  red: "লাল", green: "সবুজ", blue: "নীল", yellow: "হলুদ",
};

// Home zones: [rowStart, colStart] — each is 6×6
const HOME_ZONES: Record<PlayerColor, [number, number]> = {
  red:    [0, 0],
  green:  [0, 9],
  blue:   [9, 0],
  yellow: [9, 9],
};

// 52-cell main path
const LUDO_PATH: [number, number][] = [
  // Red exit (col 1, rows 6→8)
  [6,1],[7,1],[8,1],[8,2],[8,3],[8,4],[8,5],
  // Blue area going right/up
  [9,6],[10,6],[11,6],[12,6],[13,6],[13,7],[13,8],
  [12,8],[11,8],[10,8],[9,8],[8,9],[8,10],[8,11],[8,12],[8,13],
  // Green area going up
  [7,13],[6,13],[6,12],[6,11],[6,10],[6,9],
  // Yellow area going up/left
  [5,8],[4,8],[3,8],[2,8],[1,8],[1,7],[1,6],
  [2,6],[3,6],[4,6],[5,6],
  // Red area going down
  [6,5],[6,4],[6,3],[6,2],
  [5,1],[4,1],[3,1],[2,1],[1,1],[1,2],[1,3],[1,4],
];

const HOME_LANES: Record<PlayerColor, [number, number][]> = {
  red:    [[7,2],[7,3],[7,4],[7,5],[7,6]],
  green:  [[2,7],[3,7],[4,7],[5,7],[6,7]],
  blue:   [[12,7],[11,7],[10,7],[9,7],[8,7]],
  yellow: [[7,12],[7,11],[7,10],[7,9],[7,8]],
};

const START_POS: Record<PlayerColor, number> = {
  red: 0, blue: 13, yellow: 26, green: 39,
};

// Wait — let me recalculate. Standard Ludo:
// Red starts at index 0 on path
// Green starts at index 13
// Yellow starts at index 26
// Blue starts at index 39
const START_POS2: Record<PlayerColor, number> = {
  red: 0, green: 13, yellow: 26, blue: 39,
};

const SAFE_SQUARES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getPhysPos(pos: number, color: PlayerColor): [number, number] | null {
  if (pos < 0 || pos === 57) return null;
  if (pos < 52) return LUDO_PATH[pos];
  return HOME_LANES[color][pos - 52] ?? null;
}

function getNewPos(current: number, steps: number, color: PlayerColor): number | null {
  const sp = START_POS2[color];
  if (current === 57) return null;
  if (current === -1) return steps === 6 ? sp : null;
  if (current >= 52) {
    const next = current + steps;
    if (next <= 56) return next;
    if (next === 57) return 57;
    return null;
  }
  const dist = (current - sp + 52) % 52;
  const toEntry = 50 - dist;
  if (steps <= toEntry) return (current + steps) % 52;
  const lane = steps - toEntry - 1;
  if (lane < 5) return 52 + lane;
  if (lane === 5) return 57;
  return null;
}

function rollDice() { return Math.floor(Math.random() * 6) + 1; }

// Octagon SVG token
function OctaToken({ color, size = 28, glow = false, star = true }: {
  color: PlayerColor; size?: number; glow?: boolean; star?: boolean;
}) {
  const c = COLORS[color];
  const s = size;
  const cut = s * 0.29; // octagon cut
  const pts = [
    [cut, 0], [s - cut, 0],
    [s, cut], [s, s - cut],
    [s - cut, s], [cut, s],
    [0, s - cut], [0, cut],
  ].map(([x, y]) => `${x},${y}`).join(" ");

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ filter: glow ? `drop-shadow(0 0 6px ${c.vivid}) drop-shadow(0 0 12px ${c.vivid})` : "drop-shadow(0 2px 3px rgba(0,0,0,0.5))", flexShrink: 0 }}>
      <polygon points={pts} fill={c.vivid} stroke={c.dark} strokeWidth="2" />
      {star && <text x={s/2} y={s/2 + 5} textAnchor="middle" fontSize={s * 0.44} fill="#ffd700" fontFamily="serif">★</text>}
    </svg>
  );
}

// Dice dots layout
function DiceFace({ n, size = 52 }: { n: number; size?: number }) {
  const dotPos: Record<number, [number, number][]> = {
    1: [[50, 50]],
    2: [[25, 25], [75, 75]],
    3: [[25, 25], [50, 50], [75, 75]],
    4: [[25, 25], [75, 25], [25, 75], [75, 75]],
    5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
    6: [[25, 20], [75, 20], [25, 50], [75, 50], [25, 80], [75, 80]],
  };
  const dots = dotPos[n] ?? [];
  const r = size * 0.09;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      {dots.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={r * 1.1} fill="#1a1a2e" />
      ))}
    </svg>
  );
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function LudoGame() {
  const navigate = useNavigate();
  const CELL = 40;
  const GRID = 15;
  const BOARD_PX = CELL * GRID; // 600
  const DICE_SIZE = 60;

  // Setup state
  const [phase, setPhase] = useState<GamePhase>("setup");
  const [numPlayers, setNumPlayers] = useState<2 | 4>(4);
  const [playerTypes, setPlayerTypes] = useState<Record<PlayerColor, PlayerType>>({
    red: "human", green: "ai", blue: "ai", yellow: "ai",
  });

  // Game state
  const [players, setPlayers] = useState<Player[]>([]);
  const [curIdx, setCurIdx] = useState(0);
  const [dice, setDice] = useState<number | null>(null);
  const [diceRolled, setDiceRolled] = useState(false);
  const [movable, setMovable] = useState<number[]>([]);
  const [winner, setWinner] = useState<PlayerColor | null>(null);
  const [isRolling, setIsRolling] = useState(false);
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
      const needed = BOARD_PX + 64 + 8 + 8 + 64 + 44;
      const scale = Math.min(vh / needed, vw / (BOARD_PX + 20), 1);
      document.documentElement.style.setProperty("--ludo-scale", String(scale));
    }
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [BOARD_PX]);

  // Helpers
  const nextTurn = useCallback((ni: number, pls: Player[]) => {
    setCurIdx(ni);
    setDice(null);
    setDiceRolled(false);
    setMovable([]);
  }, []);

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
      setMsg(`${player.name} আবার চাল দেবে! 🎲`);
    } else {
      nextTurn((useIdx + 1) % newPlayers.length, newPlayers);
      setMsg("");
    }
  }, [nextTurn]);

  const handleRoll = useCallback(() => {
    if (diceRolled || isRolling) return;
    setIsRolling(true); setMsg("");
    let c = 0;
    const itv = setInterval(() => {
      setDice(rollDice()); c++;
      if (c >= 10) {
        clearInterval(itv);
        const final = rollDice();
        setDice(final); setIsRolling(false); setDiceRolled(true);
        const fp = playersRef.current[curIdxRef.current];
        const mv = fp.tokens.reduce<number[]>((acc, pos, i) => {
          if (getNewPos(pos, final, fp.color) !== null) acc.push(i);
          return acc;
        }, []);
        setMovable(mv);
        if (mv.length === 0) {
          setMsg("কোনো চাল নেই! পরের প্লেয়ার...");
          setTimeout(() => {
            const pls = playersRef.current;
            nextTurn((curIdxRef.current + 1) % pls.length, pls);
            setMsg("");
          }, 1200);
        } else if (mv.length === 1) {
          setTimeout(() => doMove(mv[0], final), 500);
        }
      }
    }, 70);
  }, [diceRolled, isRolling, nextTurn, doMove]);

  // AI
  useEffect(() => {
    if (phase !== "playing" || !cur || cur.type !== "ai" || diceRolled) return;
    aiTimer.current = setTimeout(handleRoll, 800);
    return () => { if (aiTimer.current) clearTimeout(aiTimer.current); };
  }, [curIdx, phase, cur?.type, diceRolled, handleRoll]);

  useEffect(() => {
    if (phase !== "playing" || !cur || cur.type !== "ai") return;
    if (!diceRolled || movable.length <= 1) return;
    const d = dice; if (!d) return;
    aiTimer.current = setTimeout(() => {
      doMove(movable[Math.floor(Math.random() * movable.length)], d);
    }, 600);
    return () => { if (aiTimer.current) clearTimeout(aiTimer.current); };
  }, [diceRolled, movable.length, cur?.type, phase, dice, doMove]);

  function startGame() {
    const colors: PlayerColor[] = numPlayers === 4
      ? ["red", "green", "blue", "yellow"] : ["red", "yellow"];
    const pls: Player[] = colors.map((c, i) => ({
      color: c, type: playerTypes[c], name: NAMES[c],
      tokens: [-1, -1, -1, -1],
    }));
    setPlayers(pls); setCurIdx(0); setDice(null);
    setDiceRolled(false); setMovable([]); setWinner(null);
    setPhase("playing"); setMsg("");
  }

  // Cell background
  function cellBg(row: number, col: number): string {
    // Home quadrants
    if (row <= 5 && col <= 5) return COLORS.red.vivid;
    if (row <= 5 && col >= 9) return COLORS.green.vivid;
    if (row >= 9 && col <= 5) return COLORS.blue.vivid;
    if (row >= 9 && col >= 9) return COLORS.yellow.vivid;
    // Home lane colors
    if (row === 7 && col >= 1 && col <= 5) return COLORS.red.vivid;
    if (col === 7 && row >= 1 && row <= 5) return COLORS.green.vivid;
    if (row === 7 && col >= 9 && col <= 13) return COLORS.yellow.vivid;
    if (col === 7 && row >= 9 && row <= 13) return COLORS.blue.vivid;
    return "#ffffff";
  }

  // Token map
  const tokenMap: Record<string, Array<{ color: PlayerColor; ti: number }>> = {};
  players.forEach(p => {
    p.tokens.forEach((pos, ti) => {
      const ph = getPhysPos(pos, p.color);
      if (!ph) return;
      (tokenMap[`${ph[0]},${ph[1]}`] ??= []).push({ color: p.color, ti });
    });
  });

  // Dice positions (floating, relative to wrapper)
  const TOP_Y = (64 - DICE_SIZE) / 2;
  const BOT_Y = 64 + 8 + BOARD_PX + 8 + (64 - DICE_SIZE) / 2;
  const dicePosMap: Record<PlayerColor, { x: number; y: number }> = {
    red:    { x: BOARD_PX / 2 - DICE_SIZE / 2, y: TOP_Y },     // top-left area but centered-ish above red
    green:  { x: BOARD_PX - DICE_SIZE - 4, y: TOP_Y },
    blue:   { x: 4, y: BOT_Y },
    yellow: { x: BOARD_PX - DICE_SIZE - 4, y: BOT_Y },
  };
  // Recalculate: red=top-left, green=top-right, blue=bot-left, yellow=bot-right
  const dicePosMapFixed: Record<PlayerColor, { x: number; y: number }> = {
    red:    { x: 4, y: TOP_Y },
    green:  { x: BOARD_PX - DICE_SIZE - 4, y: TOP_Y },
    blue:   { x: 4, y: BOT_Y },
    yellow: { x: BOARD_PX - DICE_SIZE - 4, y: BOT_Y },
  };
  const diceTarget = cur ? dicePosMapFixed[cur.color] : { x: BOARD_PX / 2 - DICE_SIZE / 2, y: TOP_Y };
  const canRoll = cur?.type === "human" && !diceRolled && !isRolling;

  // ─── SETUP SCREEN ──────────────────────────────────────────────────────────
  if (phase === "setup") {
    const allColors: PlayerColor[] = ["red", "green", "blue", "yellow"];
    const activeColors: PlayerColor[] = numPlayers === 4
      ? allColors : ["red", "yellow"];

    return (
      <div className="min-h-screen flex items-center justify-center select-none"
        style={{
          background: "radial-gradient(ellipse at center, #1a2a4a 0%, #0a1628 100%)",
          backgroundImage: `radial-gradient(ellipse at center, #1a2a4a 0%, #0a1628 100%), repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.03) 39px, rgba(255,255,255,0.03) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.03) 39px, rgba(255,255,255,0.03) 40px)`,
        }}>
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm mx-4 rounded-3xl overflow-hidden shadow-2xl"
          style={{ border: "2px solid rgba(255,255,255,0.12)", backgroundColor: "rgba(10,22,40,0.9)" }}>

          {/* Header */}
          <div className="px-6 pt-6 pb-4 flex items-center justify-between">
            <button onClick={() => navigate("/game")}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-2xl font-black text-white tracking-wide" style={{ fontFamily: "Georgia, serif", textShadow: "0 0 20px rgba(100,180,255,0.8)" }}>
              🎲 লুডু
            </h1>
            <div className="w-10" />
          </div>

          {/* Player count */}
          <div className="px-6 pb-4">
            <div className="rounded-2xl p-4 mb-4" style={{ border: "2px solid rgba(253,216,53,0.5)", backgroundColor: "rgba(253,216,53,0.05)" }}>
              <p className="text-center text-sm font-bold mb-3" style={{ color: "#fdd835", fontFamily: "Georgia, serif" }}>
                Player সংখ্যা বাছাই করো
              </p>
              <div className="grid grid-cols-2 gap-2">
                {([2, 4] as const).map(n => (
                  <motion.button key={n}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setNumPlayers(n)}
                    className="py-2.5 rounded-xl font-black text-sm transition-all"
                    style={{
                      backgroundColor: numPlayers === n ? "#4caf50" : "rgba(255,255,255,0.08)",
                      color: numPlayers === n ? "#fff" : "rgba(255,255,255,0.6)",
                      border: numPlayers === n ? "2px solid #81c784" : "2px solid transparent",
                      boxShadow: numPlayers === n ? "0 0 12px rgba(76,175,80,0.5)" : "none",
                    }}>
                    {n} Players
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Player type selection */}
            <div className="rounded-2xl p-4" style={{ border: "2px solid rgba(229,57,53,0.5)", backgroundColor: "rgba(229,57,53,0.05)" }}>
              <p className="text-center text-sm font-bold mb-3" style={{ color: "#ef9a9a", fontFamily: "Georgia, serif" }}>
                Human / AI বাছাই করো
              </p>
              <div className="space-y-2">
                {activeColors.map((color, i) => (
                  <div key={color} className="flex items-center gap-3 p-2 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                    <OctaToken color={color} size={32} />
                    <span className="text-sm font-bold text-white flex-1">Player {i + 1} ({NAMES[color]})</span>
                    <div className="flex rounded-lg overflow-hidden border border-white/10">
                      {(["human", "ai"] as const).map(t => (
                        <button key={t}
                          onClick={() => setPlayerTypes(p => ({ ...p, [color]: t }))}
                          className="px-3 py-1.5 text-xs font-black transition-all"
                          style={{
                            backgroundColor: playerTypes[color] === t ? COLORS[color].vivid : "transparent",
                            color: playerTypes[color] === t ? "#fff" : "rgba(255,255,255,0.4)",
                          }}>
                          {t === "human" ? "👤" : "🤖"}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Play button */}
          <div className="px-6 pb-6">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={startGame}
              className="w-full py-4 rounded-2xl font-black text-xl text-white shadow-lg"
              style={{
                background: "linear-gradient(135deg, #4caf50, #2e7d32)",
                boxShadow: "0 4px 20px rgba(76,175,80,0.5), 0 0 0 3px rgba(76,175,80,0.3)",
                fontFamily: "Georgia, serif",
                letterSpacing: "0.05em",
              }}>
              Play ▶
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── WIN SCREEN ───────────────────────────────────────────────────────────
  if (phase === "finished" && winner) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center"
        style={{ background: "radial-gradient(ellipse at center, #1a2a4a 0%, #0a1628 100%)" }}>
        <motion.div initial={{ scale: 0.5, rotate: -5 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="bg-white rounded-3xl shadow-2xl p-10 text-center max-w-sm mx-4">
          <motion.div animate={{ rotate: [0,-15,15,-15,0], scale: [1,1.3,1] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
            className="text-7xl mb-4">🏆</motion.div>
          <div className="flex justify-center mb-3"><OctaToken color={winner} size={52} glow /></div>
          <h2 className="text-3xl font-black mb-1" style={{ color: COLORS[winner].vivid }}>
            {NAMES[winner]} জিতেছে!
          </h2>
          <p className="text-gray-400 mb-8 text-sm">অভিনন্দন 🎉</p>
          <div className="flex gap-3">
            <button onClick={() => setPhase("setup")}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50">
              <RotateCcw className="w-4 h-4" />আবার
            </button>
            <button onClick={() => navigate("/game")}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-white font-bold"
              style={{ backgroundColor: COLORS[winner].vivid }}>
              <Trophy className="w-4 h-4" />হাব
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // ─── GAME BOARD ───────────────────────────────────────────────────────────
  // Player corner indicator component
  function CornerLabel({ color, side }: { color: PlayerColor; side: "left" | "right" }) {
    const p = players.find(pl => pl.color === color);
    if (!p) return <div style={{ width: 90 }} />;
    const isActive = cur?.color === color;
    return (
      <motion.div
        animate={{ scale: isActive ? 1.08 : 1, opacity: isActive ? 1 : 0.55 }}
        transition={{ type: "spring", stiffness: 300 }}
        className={`flex items-center gap-2 ${side === "right" ? "flex-row-reverse" : ""}`}
        style={{ minWidth: 90 }}
      >
        <OctaToken color={color} size={36} glow={isActive} />
        <div className={side === "right" ? "text-right" : "text-left"}>
          <div className="text-xs font-black text-white leading-none">{p.name}</div>
          <div className="text-xs font-bold" style={{ color: isActive ? "#4caf50" : "rgba(255,255,255,0.4)" }}>
            {p.type === "human" ? "👤" : "🤖"}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center overflow-hidden select-none"
      style={{
        paddingTop: 64,
        background: "radial-gradient(ellipse at center, #1a2a4a 0%, #0a1628 100%)",
        backgroundImage: `radial-gradient(ellipse at center, #1a2a4a 0%, #0a1628 100%), repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.025) 39px, rgba(255,255,255,0.025) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.025) 39px, rgba(255,255,255,0.025) 40px)`,
      }}>
      <div className="flex flex-col items-center"
        style={{ transform: `scale(var(--ludo-scale, 1))`, transformOrigin: "center center" }}>

        {/* ── Main wrapper ── */}
        <div className="relative" style={{ width: BOARD_PX }}>

          {/* TOP ROW */}
          <div className="flex justify-between items-center px-1 mb-2" style={{ height: 64 }}>
            <CornerLabel color="red" side="left" />

            {/* Turn indicator text */}
            <motion.div
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-xs font-black text-center px-3 py-1 rounded-full"
              style={{ backgroundColor: "rgba(76,175,80,0.2)", color: "#4caf50", border: "1px solid rgba(76,175,80,0.4)" }}
            >
              {cur?.name} এর পালা
            </motion.div>

            <CornerLabel color="green" side="right" />
          </div>

          {/* ── BOARD ── */}
          <div className="relative rounded-xl overflow-hidden"
            style={{
              width: BOARD_PX, height: BOARD_PX,
              border: "5px solid #c8a400",
              outline: "2px solid rgba(255,255,255,0.15)",
              boxShadow: "0 0 40px rgba(0,0,0,0.8), inset 0 0 0 2px rgba(255,255,255,0.1)",
            }}>

            {/* Grid cells */}
            {Array.from({ length: GRID }, (_, row) => (
              <div key={row} className="flex" style={{ height: CELL }}>
                {Array.from({ length: GRID }, (_, col) => {
                  const k = `${row},${col}`;
                  const here = tokenMap[k] ?? [];
                  const pathIdx = LUDO_PATH.findIndex(([r, c]) => r === row && c === col);
                  const isSafe = pathIdx >= 0 && SAFE_SQUARES.has(pathIdx);
                  const bg = cellBg(row, col);
                  const isWhite = bg === "#ffffff";

                  return (
                    <div key={col} className="relative flex items-center justify-center flex-shrink-0"
                      style={{
                        width: CELL, height: CELL, backgroundColor: bg,
                        border: isWhite ? "1px solid #ddd" : "1px solid rgba(255,255,255,0.15)",
                      }}>
                      {/* Safe square star */}
                      {isSafe && here.length === 0 && (
                        <span style={{ color: "#999", fontSize: 14, opacity: 0.7, lineHeight: 1 }}>☆</span>
                      )}
                      {/* Tokens */}
                      {here.length > 0 && (
                        <div className="flex flex-wrap gap-[2px] items-center justify-center z-10 w-full h-full p-0.5">
                          {here.slice(0, 4).map(({ color, ti }) => {
                            const isMovable = cur?.color === color && diceRolled && movable.includes(ti);
                            const sz = here.length > 2 ? 13 : 18;
                            return (
                              <motion.div
                                key={`${color}-${ti}`}
                                layout
                                initial={{ scale: 0.2, opacity: 0 }}
                                animate={isMovable
                                  ? { scale: [1, 1.5, 1, 1.5, 1], y: [0, -6, 0, -6, 0] }
                                  : { scale: 1, y: 0, opacity: 1 }
                                }
                                transition={isMovable
                                  ? { duration: 0.9, repeat: Infinity, ease: "easeInOut" }
                                  : { type: "spring", stiffness: 400, damping: 20, opacity: { duration: 0.15 } }
                                }
                                onClick={() => { if (isMovable && dice) doMove(ti, dice); }}
                                style={{ cursor: isMovable ? "pointer" : "default", zIndex: isMovable ? 20 : 10, flexShrink: 0 }}
                              >
                                <OctaToken color={color} size={sz} glow={isMovable} star={sz >= 18} />
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Home zone overlays — white inner boxes with player labels */}
            {(["red", "green", "blue", "yellow"] as PlayerColor[])
              .filter(c => players.some(p => p.color === c))
              .map(color => {
                const [rS, cS] = HOME_ZONES[color];
                const player = players.find(p => p.color === color)!;
                const isActive = cur?.color === color;
                // Player label position (bottom-left for top-left zones, top-right for others)
                const labelAtBottom = rS === 0 && cS === 0; // red
                const labelFlip = cS >= 9; // right side

                return (
                  <div key={color} className="absolute"
                    style={{ left: cS * CELL, top: rS * CELL, width: 6 * CELL, height: 6 * CELL, pointerEvents: "none" }}>
                    {/* White inner box */}
                    <motion.div
                      className="absolute flex items-center justify-center"
                      animate={{ boxShadow: isActive ? `0 0 0 3px #4caf50, 0 0 20px rgba(76,175,80,0.4)` : "none" }}
                      style={{
                        left: CELL * 0.6, top: CELL * 0.6,
                        width: CELL * 4.8, height: CELL * 4.8,
                        backgroundColor: "rgba(255,255,255,0.92)",
                        borderRadius: 12,
                      }}>
                      {/* 2×2 token grid */}
                      <div className="grid grid-cols-2 gap-3">
                        {[0, 1, 2, 3].map(i => (
                          <motion.div key={i}
                            animate={player.tokens[i] === -1 && isActive
                              ? { scale: [1, 1.12, 1], rotate: [0, 5, -5, 0] }
                              : { scale: 1, rotate: 0 }}
                            transition={{ repeat: Infinity, duration: 1.6, delay: i * 0.3 }}
                          >
                            <OctaToken
                              color={color}
                              size={38}
                              glow={player.tokens[i] === -1 && isActive}
                              star
                            />
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Player label */}
                    <div className="absolute font-black text-white text-xs"
                      style={{
                        [rS >= 9 ? "bottom" : "top"]: 4,
                        [cS >= 9 ? "right" : "left"]: 6,
                        textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                        opacity: 0.9,
                      }}>
                      {`Player ${players.findIndex(p => p.color === color) + 1}`}
                    </div>
                  </div>
                );
              })}

            {/* Center triangles */}
            <div className="absolute" style={{ left: 6 * CELL, top: 6 * CELL, width: 3 * CELL, height: 3 * CELL }}>
              <svg width={3 * CELL} height={3 * CELL} viewBox="0 0 120 120">
                <polygon points="60,60 0,0 120,0"    fill={COLORS.green.vivid} />
                <polygon points="60,60 120,0 120,120" fill={COLORS.yellow.vivid} />
                <polygon points="60,60 120,120 0,120" fill={COLORS.blue.vivid} />
                <polygon points="60,60 0,120 0,0"    fill={COLORS.red.vivid} />
              </svg>
            </div>
          </div>

          {/* BOTTOM ROW */}
          <div className="flex justify-between items-center px-1 mt-2" style={{ height: 64 }}>
            <CornerLabel color="blue" side="left" />

            {/* Message */}
            <AnimatePresence>
              {msg ? (
                <motion.div key="msg"
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="text-xs font-black text-center px-3 py-1 rounded-full"
                  style={{ backgroundColor: "rgba(253,216,53,0.15)", color: "#fdd835", border: "1px solid rgba(253,216,53,0.4)", maxWidth: 160 }}>
                  {msg}
                </motion.div>
              ) : (
                <div key="spacer" style={{ width: 120 }} />
              )}
            </AnimatePresence>

            <CornerLabel color="yellow" side="right" />
          </div>

          {/* ── FLOATING DICE with GREEN ARROW ── */}
          {(() => {
            const arrowOffset = 68; // px to the right/left of dice
            return (
              <motion.div
                className="absolute top-0 left-0 flex items-center gap-2"
                animate={{ x: diceTarget.x - (canRoll ? 36 : 0), y: diceTarget.y }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                style={{ zIndex: 30 }}
              >
                {/* Green arrow (only for human turn) */}
                <AnimatePresence>
                  {canRoll && (
                    <motion.div
                      key="arrow"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: [0, 8, 0], scale: [1, 1.1, 1] }}
                      exit={{ opacity: 0 }}
                      transition={{ x: { repeat: Infinity, duration: 0.7 }, scale: { repeat: Infinity, duration: 0.7 } }}
                      className="text-3xl font-black leading-none"
                      style={{ color: "#4caf50", textShadow: "0 0 12px rgba(76,175,80,0.8)", lineHeight: 1 }}
                    >
                      ▶
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Dice */}
                <motion.button
                  onClick={canRoll ? handleRoll : undefined}
                  whileHover={canRoll ? { scale: 1.1 } : {}}
                  whileTap={canRoll ? { scale: 0.88 } : {}}
                  className="flex items-center justify-center rounded-2xl bg-white shadow-2xl"
                  style={{
                    width: DICE_SIZE, height: DICE_SIZE,
                    cursor: canRoll ? "pointer" : "default",
                    border: canRoll
                      ? "3px solid #4caf50"
                      : "3px solid rgba(255,255,255,0.4)",
                    boxShadow: canRoll
                      ? "0 0 20px rgba(76,175,80,0.7), 0 0 40px rgba(76,175,80,0.4)"
                      : "0 4px 16px rgba(0,0,0,0.5)",
                  }}
                >
                  <motion.div
                    animate={isRolling
                      ? { rotate: [0, 90, 180, 270, 360], scale: [1, 0.7, 1.2, 0.8, 1] }
                      : {}}
                    transition={{ duration: 0.35, repeat: isRolling ? Infinity : 0 }}
                    className="w-full h-full flex items-center justify-center"
                  >
                    {dice !== null ? <DiceFace n={dice} size={DICE_SIZE - 4} /> : (
                      <span style={{ fontSize: 28, lineHeight: 1 }}>🎲</span>
                    )}
                  </motion.div>
                </motion.button>
              </motion.div>
            );
          })()}

          {/* Settings / back button */}
          <div className="absolute" style={{ top: -52, left: 0, display: "flex", gap: 8 }}>
            <button onClick={() => navigate("/game")}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "white" }}>
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPhase("setup")}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "white" }}>
              <Settings className="w-4 h-4" />
            </button>
          </div>

        </div>{/* end wrapper */}
      </div>{/* end scaled */}
    </div>
  );
}
