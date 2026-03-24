import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw, XSquare, Grip } from "lucide-react";

type Player = "X" | "O" | null;

const checkWinner = (squares: Player[]) => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6]             // diagonals
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: lines[i] };
    }
  }
  return null;
};

export default function TicTacToe() {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);

  const result = checkWinner(board);
  const winner = result?.winner;
  const winningLine = result?.line || [];
  const isDraw = !winner && board.every((square) => square !== null);

  const handleClick = (index: number) => {
    if (board[index] || winner) return;
    const newBoard = [...board];
    newBoard[index] = xIsNext ? "X" : "O";
    setBoard(newBoard);
    setXIsNext(!xIsNext);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
  };

  return (
    <div className="container max-w-lg py-6 pb-24 md:pb-8 flex flex-col items-center min-h-[80vh]">
      <div className="w-full mb-6 max-w-[350px]">
        <Link to="/game" className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          গেম জোনে ফেরত
        </Link>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2">
              <Grip className="w-6 h-6 text-emerald-500" />
              টিক-ট্যাক-টো
            </h1>
            <p className="text-sm text-muted-foreground">কৌশল খাটিয়ে জেতো!</p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[350px] bg-card p-6 rounded-3xl border border-border shadow-card mb-8">
        <div className="flex justify-between items-center mb-6 px-4">
          <div className={`text-center transition-opacity ${xIsNext && !winner && !isDraw ? "opacity-100" : "opacity-40"}`}>
            <span className="text-2xl font-black text-rose-500 font-display">X</span>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Turn</p>
          </div>
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-4 py-1.5 rounded-full bg-surface">
            Versus
          </div>
          <div className={`text-center transition-opacity ${!xIsNext && !winner && !isDraw ? "opacity-100" : "opacity-40"}`}>
            <span className="text-2xl font-black text-blue-500 font-display">O</span>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Turn</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-border p-2 sm:p-3 rounded-2xl">
          {board.map((cell, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: cell || winner ? 1 : 1.05 }}
              whileTap={{ scale: cell || winner ? 1 : 0.95 }}
              onClick={() => handleClick(i)}
              className={`aspect-square rounded-xl flex items-center justify-center text-4xl sm:text-5xl font-black shadow-sm transition-colors ${
                winningLine.includes(i) ? "bg-emerald-100" : "bg-card hover:bg-surface"
              }`}
              disabled={!!cell || !!winner}
            >
              <div className={`${cell === "X" ? "text-rose-500" : "text-blue-500"}`}>
                {cell === "X" && "✕"}
                {cell === "O" && "◯"}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {(winner || isDraw) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center w-full max-w-[350px]"
        >
          <div className="mb-6">
            {winner ? (
              <>
                <p className="text-muted-foreground font-semibold mb-1">যিনি জিতেছেন</p>
                <h2 className={`font-display text-4xl font-black ${winner === "X" ? "text-rose-500" : "text-blue-500"}`}>
                  {winner === "X" ? "প্লেয়ার X" : "প্লেয়ার O"} 🎉
                </h2>
              </>
            ) : (
              <h2 className="font-display text-3xl font-black text-muted-foreground">
                গেম ড্র! 🤝
              </h2>
            )}
          </div>
          <button
            onClick={resetGame}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 text-white font-display font-bold shadow-lg hover:scale-105 active:scale-95 transition-all text-lg"
          >
            <RotateCcw className="h-5 w-5" />
            আবার খেলো
          </button>
        </motion.div>
      )}
    </div>
  );
}
