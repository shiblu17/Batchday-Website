import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import GameLeaderboard from "@/components/GameLeaderboard";
import GameLoginModal from "@/components/GameLoginModal";
import { audioSystem } from "@/utils/audio";
import { triggerConfetti } from "@/utils/confetti";
import { ArrowLeft, RotateCcw, Trophy, Volume2, VolumeX, Sparkles, Grid3X3, Maximize, Minimize } from "lucide-react";

const GRID_SIZE = 8;

interface PieceShape {
  id: number;
  shape: number[][]; // 2D array of 1s and 0s
  color: string;
}

const SHAPES = [
  // 1x1
  { shape: [[1]], color: "#facc15" },
  // 2x2
  { shape: [[1, 1], [1, 1]], color: "#38bdf8" },
  // 3x3
  { shape: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], color: "#ec4899" },
  // Lines
  { shape: [[1, 1]], color: "#a855f7" },
  { shape: [[1, 1, 1]], color: "#06b6d4" },
  { shape: [[1, 1, 1, 1]], color: "#22c55e" },
  { shape: [[1], [1]], color: "#a855f7" },
  { shape: [[1], [1], [1]], color: "#06b6d4" },
  { shape: [[1], [1], [1], [1]], color: "#22c55e" },
  // L-Shapes
  { shape: [[1, 0], [1, 0], [1, 1]], color: "#f97316" },
  { shape: [[0, 1], [0, 1], [1, 1]], color: "#f97316" },
  { shape: [[1, 1, 1], [1, 0, 0]], color: "#f97316" },
  // T-Shapes
  { shape: [[1, 1, 1], [0, 1, 0]], color: "#6366f1" },
];

export default function BlockBlast() {
  const [gameState, setGameState] = useState<"start" | "playing" | "gameover">("start");
  const [grid, setGrid] = useState<(string | null)[][]>(() =>
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null))
  );
  const [pieces, setPieces] = useState<PieceShape[]>([]);
  const [selectedPieceIndex, setSelectedPieceIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [comboText, setComboText] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const hasSubmittedScore = useRef(false);

  // Sound Synthesizer
  const playBlastSound = useCallback((comboCount: number) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const baseFreq = 300 + comboCount * 120;
      osc.type = "sine";
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 2, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
      audioSystem.playCoin();
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("block_blast_highscore");
    if (saved) setHighScore(parseInt(saved, 10));

    const savedNick = localStorage.getItem("ju_game_nickname_v2");
    if (savedNick) setNickname(savedNick);

    setIsMuted(audioSystem.isMuted);

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const generateNewPieces = useCallback(() => {
    const newP: PieceShape[] = [];
    for (let i = 0; i < 3; i++) {
      const template = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      newP.push({
        id: Math.random(),
        shape: template.shape,
        color: template.color,
      });
    }
    setPieces(newP);
    setSelectedPieceIndex(null);
  }, []);

  const initGame = useCallback(() => {
    setGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)));
    setScore(0);
    setComboText(null);
    hasSubmittedScore.current = false;
    generateNewPieces();
  }, [generateNewPieces]);

  // Check if piece can fit at row, col
  const canFit = (currentGrid: (string | null)[][], shape: number[][], r: number, c: number) => {
    const sRows = shape.length;
    const sCols = shape[0].length;

    if (r + sRows > GRID_SIZE || c + sCols > GRID_SIZE) return false;

    for (let i = 0; i < sRows; i++) {
      for (let j = 0; j < sCols; j++) {
        if (shape[i][j] === 1 && currentGrid[r + i][c + j] !== null) {
          return false;
        }
      }
    }
    return true;
  };

  // Check if any piece can fit anywhere on board
  const checkGameOver = (currentGrid: (string | null)[][], currentPieces: PieceShape[]) => {
    for (const piece of currentPieces) {
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (canFit(currentGrid, piece.shape, r, c)) {
            return false; // Still can place!
          }
        }
      }
    }
    return true; // No moves left -> GAME OVER!
  };

  // Place Selected Piece on Cell
  const handleCellClick = (r: number, c: number) => {
    if (gameState !== "playing" || selectedPieceIndex === null) return;
    const piece = pieces[selectedPieceIndex];
    if (!piece) return;

    if (!canFit(grid, piece.shape, r, c)) {
      audioSystem.playClick();
      return;
    }

    // Place piece
    const newGrid = grid.map((row) => [...row]);
    let placedBlocksCount = 0;
    for (let i = 0; i < piece.shape.length; i++) {
      for (let j = 0; j < piece.shape[0].length; j++) {
        if (piece.shape[i][j] === 1) {
          newGrid[r + i][c + j] = piece.color;
          placedBlocksCount += 1;
        }
      }
    }

    audioSystem.playClick();
    let pointsEarned = placedBlocksCount * 10;

    // Line clearing logic
    const rowsToClear: number[] = [];
    const colsToClear: number[] = [];

    // Check rows
    for (let i = 0; i < GRID_SIZE; i++) {
      if (newGrid[i].every((cell) => cell !== null)) {
        rowsToClear.push(i);
      }
    }

    // Check cols
    for (let j = 0; j < GRID_SIZE; j++) {
      let fullCol = true;
      for (let i = 0; i < GRID_SIZE; i++) {
        if (newGrid[i][j] === null) {
          fullCol = false;
          break;
        }
      }
      if (fullCol) colsToClear.push(j);
    }

    const totalLines = rowsToClear.length + colsToClear.length;
    if (totalLines > 0) {
      playBlastSound(totalLines);
      pointsEarned += totalLines * 80 * totalLines; // combo exponential multiplier!

      if (totalLines >= 2) {
        setComboText(`LINE COMBO x${totalLines}!`);
        setTimeout(() => setComboText(null), 1200);
      }

      // Clear matching rows
      rowsToClear.forEach((rowIdx) => {
        for (let cIdx = 0; cIdx < GRID_SIZE; cIdx++) {
          newGrid[rowIdx][cIdx] = null;
        }
      });

      // Clear matching cols
      colsToClear.forEach((colIdx) => {
        for (let rIdx = 0; rIdx < GRID_SIZE; rIdx++) {
          newGrid[rIdx][colIdx] = null;
        }
      });
    }

    setGrid(newGrid);
    setScore((s) => s + pointsEarned);

    // Remove used piece
    const updatedPieces = pieces.filter((_, idx) => idx !== selectedPieceIndex);
    setSelectedPieceIndex(null);

    // If all 3 used -> spawn 3 more
    if (updatedPieces.length === 0) {
      generateNewPieces();
    } else {
      setPieces(updatedPieces);
      // Check Game Over on remaining pieces
      if (checkGameOver(newGrid, updatedPieces)) {
        audioSystem.playGameOver();
        setGameState("gameover");
      }
    }
  };

  // Submit High Score to Supabase
  useEffect(() => {
    if (gameState === "gameover" && score > 0 && nickname.trim() && !hasSubmittedScore.current) {
      hasSubmittedScore.current = true;

      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem("block_blast_highscore", score.toString());
        triggerConfetti();
      }

      const submit = async () => {
        try {
          await supabase.from("game_scores").insert({
            nickname: nickname.trim().substring(0, 40),
            game_name: "block_blast_v1",
            score: score,
          });
        } catch (err) {
          console.error("Score submit error", err);
        }
      };
      submit();
    }
  }, [gameState, score, nickname, highScore]);

  const handleStartGame = (name: string) => {
    const finalName = name.trim().substring(0, 40);
    setNickname(finalName);
    localStorage.setItem("ju_game_nickname_v2", finalName);
    setGameState("playing");
    initGame();
  };

  const toggleSound = () => {
    const muted = audioSystem.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-slate-950 text-white flex flex-col overflow-hidden select-none z-50">
      {/* Top Header Navbar */}
      <div className="w-full px-3 py-2 flex items-center justify-between shrink-0 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 z-20">
        <Link
          to="/game"
          className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-400 hover:text-white transition-colors py-1.5 px-3 rounded-xl bg-slate-800/80 border border-slate-700/60"
        >
          <ArrowLeft className="w-4 h-4" />
          গেম জোন
        </Link>

        {/* Live Score Counter */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-1.5">
            <Grid3X3 className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-base font-black text-amber-400 font-mono">{score}</span>
          </div>
          <div className="hidden xs:flex px-2.5 py-1 rounded-xl bg-slate-950/80 border border-slate-800 items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-bold text-amber-400 font-mono">{highScore}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-400 hover:text-white transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-400 hover:text-white transition-colors"
            title="ফুলস্ক্রিন"
          >
            {isFullscreen ? <Minimize className="w-4 h-4 text-amber-400" /> : <Maximize className="w-4 h-4" />}
          </button>
          <GameLeaderboard gameName="block_blast_v1" />
        </div>
      </div>

      {/* Main Full-Height Play Area */}
      <div className="flex-1 w-full min-h-0 flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden">
        {/* Floating Combo Indicator */}
        <AnimatePresence>
          {comboText && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: -20 }}
              animate={{ scale: 1.1, opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs shadow-lg flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              {comboText}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 8x8 Block Grid */}
        <div className="w-full max-w-[360px] aspect-square p-2 rounded-3xl bg-slate-900 border-2 border-slate-800 shadow-2xl grid grid-cols-8 gap-1">
          {grid.map((row, rIdx) =>
            row.map((cell, cIdx) => (
              <div
                key={`${rIdx}-${cIdx}`}
                onClick={() => handleCellClick(rIdx, cIdx)}
                className={`w-full h-full rounded-lg transition-all duration-150 cursor-pointer ${
                  cell
                    ? "shadow-md"
                    : "bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/40"
                }`}
                style={{
                  backgroundColor: cell || undefined,
                  boxShadow: cell ? `0 0 10px ${cell}80` : undefined,
                }}
              />
            ))
          )}
        </div>

        {/* Bottom Pieces Selector Area */}
        <div className="w-full max-w-[360px] flex items-center justify-around gap-2 mt-4 px-2 py-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 shrink-0">
          {pieces.map((piece, pIdx) => {
            const isSelected = selectedPieceIndex === pIdx;
            return (
              <div
                key={piece.id}
                onClick={() => setSelectedPieceIndex(isSelected ? null : pIdx)}
                className={`p-2 rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-center ${
                  isSelected
                    ? "bg-amber-500/20 border-2 border-amber-400 scale-105 shadow-lg shadow-amber-500/20"
                    : "hover:bg-slate-800/60 border border-transparent"
                }`}
              >
                <div
                  className="grid gap-1"
                  style={{
                    gridTemplateColumns: `repeat(${piece.shape[0].length}, minmax(0, 1fr))`,
                  }}
                >
                  {piece.shape.map((sRow, sR) =>
                    sRow.map((val, sC) => (
                      <div
                        key={`${sR}-${sC}`}
                        className="w-4 h-4 rounded-sm"
                        style={{
                          backgroundColor: val === 1 ? piece.color : "transparent",
                          boxShadow: val === 1 ? `0 0 6px ${piece.color}80` : undefined,
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-slate-500 mt-2 text-center">
          নিচের একটি ব্লক সিলেক্ট করে বোর্ডে বসাও। পুরো লাইন পূর্ণ করলেই ব্লাস্ট!
        </p>
      </div>

      {/* Game Over Screen Modal */}
      {gameState === "gameover" && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 z-[9990]">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-xs text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/10">
              <Grid3X3 className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-black font-display text-white mb-1">আর ব্লক বসানোর জায়গা নেই!</h2>
            <p className="text-sm text-slate-400 mb-6">পরের বারে লাইন দ্রুত ক্লিয়ার করো</p>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 shadow-inner">
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800/80">
                <span className="text-sm font-semibold text-slate-400">সর্বমোট স্কোর</span>
                <span className="text-2xl font-black text-white">{score}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-400 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  সর্বোচ্চ রেকর্ড
                </span>
                <span className="text-xl font-black text-amber-400">{Math.max(score, highScore)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setGameState("playing");
                initGame();
                audioSystem.playClick();
              }}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-base shadow-xl shadow-amber-500/25 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              আবার খেলো (Replay)
            </button>
          </motion.div>
        </div>
      )}

      {/* Start Game Modal - At Root Level */}
      {gameState === "start" && (
        <GameLoginModal
          gameTitle="ব্লক ব্লাস্ট (Block Blast)"
          onStart={handleStartGame}
        />
      )}
    </div>
  );
}
