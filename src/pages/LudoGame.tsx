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

// ─── COLORS ──────────────────────────────────────────────────────────────────
// Layout: Red=top-left, Green=top-right, Blue=bottom-left, Yellow=bottom-right
const COLORS: Record<PlayerColor, { vivid: string; dark: string; light: string }> = {
  red:    { vivid: "#e53935", dark: "#b71c1c", light: "#ffcdd2" },
  green:  { vivid: "#43a047", dark: "#1b5e20", light: "#c8e6c9" },
  blue:   { vivid: "#1565c0", dark: "#0d47a1", light: "#bbdefb" },
  yellow: { vivid: "#f9a825", dark: "#e65100", light: "#fff9c4" },
};

const NAMES: Record<PlayerColor, string> = {
  red: "লাল", green: "সবুজ", blue: "নীল", yellow: "হলুদ",
};

const HOME_ZONES: Record<PlayerColor, [number, number]> = {
  red: [0, 0], green: [0, 9], blue: [9, 0], yellow: [9, 9],
};

// ─── STANDARD LUDO PATH (52 squares, clockwise) ───────────────────────────────
// Red=TL(0), Blue=BL(13), Yellow=BR(26), Green=TR(39)
// Clockwise: Red down→right→Blue down→right-up→Yellow up→left→Green left→down→Red
const CORRECT_PATH: [number, number][] = [
  // ── Red zone: exits going DOWN left side ──
  [6,1],  // 0  Red START ★ SAFE
  [7,1],  // 1
  [8,1],  // 2
  // ── Turn RIGHT across row 8 ──
  [8,2],  // 3
  [8,3],  // 4
  [8,4],  // 5
  [8,5],  // 6  ★ SAFE (8th from Red start = index 8... wait let me recalculate)
  // ── DOWN col 6, entering Blue territory ──
  [9,6],  // 7
  [10,6], // 8  ★ SAFE (8 from Red start)
  [11,6], // 9
  [12,6], // 10
  [13,6], // 11
  // ── RIGHT on row 13 ──
  [13,7], // 12
  [13,8], // 13 Blue START ★ SAFE
  // ── UP col 8 ──
  [12,8], // 14
  [11,8], // 15
  [10,8], // 16
  [9,8],  // 17
  // ── RIGHT on row 8 ──
  [8,9],  // 18
  [8,10], // 19
  [8,11], // 20
  [8,12], // 21 ★ SAFE (8 from Blue start)
  [8,13], // 22
  // ── UP col 13 ──
  [7,13], // 23
  [6,13], // 24
  // ── LEFT on row 6 ──
  [6,12], // 25
  [6,11], // 26 Yellow START ★ SAFE
  [6,10], // 27
  [6,9],  // 28
  // ── UP col 8 ──
  [5,8],  // 29
  [4,8],  // 30
  [3,8],  // 31
  [2,8],  // 32
  [1,8],  // 33
  // ── LEFT on row 1 ──
  [1,7],  // 34 ★ SAFE (8 from Yellow start)
  [1,6],  // 35
  // ── DOWN col 6 ──
  [2,6],  // 36
  [3,6],  // 37
  [4,6],  // 38
  [5,6],  // 39 Green START ★ SAFE
  // ── LEFT on row 6 ──
  [6,5],  // 40
  [6,4],  // 41
  [6,3],  // 42
  [6,2],  // 43
  // ── UP col 1 ──
  [5,1],  // 44
  [4,1],  // 45
  [3,1],  // 46
  [2,1],  // 47 ★ SAFE (8 from Green start)
  [1,1],  // 48
  // ── RIGHT on row 1 ──
  [1,2],  // 49
  [1,3],  // 50
  [1,4],  // 51 → wraps back to 0
];

// Start positions on main path (verified with standard Ludo rules)
// Going clockwise: Red(0) → Blue(13) → Yellow(26) → Green(39)
const START_POS: Record<PlayerColor, number> = {
  red: 0, blue: 13, yellow: 26, green: 39,
};

// Safe squares: each start + 8 squares further
// Starts: 0, 13, 26, 39 → +8 each: 8, 21, 34, 47
const SAFE_SET = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

// Home lanes (5 squares → center)
const HOME_LANES: Record<PlayerColor, [number, number][]> = {
  red:    [[7,2],[7,3],[7,4],[7,5],[7,6]],   // RIGHT on row 7
  blue:   [[12,7],[11,7],[10,7],[9,7],[8,7]], // UP on col 7
  yellow: [[7,12],[7,11],[7,10],[7,9],[7,8]], // LEFT on row 7
  green:  [[2,7],[3,7],[4,7],[5,7],[6,7]],   // DOWN on col 7
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
  // Exit from home: only on 6
  if (cur === -1) return steps === 6 ? sp : null;
  // In home lane
  if (cur >= 52) {
    const next = cur + steps;
    if (next <= 56) return next;
    if (next === 57) return 57;
    return null; // exact count needed
  }
  // On main path: calculate distance from start
  const dist = (cur - sp + 52) % 52;
  const toEntry = 50 - dist; // steps until entering home lane
  if (steps <= toEntry) return (cur + steps) % 52;
  // Enter home lane
  const laneStep = steps - toEntry - 1;
  if (laneStep < 5) return 52 + laneStep;
  if (laneStep === 5) return 57; // exact finish
  return null; // overshoot
}

function rollDice() { return Math.floor(Math.random() * 6) + 1; }

// ─── OCTAGON TOKEN SVG ────────────────────────────────────────────────────────
function OctaToken({ color, size = 28, glow = false, star = true }: {
  color: PlayerColor; size?: number; glow?: boolean; star?: boolean;
}) {
  const c = COLORS[color];
  const cut = size * 0.27;
  const s = size;
  const pts = [
    [cut, 0], [s-cut, 0], [s, cut], [s, s-cut],
    [s-cut, s], [cut, s], [0, s-cut], [0, cut],
  ].map(([x,y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{
      flexShrink: 0,
      filter: glow
        ? `drop-shadow(0 0 5px ${c.vivid}) drop-shadow(0 0 10px ${c.vivid}88)`
        : "drop-shadow(0 2px 4px rgba(0,0,0,0.6))",
    }}>
      <polygon points={pts} fill={c.vivid} stroke={c.dark} strokeWidth="1.5"/>
      {/* inner highlight */}
      <polygon points={pts} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1"/>
      {star && (
        <text x={s/2} y={s*0.65} textAnchor="middle" fontSize={s*0.42}
          fill="#ffd700" fontFamily="serif" style={{userSelect:"none"}}>★</text>
      )}
    </svg>
  );
}

// ─── DICE FACE (dots) ─────────────────────────────────────────────────────────
function DiceFace({ n, sz = 52 }: { n: number; sz?: number }) {
  const layouts: Record<number, [number,number][]> = {
    1: [[50,50]],
    2: [[28,28],[72,72]],
    3: [[28,28],[50,50],[72,72]],
    4: [[28,28],[72,28],[28,72],[72,72]],
    5: [[28,28],[72,28],[50,50],[28,72],[72,72]],
    6: [[28,22],[72,22],[28,50],[72,50],[28,78],[72,78]],
  };
  const dots = layouts[n] ?? [];
  const r = sz * 0.09;
  return (
    <svg width={sz} height={sz} viewBox="0 0 100 100">
      <rect x="4" y="4" width="92" height="92" rx="14" fill="white"/>
      {dots.map(([x,y],i) => <circle key={i} cx={x} cy={y} r={r*1.1} fill="#1a1a2e"/>)}
    </svg>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function LudoGame() {
  const navigate = useNavigate();
  const CELL = 40;
  const GRID = 15;
  const BOARD_PX = CELL * GRID; // 600
  const DICE_SZ = 58;

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

  const aiTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const playersRef = useRef(players);
  const curIdxRef = useRef(curIdx);
  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { curIdxRef.current = curIdx; }, [curIdx]);
  const cur = players[curIdx];

  // Scale to fit viewport
  useEffect(() => {
    function calc() {
      const vh = window.innerHeight - 64;
      const vw = window.innerWidth;
      const totalH = 64 + 8 + BOARD_PX + 8 + 64 + 40;
      const scale = Math.min(vh / totalH, vw / BOARD_PX, 1);
      document.documentElement.style.setProperty("--ludo-scale", String(scale));
    }
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [BOARD_PX]);

  const nextTurn = useCallback((ni: number, pls: Player[]) => {
    setCurIdx(ni); setDice(null); setDiceRolled(false); setMovable([]);
  }, []);

  const doMove = useCallback((tokenIdx: number, d: number) => {
    const pls = playersRef.current;
    const idx = curIdxRef.current;
    const player = pls[idx];
    const newPos = getNewPos(player.tokens[tokenIdx], d, player.color);
    if (newPos === null) return;
    const newPlayers = pls.map((p, pi) => {
      if (pi === idx) {
        const t = [...p.tokens]; t[tokenIdx] = newPos; return {...p, tokens: t};
      }
      // Capture if landing on main path non-safe square
      if (newPos < 52 && !SAFE_SET.has(newPos)) {
        return {...p, tokens: p.tokens.map(tp => tp === newPos ? -1 : tp)};
      }
      return p;
    });
    setPlayers(newPlayers);
    playersRef.current = newPlayers;
    if (newPlayers[idx].tokens.every(t => t === 57)) {
      setWinner(newPlayers[idx].color); setPhase("finished"); return;
    }
    if (d === 6) {
      setDice(null); setDiceRolled(false); setMovable([]);
      setMsg(`${player.name} আবার চাল দেবে! 🎲`);
    } else {
      nextTurn((idx+1) % newPlayers.length, newPlayers); setMsg("");
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
          setMsg("কোনো চাল নেই!");
          setTimeout(() => {
            const pls2 = playersRef.current;
            nextTurn((curIdxRef.current+1) % pls2.length, pls2);
            setMsg("");
          }, 1200);
        } else if (mv.length === 1) {
          setTimeout(() => doMove(mv[0], final), 500);
        }
      }
    }, 70);
  }, [diceRolled, isRolling, nextTurn, doMove]);

  // AI turn
  useEffect(() => {
    if (phase !== "playing" || !cur || cur.type !== "ai" || diceRolled) return;
    aiTimer.current = setTimeout(handleRoll, 800);
    return () => { if (aiTimer.current) clearTimeout(aiTimer.current); };
  }, [curIdx, phase, cur?.type, diceRolled, handleRoll]);

  useEffect(() => {
    if (phase !== "playing" || !cur || cur.type !== "ai" || !diceRolled || movable.length <= 1) return;
    const d = dice; if (!d) return;
    aiTimer.current = setTimeout(() => {
      doMove(movable[Math.floor(Math.random() * movable.length)], d);
    }, 600);
    return () => { if (aiTimer.current) clearTimeout(aiTimer.current); };
  }, [diceRolled, movable.length, cur?.type, phase, dice, doMove]);

  function startGame() {
    const colors: PlayerColor[] = numPlayers === 4
      ? ["red","green","blue","yellow"] : ["red","yellow"];
    const pls: Player[] = colors.map(c => ({
      color: c, type: playerTypes[c], name: NAMES[c], tokens: [-1,-1,-1,-1],
    }));
    setPlayers(pls); setCurIdx(0); setDice(null);
    setDiceRolled(false); setMovable([]); setWinner(null);
    setPhase("playing"); setMsg("");
  }

  // Cell background color
  function cellBg(row: number, col: number): string {
    // 6×6 Home zones (vivid color)
    if (row <= 5 && col <= 5) return COLORS.red.vivid;
    if (row <= 5 && col >= 9) return COLORS.green.vivid;
    if (row >= 9 && col <= 5) return COLORS.blue.vivid;
    if (row >= 9 && col >= 9) return COLORS.yellow.vivid;
    // Home lane columns/rows (lighter shade of player color)
    if (row === 7 && col >= 1 && col <= 5) return COLORS.red.light;
    if (row === 7 && col >= 9 && col <= 13) return COLORS.yellow.light;
    if (col === 7 && row >= 1 && row <= 5) return COLORS.green.light;
    if (col === 7 && row >= 9 && row <= 13) return COLORS.blue.light;
    return "#f5f5f5";
  }

  // Build token map
  const tokenMap: Record<string, Array<{color: PlayerColor; ti: number}>> = {};
  players.forEach(p => {
    p.tokens.forEach((pos, ti) => {
      const ph = getPhysPos(pos, p.color);
      if (!ph) return;
      (tokenMap[`${ph[0]},${ph[1]}`] ??= []).push({color: p.color, ti});
    });
  });

  // Build safe square lookup by grid position
  const safeGrid = new Set<string>();
  SAFE_SET.forEach(idx => {
    const sq = CORRECT_PATH[idx];
    if (sq) safeGrid.add(`${sq[0]},${sq[1]}`);
  });
  // Also mark start squares separately for visual
  const startGrid = new Set<string>();
  (["red","green","blue","yellow"] as PlayerColor[]).forEach(c => {
    const sq = CORRECT_PATH[START_POS[c]];
    if (sq) startGrid.add(`${sq[0]},${sq[1]}`);
  });

  // Dice corner targets
  const ROW_H = 64;
  const TOP_Y = (ROW_H - DICE_SZ) / 2;
  const BOT_Y = ROW_H + 8 + BOARD_PX + 8 + (ROW_H - DICE_SZ) / 2;
  const dicePosMap: Record<PlayerColor,{x:number;y:number}> = {
    red:    {x: 4,                    y: TOP_Y},
    green:  {x: BOARD_PX-DICE_SZ-4,  y: TOP_Y},
    blue:   {x: 4,                    y: BOT_Y},
    yellow: {x: BOARD_PX-DICE_SZ-4,  y: BOT_Y},
  };
  const diceTarget = cur ? dicePosMap[cur.color] : {x: BOARD_PX/2-DICE_SZ/2, y: TOP_Y};
  const canRoll = cur?.type === "human" && !diceRolled && !isRolling;

  // Corner player indicator
  function CornerLabel({color, flip}: {color: PlayerColor; flip?: boolean}) {
    const p = players.find(pl => pl.color === color);
    if (!p) return <div style={{width:100}}/>;
    const isActive = cur?.color === color;
    return (
      <motion.div
        animate={{scale: isActive?1.1:1, opacity: isActive?1:0.5}}
        transition={{type:"spring",stiffness:300,damping:20}}
        className={`flex items-center gap-2 ${flip?"flex-row-reverse":""}`}
      >
        <OctaToken color={color} size={38} glow={isActive}/>
        <div className={flip?"text-right":""}>
          <div className="text-xs font-black text-white">{p.name}</div>
          <div className="text-xs" style={{color: isActive?"#4caf50":"rgba(255,255,255,0.4)"}}>
            {p.type==="human"?"👤":"🤖"}
          </div>
        </div>
      </motion.div>
    );
  }

  // ─── SETUP ───────────────────────────────────────────────────────────────
  if (phase === "setup") {
    const ac: PlayerColor[] = numPlayers === 4
      ? ["red","green","blue","yellow"] : ["red","yellow"];
    return (
      <div className="min-h-screen flex items-center justify-center select-none"
        style={{background:"radial-gradient(ellipse at 50% 40%, #1a2a4a 0%, #070e1c 100%)"}}>
        <motion.div initial={{opacity:0,y:40}} animate={{opacity:1,y:0}}
          className="w-full max-w-sm mx-4 rounded-3xl overflow-hidden shadow-2xl"
          style={{border:"1.5px solid rgba(255,255,255,0.1)", background:"rgba(8,16,36,0.95)"}}>
          {/* Header */}
          <div className="px-6 pt-6 pb-3 flex items-center justify-between">
            <button onClick={()=>navigate("/game")}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{background:"rgba(255,255,255,0.08)"}}>
              <ArrowLeft className="w-4 h-4 text-white"/>
            </button>
            <h1 className="text-2xl font-black text-white" style={{fontFamily:"Georgia,serif",textShadow:"0 0 20px rgba(100,180,255,0.7)"}}>
              🎲 লুডু ক্লাসিক
            </h1>
            <div className="w-10"/>
          </div>

          {/* Player count */}
          <div className="px-6 pb-3">
            <div className="rounded-2xl p-4 mb-3" style={{border:"1.5px solid rgba(253,216,53,0.4)",background:"rgba(253,216,53,0.05)"}}>
              <p className="text-center text-xs font-black mb-3" style={{color:"#fdd835",fontFamily:"Georgia,serif",letterSpacing:"0.05em"}}>
                Player সংখ্যা
              </p>
              <div className="grid grid-cols-2 gap-2">
                {([2,4] as const).map(n=>(
                  <motion.button key={n} whileTap={{scale:0.95}} onClick={()=>setNumPlayers(n)}
                    className="py-2.5 rounded-xl font-black text-sm"
                    style={{
                      background: numPlayers===n ? "linear-gradient(135deg,#4caf50,#2e7d32)" : "rgba(255,255,255,0.06)",
                      color: numPlayers===n ? "#fff" : "rgba(255,255,255,0.5)",
                      border: numPlayers===n ? "none" : "1px solid rgba(255,255,255,0.1)",
                      boxShadow: numPlayers===n ? "0 0 16px rgba(76,175,80,0.4)" : "none",
                    }}>
                    {n} Players
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Player types */}
            <div className="rounded-2xl p-4" style={{border:"1.5px solid rgba(229,57,53,0.35)",background:"rgba(229,57,53,0.04)"}}>
              <p className="text-center text-xs font-black mb-3" style={{color:"#ef9a9a",fontFamily:"Georgia,serif"}}>
                Human / AI বাছাই
              </p>
              <div className="space-y-2">
                {ac.map((color,i)=>(
                  <div key={color} className="flex items-center gap-3 p-2 rounded-xl" style={{background:"rgba(255,255,255,0.04)"}}>
                    <OctaToken color={color} size={30}/>
                    <span className="text-sm font-bold text-white flex-1">P{i+1} — {NAMES[color]}</span>
                    <div className="flex rounded-lg overflow-hidden" style={{border:"1px solid rgba(255,255,255,0.12)"}}>
                      {(["human","ai"] as const).map(t=>(
                        <button key={t} onClick={()=>setPlayerTypes(p=>({...p,[color]:t}))}
                          className="px-3 py-1.5 text-xs font-black transition-all"
                          style={{
                            background: playerTypes[color]===t ? COLORS[color].vivid : "transparent",
                            color: playerTypes[color]===t ? "#fff" : "rgba(255,255,255,0.35)",
                          }}>
                          {t==="human"?"👤":"🤖"}
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
            <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={startGame}
              className="w-full py-4 rounded-2xl font-black text-xl text-white"
              style={{
                background:"linear-gradient(135deg,#4caf50,#2e7d32)",
                boxShadow:"0 4px 24px rgba(76,175,80,0.45), 0 0 0 2px rgba(76,175,80,0.2)",
                fontFamily:"Georgia,serif",letterSpacing:"0.08em",
              }}>
              ▶ Play
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── WIN ─────────────────────────────────────────────────────────────────
  if (phase === "finished" && winner) {
    return (
      <motion.div initial={{opacity:0}} animate={{opacity:1}}
        className="min-h-screen flex items-center justify-center"
        style={{background:"radial-gradient(ellipse at center, #1a2a4a, #070e1c)"}}>
        <motion.div initial={{scale:0.4,rotate:-8}} animate={{scale:1,rotate:0}}
          transition={{type:"spring",bounce:0.55}}
          className="bg-white rounded-3xl shadow-2xl p-10 text-center max-w-sm mx-4">
          <motion.div animate={{rotate:[0,-12,12,-12,0],scale:[1,1.3,1]}}
            transition={{repeat:Infinity,duration:1.8}} className="text-7xl mb-4">🏆</motion.div>
          <div className="flex justify-center mb-3"><OctaToken color={winner} size={56} glow/></div>
          <h2 className="text-3xl font-black mb-1" style={{color:COLORS[winner].vivid}}>{NAMES[winner]} জিতেছে!</h2>
          <p className="text-gray-400 mb-8 text-sm">অভিনন্দন 🎉</p>
          <div className="flex gap-3">
            <button onClick={()=>setPhase("setup")}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50">
              <RotateCcw className="w-4 h-4"/>আবার
            </button>
            <button onClick={()=>navigate("/game")}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-white font-bold"
              style={{background:COLORS[winner].vivid}}>
              <Trophy className="w-4 h-4"/>হাব
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // ─── GAME BOARD ───────────────────────────────────────────────────────────
  const BG = "radial-gradient(ellipse at 50% 30%, #1a2a4a 0%, #070e1c 100%)";

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center overflow-hidden select-none"
      style={{paddingTop:64, background:BG}}>
      <div className="flex flex-col items-center"
        style={{transform:`scale(var(--ludo-scale,1))`,transformOrigin:"center center"}}>

        <div className="relative" style={{width:BOARD_PX}}>

          {/* TOP ROW */}
          <div className="flex justify-between items-center px-2 mb-2" style={{height:ROW_H}}>
            <CornerLabel color="red"/>
            <motion.div animate={{opacity:[1,0.6,1]}} transition={{repeat:Infinity,duration:1.4}}
              className="text-xs font-black px-3 py-1 rounded-full"
              style={{background:"rgba(76,175,80,0.15)",color:"#4caf50",border:"1px solid rgba(76,175,80,0.35)"}}>
              {cur?.name} এর পালা
            </motion.div>
            <CornerLabel color="green" flip/>
          </div>

          {/* ── BOARD ── */}
          <div className="relative rounded-xl overflow-hidden"
            style={{
              width:BOARD_PX, height:BOARD_PX,
              border:"5px solid #c8a400",
              outline:"2px solid rgba(255,220,0,0.15)",
              boxShadow:"0 0 60px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,220,0,0.08)",
            }}>

            {/* Grid cells */}
            {Array.from({length:GRID},(_,row)=>(
              <div key={row} className="flex" style={{height:CELL}}>
                {Array.from({length:GRID},(_,col)=>{
                  const k = `${row},${col}`;
                  const here = tokenMap[k] ?? [];
                  const bg = cellBg(row, col);
                  const isWhiteCell = bg === "#f5f5f5";
                  const isSafe = safeGrid.has(k);
                  const isStart = startGrid.has(k);
                  return (
                    <div key={col} className="relative flex items-center justify-center flex-shrink-0"
                      style={{
                        width:CELL, height:CELL, backgroundColor:bg,
                        border: isWhiteCell ? "1px solid #ddd" : "1px solid rgba(255,255,255,0.12)",
                      }}>
                      {/* Safe square marker (star) */}
                      {isWhiteCell && isSafe && here.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span style={{
                            fontSize: 15, color:"#aaa", lineHeight:1,
                            filter:"drop-shadow(0 1px 1px rgba(0,0,0,0.2))"
                          }}>☆</span>
                        </div>
                      )}
                      {/* Start square marker (colored star) */}
                      {isWhiteCell && isStart && here.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span style={{fontSize:13, color:"#f9a825", lineHeight:1, opacity:0.8}}>★</span>
                        </div>
                      )}
                      {/* Tokens */}
                      {here.length > 0 && (
                        <div className="flex flex-wrap gap-[2px] items-center justify-center z-10 w-full h-full p-0.5">
                          {here.slice(0,4).map(({color, ti})=>{
                            const isMovable = cur?.color===color && diceRolled && movable.includes(ti);
                            const sz = here.length>2 ? 13 : 20;
                            return (
                              <motion.div key={`${color}-${ti}`}
                                layout
                                initial={{scale:0.2,opacity:0}}
                                animate={isMovable
                                  ? {scale:[1,1.55,1,1.55,1], y:[0,-7,0,-7,0]}
                                  : {scale:1,y:0,opacity:1}}
                                transition={isMovable
                                  ? {duration:0.85,repeat:Infinity,ease:"easeInOut"}
                                  : {type:"spring",stiffness:420,damping:22,opacity:{duration:0.12}}}
                                onClick={()=>{ if(isMovable && dice) doMove(ti,dice); }}
                                style={{cursor:isMovable?"pointer":"default",zIndex:isMovable?20:10,flexShrink:0}}>
                                <OctaToken color={color} size={sz} glow={isMovable} star={sz>=18}/>
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

            {/* Home zone overlays: white inner boxes */}
            {(["red","green","blue","yellow"] as PlayerColor[])
              .filter(c=>players.some(p=>p.color===c))
              .map(color=>{
                const [rS,cS] = HOME_ZONES[color];
                const player = players.find(p=>p.color===color)!;
                const isActive = cur?.color===color;
                const pIdx = players.findIndex(p=>p.color===color);
                return (
                  <div key={color} className="absolute"
                    style={{left:cS*CELL,top:rS*CELL,width:6*CELL,height:6*CELL,pointerEvents:"none"}}>
                    {/* White inner panel */}
                    <motion.div className="absolute flex items-center justify-center"
                      animate={{boxShadow: isActive
                        ? `0 0 0 3px #4caf50, 0 0 24px rgba(76,175,80,0.5)`
                        : "none"}}
                      transition={{duration:0.4}}
                      style={{
                        left:CELL*0.55, top:CELL*0.55,
                        width:CELL*4.9, height:CELL*4.9,
                        background:"rgba(255,255,255,0.9)",
                        borderRadius:10,
                      }}>
                      <div className="grid grid-cols-2 gap-3">
                        {[0,1,2,3].map(i=>(
                          <motion.div key={i}
                            animate={player.tokens[i]===-1 && isActive
                              ? {scale:[1,1.14,1],filter:["brightness(1)","brightness(1.3)","brightness(1)"]}
                              : {scale:1,filter:"brightness(1)"}}
                            transition={{repeat:Infinity,duration:1.5,delay:i*0.28}}>
                            <OctaToken color={color} size={40}
                              glow={player.tokens[i]===-1 && isActive} star/>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                    {/* Player label */}
                    <div className="absolute font-black text-white text-xs"
                      style={{
                        [rS>=9?"bottom":"top"]:5,
                        [cS>=9?"right":"left"]:7,
                        textShadow:"0 1px 4px rgba(0,0,0,0.9)",
                        fontSize:11, letterSpacing:"0.03em", opacity:0.9,
                      }}>
                      Player {pIdx+1}
                    </div>
                  </div>
                );
              })}

            {/* Center triangles */}
            <div className="absolute" style={{left:6*CELL,top:6*CELL,width:3*CELL,height:3*CELL}}>
              <svg width={3*CELL} height={3*CELL} viewBox="0 0 120 120">
                <polygon points="60,60 0,0 120,0"    fill={COLORS.green.vivid}/>
                <polygon points="60,60 120,0 120,120" fill={COLORS.yellow.vivid}/>
                <polygon points="60,60 120,120 0,120" fill={COLORS.blue.vivid}/>
                <polygon points="60,60 0,120 0,0"    fill={COLORS.red.vivid}/>
              </svg>
            </div>
          </div>

          {/* BOTTOM ROW */}
          <div className="flex justify-between items-center px-2 mt-2" style={{height:ROW_H}}>
            <CornerLabel color="blue"/>
            <AnimatePresence>
              {msg && (
                <motion.div key="msg"
                  initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}} exit={{opacity:0}}
                  className="text-xs font-black px-3 py-1.5 rounded-full text-center"
                  style={{background:"rgba(249,168,37,0.15)",color:"#f9a825",border:"1px solid rgba(249,168,37,0.4)"}}>
                  {msg}
                </motion.div>
              )}
            </AnimatePresence>
            <CornerLabel color="yellow" flip/>
          </div>

          {/* ── FLOATING DICE with GREEN ARROW ── */}
          <motion.div className="absolute top-0 left-0 flex items-center gap-1.5"
            animate={{x: diceTarget.x - (canRoll ? 38 : 0), y: diceTarget.y}}
            transition={{type:"spring",stiffness:250,damping:22}}
            style={{zIndex:30}}>
            {/* Bouncing green arrow */}
            <AnimatePresence>
              {canRoll && (
                <motion.span key="arrow"
                  initial={{opacity:0,x:-8}} exit={{opacity:0}}
                  animate={{opacity:1, x:[0,9,0]}}
                  transition={{x:{repeat:Infinity,duration:0.65,ease:"easeInOut"}}}
                  style={{fontSize:26, color:"#4caf50",lineHeight:1,
                    textShadow:"0 0 12px rgba(76,175,80,0.9),0 0 24px rgba(76,175,80,0.5)"}}>
                  ▶
                </motion.span>
              )}
            </AnimatePresence>
            {/* Dice button */}
            <motion.button
              onClick={canRoll ? handleRoll : undefined}
              whileHover={canRoll?{scale:1.1}:{}}
              whileTap={canRoll?{scale:0.87}:{}}
              className="flex items-center justify-center rounded-2xl bg-white"
              style={{
                width:DICE_SZ, height:DICE_SZ,
                cursor:canRoll?"pointer":"default",
                border: canRoll ? "3px solid #4caf50" : "3px solid rgba(255,255,255,0.25)",
                boxShadow: canRoll
                  ? "0 0 22px rgba(76,175,80,0.75), 0 0 44px rgba(76,175,80,0.35)"
                  : "0 4px 20px rgba(0,0,0,0.6)",
              }}>
              <motion.div
                animate={isRolling
                  ? {rotate:[0,90,180,270,360], scale:[1,0.7,1.2,0.8,1]}
                  : {}}
                transition={{duration:0.3,repeat:isRolling?Infinity:0}}>
                {dice !== null
                  ? <DiceFace n={dice} sz={DICE_SZ-8}/>
                  : <span style={{fontSize:28,lineHeight:1}}>🎲</span>}
              </motion.div>
            </motion.button>
          </motion.div>

          {/* Back / Settings buttons */}
          <div className="absolute flex gap-2" style={{top:-50,left:0}}>
            <button onClick={()=>navigate("/game")}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{background:"rgba(255,255,255,0.1)",color:"white"}}>
              <ArrowLeft className="w-4 h-4"/>
            </button>
            <button onClick={()=>setPhase("setup")}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{background:"rgba(255,255,255,0.1)",color:"white"}}>
              <Settings className="w-4 h-4"/>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
