import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  PlayerColor, TURN_ORDER_2P, TURN_ORDER_4P,
  COLOR_HEX, createInitialTokens, getPlayerPath, SAFE_ZONE_CELLS,
} from '@/features/ludo/ludoData';
import { playPop, playCapture, playFanfare } from '@/features/ludo/sounds';
import LudoBoard from '@/features/ludo/LudoBoard';
import PlayerPanel from '@/features/ludo/PlayerPanel';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';

const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

const LudoGame = () => {
  const [mode, setMode] = useState<2 | 4 | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<PlayerColor>('green');
  const [tokens, setTokens] = useState(createInitialTokens());
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [displayDice, setDisplayDice] = useState(1);
  const [diceRolled, setDiceRolled] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [winner, setWinner] = useState<PlayerColor | null>(null);
  const [consecutiveSixes, setConsecutiveSixes] = useState(0);

  const paths = useMemo(() => ({
    green: getPlayerPath('green'),
    yellow: getPlayerPath('yellow'),
    blue: getPlayerPath('blue'),
    red: getPlayerPath('red'),
  }), []);

  const activePlayers = mode === 2 ? TURN_ORDER_2P : TURN_ORDER_4P;

  const getValidMoves = useCallback((player: PlayerColor, dice: number): number[] => {
    return tokens[player]
      .filter(t => {
        if (t.pathIndex === 57) return false;
        if (t.pathIndex === -1) return dice === 6;
        return t.pathIndex + dice <= 57;
      })
      .map(t => t.id);
  }, [tokens]);

  const validMoves = useMemo(() => {
    if (!diceRolled || diceValue === null || isMoving) return [];
    return getValidMoves(currentPlayer, diceValue);
  }, [diceRolled, diceValue, isMoving, currentPlayer, getValidMoves]);

  // Win detection
  useEffect(() => {
    if (!mode) return;
    const ap = mode === 2 ? TURN_ORDER_2P : TURN_ORDER_4P;
    for (const color of ap) {
      if (tokens[color].every(t => t.pathIndex === 57)) {
        setWinner(color);
        playFanfare();
        return;
      }
    }
  }, [tokens, mode]);

  const advancePlayer = useCallback(() => {
    setDiceRolled(false);
    setDiceValue(null);
    setConsecutiveSixes(0);
    setCurrentPlayer(prev => {
      const order = mode === 2 ? TURN_ORDER_2P : TURN_ORDER_4P;
      return order[(order.indexOf(prev) + 1) % order.length];
    });
  }, [mode]);

  // Auto-pass when no valid moves
  useEffect(() => {
    if (!diceRolled || diceValue === null || isMoving || isRolling || winner) return;
    if (validMoves.length === 0) {
      const timer = setTimeout(() => advancePlayer(), 1200);
      return () => clearTimeout(timer);
    }
  }, [diceRolled, diceValue, isMoving, isRolling, winner, validMoves, advancePlayer]);

  const rollDice = useCallback(() => {
    if (isRolling || isMoving || diceRolled || winner) return;
    setIsRolling(true);
    let count = 0;
    const interval = setInterval(() => {
      setDisplayDice(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count >= 10) {
        clearInterval(interval);
        const value = Math.floor(Math.random() * 6) + 1;
        setDiceValue(value);
        setDisplayDice(value);
        setDiceRolled(true);
        setIsRolling(false);
      }
    }, 60);
  }, [isRolling, isMoving, diceRolled, winner]);

  const handleTokenClick = useCallback(async (color: PlayerColor, tokenId: number) => {
    if (isMoving || !diceRolled || diceValue === null || winner) return;
    if (color !== currentPlayer) return;

    const currentValidMoves = getValidMoves(currentPlayer, diceValue);
    if (!currentValidMoves.includes(tokenId)) return;

    const token = tokens[color][tokenId];
    const dice = diceValue;
    const playerPath = paths[color];
    const currentSixes = consecutiveSixes;

    setIsMoving(true);

    let finalPathIndex: number;

    if (token.pathIndex === -1) {
      // Bring out token
      finalPathIndex = 0;
      playPop();
      setTokens(prev => ({
        ...prev,
        [color]: prev[color].map(t => t.id === tokenId ? { ...t, pathIndex: 0 } : t),
      }));
      await delay(300);
    } else {
      // Move step by step
      finalPathIndex = token.pathIndex;
      for (let step = 1; step <= dice; step++) {
        await delay(300);
        playPop();
        const nextIdx = token.pathIndex + step;
        setTokens(prev => ({
          ...prev,
          [color]: prev[color].map(t => t.id === tokenId ? { ...t, pathIndex: nextIdx } : t),
        }));
        finalPathIndex = nextIdx;
      }
    }

    // Check capture (only on common path cells, indices 0-50)
    if (finalPathIndex >= 0 && finalPathIndex <= 50) {
      const finalCell = playerPath[finalPathIndex];
      const cellKey = `${finalCell[0]},${finalCell[1]}`;
      if (!SAFE_ZONE_CELLS.has(cellKey)) {
        const order = mode === 2 ? TURN_ORDER_2P : TURN_ORDER_4P;
        for (const oppColor of order) {
          if (oppColor === color) continue;
          const oppPath = paths[oppColor];
          let captured = false;
          
          setTokens(prev => {
            const updated = {
              ...prev,
              [oppColor]: prev[oppColor].map(t => {
                if (t.pathIndex >= 0 && t.pathIndex <= 50) {
                  const tCell = oppPath[t.pathIndex];
                  if (tCell[0] === finalCell[0] && tCell[1] === finalCell[1]) {
                    captured = true;
                    return { ...t, pathIndex: -1 };
                  }
                }
                return t;
              }),
            };
            return updated;
          });
          
          if (captured) {
            playCapture();
            // Optional: Delay for capture effect
            await delay(400); 
          }
        }
      }
    }

    await delay(200);
    setIsMoving(false);
    setDiceRolled(false);
    setDiceValue(null);

    // Handle turn
    if (dice === 6) {
      const newSixes = currentSixes + 1;
      if (newSixes >= 3) {
        setConsecutiveSixes(0);
        setTimeout(() => {
          setCurrentPlayer(prev => {
            const order = mode === 2 ? TURN_ORDER_2P : TURN_ORDER_4P;
            return order[(order.indexOf(prev) + 1) % order.length];
          });
        }, 400);
      } else {
        setConsecutiveSixes(newSixes);
      }
    } else {
      setConsecutiveSixes(0);
      setTimeout(() => {
        setCurrentPlayer(prev => {
          const order = mode === 2 ? TURN_ORDER_2P : TURN_ORDER_4P;
          return order[(order.indexOf(prev) + 1) % order.length];
        });
      }, 400);
    }
  }, [isMoving, diceRolled, diceValue, winner, currentPlayer, tokens, paths, mode, consecutiveSixes, getValidMoves]);

  const startGame = (m: 2 | 4) => {
    setMode(m);
    setTokens(createInitialTokens());
    setCurrentPlayer('green');
    setDiceValue(null);
    setDiceRolled(false);
    setWinner(null);
    setConsecutiveSixes(0);
  };

  const restartGame = () => {
    setMode(null);
    setTokens(createInitialTokens());
    setCurrentPlayer('green');
    setDiceValue(null);
    setDiceRolled(false);
    setIsRolling(false);
    setIsMoving(false);
    setWinner(null);
    setConsecutiveSixes(0);
  };

  // Setup screen
  if (!mode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-orange-50 gap-12 p-6 animate-in fade-in duration-700">
        <Navbar />
        <div className="text-center relative">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse" />
          <div className="text-8xl mb-6 transform hover:rotate-12 transition-transform cursor-pointer drop-shadow-xl">🎲</div>
          <h1 className="text-6xl font-black text-gray-900 mb-4 tracking-tighter">
            জাবি লুডু <span className="text-primary italic">কিং</span>
          </h1>
          <p className="text-gray-500 text-xl font-medium">নিচের মোডগুলো থেকে একটি সিলেক্ট করো</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg">
          <Button 
            onClick={() => startGame(2)} 
            size="lg" 
            className="flex-1 py-10 text-2xl font-black rounded-[32px] bg-white text-gray-800 border-4 border-gray-100 hover:border-primary hover:bg-primary/5 transition-all shadow-xl"
          >
            👥 ২ জন খেলোয়াড়
          </Button>
          <Button 
            onClick={() => startGame(4)} 
            size="lg" 
            className="flex-1 py-10 text-2xl font-black rounded-[32px] bg-white text-gray-800 border-4 border-gray-100 hover:border-primary hover:bg-primary/5 transition-all shadow-xl"
          >
            👥👥 ৪ জন খেলোয়াড়
          </Button>
        </div>
        
        <div className="max-w-md text-center px-6">
          <p className="text-sm text-gray-400 font-medium leading-relaxed">
            বন্ধুদের সাথে বা এআই-এর সাথে মজার লুডু লড়াই শুরু করো। একদম প্রফেশনাল গেমপ্লে আর সাউন্ড ইফেক্ট পেতে এখনই যোগ দাও!
          </p>
        </div>
      </div>
    );
  }

  const diceDisplay = isRolling ? displayDice : (diceValue ?? 1);

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#FDFCFB] pb-10">
      <Navbar />
      
      {/* Header */}
      <div className="w-full max-w-4xl px-4 py-4 flex items-center justify-between mt-4">
        <div className="flex items-center gap-3">
          <div className="bg-white shadow-md w-10 h-10 rounded-xl flex items-center justify-center border border-gray-100 text-xl">🎲</div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">জাবি লুডু কিং</h1>
        </div>
        <Button 
          variant="outline" 
          onClick={restartGame}
          className="rounded-full px-6 font-bold text-gray-600 border-gray-200 hover:bg-gray-50 bg-white"
        >
          গেম রিসেট করো
        </Button>
      </div>

      {/* Game grid container */}
      <div className="w-full flex flex-col items-center gap-6 px-4" style={{ maxWidth: 'min(650px, 98vmin)' }}>
        
        {/* Top players row */}
        <div className="w-full flex justify-between items-end">
          <PlayerPanel
            color="green" position="top" playerType="human"
            finished={tokens.green.filter(t => t.pathIndex === 57).length}
            isActive={currentPlayer === 'green'}
            diceValue={diceDisplay} isRolling={isRolling}
            canRoll={currentPlayer === 'green' && !diceRolled && !isRolling && !isMoving && !winner}
            onRoll={rollDice}
            consecutiveSixes={currentPlayer === 'green' ? consecutiveSixes : 0}
            noMoves={currentPlayer === 'green' && diceRolled && validMoves.length === 0}
          />
          <PlayerPanel
            color="yellow" position="top" playerType={mode === 2 ? 'ai' : 'human'}
            finished={tokens.yellow.filter(t => t.pathIndex === 57).length}
            isActive={currentPlayer === 'yellow'}
            diceValue={diceDisplay} isRolling={isRolling}
            canRoll={currentPlayer === 'yellow' && !diceRolled && !isRolling && !isMoving && !winner}
            onRoll={rollDice}
            consecutiveSixes={currentPlayer === 'yellow' ? consecutiveSixes : 0}
            noMoves={currentPlayer === 'yellow' && diceRolled && validMoves.length === 0}
          />
        </div>

        {/* Board with drop shadow */}
        <div className="w-full relative z-10">
          <LudoBoard
            tokens={tokens}
            activePlayers={activePlayers}
            paths={paths}
            validMoveTokens={validMoves}
            currentPlayer={currentPlayer}
            onTokenClick={handleTokenClick}
          />
          
          {/* Instruction tooltip */}
          {diceRolled && validMoves.length > 0 && !isMoving && (
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 animate-bounce flex items-center gap-2 bg-primary/90 text-white px-5 py-2 rounded-full text-sm font-bold shadow-xl border-2 border-white/20 whitespace-nowrap">
              চলুন, আপনার গুটি চালুন! ✨
            </div>
          )}
        </div>

        {/* Bottom players row */}
        <div className="w-full flex justify-between items-start">
          <PlayerPanel
            color="red" position="bottom" playerType={mode === 2 ? 'ai' : 'human'}
            finished={tokens.red.filter(t => t.pathIndex === 57).length}
            isActive={currentPlayer === 'red'}
            diceValue={diceDisplay} isRolling={isRolling}
            canRoll={currentPlayer === 'red' && !diceRolled && !isRolling && !isMoving && !winner}
            onRoll={rollDice}
            consecutiveSixes={currentPlayer === 'red' ? consecutiveSixes : 0}
            noMoves={currentPlayer === 'red' && diceRolled && validMoves.length === 0}
          />
          <PlayerPanel
            color="blue" position="bottom" playerType={mode === 2 ? 'human' : 'human'}
            finished={tokens.blue.filter(t => t.pathIndex === 57).length}
            isActive={currentPlayer === 'blue'}
            diceValue={diceDisplay} isRolling={isRolling}
            canRoll={currentPlayer === 'blue' && !diceRolled && !isRolling && !isMoving && !winner}
            onRoll={rollDice}
            consecutiveSixes={currentPlayer === 'blue' ? consecutiveSixes : 0}
            noMoves={currentPlayer === 'blue' && diceRolled && validMoves.length === 0}
          />
        </div>
      </div>

      {/* Winner Overlay - High Fidelity */}
      {winner && (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-xl flex items-center justify-center z-[100] animate-in fade-in duration-500">
          <div className="bg-white rounded-[40px] p-12 text-center shadow-2xl border border-gray-100 max-w-sm mx-4 animate-in zoom-in slide-in-from-bottom-10 duration-700">
            <div className="text-8xl mb-8 animate-bounce">👑</div>
            <h2 className="text-4xl font-black capitalize mb-2 tracking-tight"
              style={{ color: COLOR_HEX[winner] }}>
              {winner === 'green' ? 'সবুজ' : winner === 'red' ? 'লাল' : winner === 'yellow' ? 'হলুদ' : 'নীল'} টিম জয়ী!
            </h2>
            <p className="text-gray-500 text-lg font-bold mb-10">অসাধারণ খেলেছেন! 🎉</p>
            <Button 
              onClick={restartGame} 
              size="lg" 
              className="w-full py-8 text-xl font-black rounded-3xl shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              আবার খেলুন
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LudoGame;
