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
import { useGameEconomy } from '@/hooks/useGameEconomy';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import Scorecard from '@/components/Scorecard';
import { Input } from '@/components/ui/input';
import { RefreshCw } from 'lucide-react';

const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

const LudoGame = () => {
  const [mode, setMode] = useState<2 | 4 | 'multiplayer' | null>(null);
  const [tokens, setTokens] = useState<Record<PlayerColor, TokenState[]>>(createInitialTokens());
  const [currentPlayer, setCurrentPlayer] = useState<PlayerColor>('green');
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [displayDice, setDisplayDice] = useState(1);
  const [diceRolled, setDiceRolled] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [winner, setWinner] = useState<PlayerColor | null>(null);
  const [consecutiveSixes, setConsecutiveSixes] = useState(0);
  const [showMultiplayerMenu, setShowMultiplayerMenu] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');

  const { addCoins } = useGameEconomy();
  const { roomId, isConnected, createRoom, joinRoom, leaveRoom, broadcastState } = useMultiplayer('ludo', (state) => {
    if (state.tokens) setTokens(state.tokens);
    if (state.currentPlayer) setCurrentPlayer(state.currentPlayer);
    if (state.diceValue !== undefined) setDiceValue(state.diceValue);
    if (state.diceRolled !== undefined) setDiceRolled(state.diceRolled);
    if (state.consecutiveSixes !== undefined) setConsecutiveSixes(state.consecutiveSixes);
    if (state.winner !== undefined) setWinner(state.winner);
  });

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
        if (t.pathIndex >= 56) return false;
        if (t.pathIndex === -1) return dice === 6;
        return t.pathIndex + dice <= 56;
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
      if (tokens[color].every(t => t.pathIndex >= 56)) {
        setWinner(color);
        playFanfare();
        addCoins(500);
        return;
      }
    }
  }, [tokens, mode, addCoins]);

  const advancePlayer = useCallback(() => {
    setDiceRolled(false);
    setDiceValue(null);
    setConsecutiveSixes(0);
    setCurrentPlayer(prev => {
      const order = mode === 2 ? TURN_ORDER_2P : TURN_ORDER_4P;
      const next = order[(order.indexOf(prev) + 1) % order.length];
      if (mode === 'multiplayer') broadcastState({ currentPlayer: next, diceRolled: false, diceValue: null, consecutiveSixes: 0 });
      return next;
    });
  }, [mode, broadcastState]);

  // Auto-pass when no valid moves
  useEffect(() => {
    if (!diceRolled || diceValue === null || isMoving || isRolling || winner) return;
    if (validMoves.length === 0) {
      const timer = setTimeout(() => advancePlayer(), 1200);
      return () => clearTimeout(timer);
    }
  }, [diceRolled, diceValue, isMoving, isRolling, winner, validMoves, advancePlayer]);

  // AI Logic Hook
  useEffect(() => {
    if (mode !== 2 || winner || isMoving || isRolling) return;
    
    const isAI = currentPlayer === 'yellow';
    if (!isAI) return;

    if (!diceRolled) {
      const timer = setTimeout(() => rollDice(), 800);
      return () => clearTimeout(timer);
    } else {
      if (validMoves.length === 0) return;
      
      const timer = setTimeout(() => {
        let chosenToken = validMoves[0];
        const tokenToOut = tokens[currentPlayer].find(t => t.pathIndex === -1 && validMoves.includes(t.id));
        if (tokenToOut) {
          chosenToken = tokenToOut.id;
        } else {
          const active = tokens[currentPlayer].filter(t => validMoves.includes(t.id));
          if (active.length > 0) {
            chosenToken = active.sort((a, b) => b.pathIndex - a.pathIndex)[0].id;
          }
        }
        handleTokenClick('yellow', chosenToken);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [mode, winner, isMoving, isRolling, currentPlayer, diceRolled, validMoves, tokens]);

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
        setIsRolling(false);
        
        if (value === 6 && consecutiveSixes === 2) {
          setTimeout(() => {
             setConsecutiveSixes(0);
             advancePlayer();
          }, 1000);
        } else {
          setDiceRolled(true);
          if (mode === 'multiplayer') broadcastState({ diceValue: value, diceRolled: true, isRolling: false });
        }
      }
    }, 60);
  }, [isRolling, isMoving, diceRolled, winner, consecutiveSixes, advancePlayer, mode, broadcastState]);

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
    let newTokens = { ...tokens };

    if (token.pathIndex === -1) {
      finalPathIndex = 0;
      playPop();
      newTokens = {
        ...newTokens,
        [color]: newTokens[color].map(t => t.id === tokenId ? { ...t, pathIndex: 0 } : t),
      };
      setTokens(newTokens);
      await delay(300);
    } else {
      finalPathIndex = token.pathIndex;
      for (let step = 1; step <= dice; step++) {
        await delay(300);
        playPop();
        const nextIdx = token.pathIndex + step;
        newTokens = {
          ...newTokens,
          [color]: newTokens[color].map(t => t.id === tokenId ? { ...t, pathIndex: nextIdx } : t),
        };
        setTokens(newTokens);
        finalPathIndex = nextIdx;
      }
    }

    let capturedToken = false;
    if (finalPathIndex >= 0 && finalPathIndex <= 50) {
      const finalCell = playerPath[finalPathIndex];
      const cellKey = `${finalCell[0]},${finalCell[1]}`;
      if (!SAFE_ZONE_CELLS.has(cellKey)) {
        const order = mode === 2 ? TURN_ORDER_2P : TURN_ORDER_4P;
        for (const oppColor of order) {
          if (oppColor === color) continue;
          const oppPath = paths[oppColor];
          
          let captureOccurred = false;
          newTokens = {
            ...newTokens,
            [oppColor]: newTokens[oppColor].map(t => {
              if (t.pathIndex >= 0 && t.pathIndex <= 50) {
                const tCell = oppPath[t.pathIndex];
                if (tCell[0] === finalCell[0] && tCell[1] === finalCell[1]) {
                  captureOccurred = true;
                  return { ...t, pathIndex: -1 };
                }
              }
              return t;
            }),
          };
          
          if (captureOccurred) {
            capturedToken = true;
            playCapture();
          }
        }
        setTokens(newTokens);
        if (capturedToken) await delay(400);
      }
    }

    await delay(200);
    setIsMoving(false);
    setDiceRolled(false);
    setDiceValue(null);

    const isFinished = finalPathIndex >= 56;
    const bonusTurn = dice === 6 || capturedToken || isFinished;
    const sixes = dice === 6 ? currentSixes + 1 : 0;

    if (mode === 'multiplayer') {
        broadcastState({ tokens: newTokens, currentPlayer: bonusTurn ? currentPlayer : (mode === 2 ? TURN_ORDER_2P : TURN_ORDER_4P)[((mode === 2 ? TURN_ORDER_2P : TURN_ORDER_4P).indexOf(currentPlayer) + 1) % (mode === 2 ? TURN_ORDER_2P : TURN_ORDER_4P).length], diceRolled: false, diceValue: null, consecutiveSixes: bonusTurn ? sixes : 0 });
    }

    if (bonusTurn) {
        setConsecutiveSixes(sixes);
    } else {
        setConsecutiveSixes(0);
        setTimeout(() => advancePlayer(), 400);
    }
  }, [isMoving, diceRolled, diceValue, winner, currentPlayer, tokens, paths, mode, getValidMoves, advancePlayer, broadcastState, consecutiveSixes]);

  const startGame = (m: 2 | 4 | 'multiplayer') => {
    if (m === 'multiplayer') {
      const newRoom = createRoom();
      console.log('Room created:', newRoom);
    }
    setMode(m);
    setTokens(createInitialTokens());
    setCurrentPlayer('green');
    setDiceValue(null);
    setDiceRolled(false);
    setWinner(null);
    setConsecutiveSixes(0);
  };

  const handleJoinRoom = () => {
    if (joinCodeInput.length === 4) {
      joinRoom(joinCodeInput.toUpperCase());
      setMode('multiplayer');
      setTokens(createInitialTokens());
      setCurrentPlayer('green');
      setDiceValue(null);
      setDiceRolled(false);
      setWinner(null);
      setConsecutiveSixes(0);
    }
  };

  const restartGame = () => {
    setMode(null);
    leaveRoom();
    setTokens(createInitialTokens());
    setCurrentPlayer('green');
    setDiceValue(null);
    setDiceRolled(false);
    setIsRolling(false);
    setIsMoving(false);
    setWinner(null);
    setConsecutiveSixes(0);
  };

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
          {showMultiplayerMenu ? (
            <div className="w-full flex flex-col gap-4 animate-in slide-in-from-right">
              <div className="flex gap-2">
                <Input 
                  placeholder="Enter 4-letter Room Code" 
                  value={joinCodeInput} 
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  maxLength={4}
                  className="text-center text-xl font-bold uppercase tracking-widest h-16 rounded-2xl"
                />
                <Button 
                  onClick={handleJoinRoom}
                  disabled={joinCodeInput.length !== 4}
                  className="h-16 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Join
                </Button>
              </div>
              <div className="text-center text-gray-500 font-bold">OR</div>
              <Button 
                onClick={() => startGame('multiplayer')} 
                className="h-16 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg shadow-lg"
              >
                Create New Room
              </Button>
              <Button variant="ghost" onClick={() => setShowMultiplayerMenu(false)}>Cancel</Button>
            </div>
          ) : (
            <>
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
              <Button 
                onClick={() => setShowMultiplayerMenu(true)} 
                size="lg" 
                className="flex-1 py-10 text-2xl font-black rounded-[32px] bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-4 border-transparent hover:opacity-90 transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)]"
              >
                🌐 Play Online
              </Button>
            </>
          )}
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

      {mode === 'multiplayer' && roomId && (
        <div className="w-full flex justify-center mt-4 px-4 relative z-10">
          <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-full border border-indigo-100 shadow-md flex items-center gap-3">
            <span className="text-gray-500 font-bold text-sm">Room Code:</span>
            <span className="font-black text-2xl tracking-widest text-indigo-600">{roomId}</span>
          </div>
        </div>
      )}
      
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
            finished={tokens.green.filter(t => t.pathIndex >= 56).length}
            isActive={currentPlayer === 'green'}
            diceValue={diceDisplay} isRolling={isRolling}
            canRoll={currentPlayer === 'green' && !diceRolled && !isRolling && !isMoving && !winner}
            onRoll={rollDice}
            consecutiveSixes={currentPlayer === 'green' ? consecutiveSixes : 0}
            noMoves={currentPlayer === 'green' && diceRolled && validMoves.length === 0}
          />
          <PlayerPanel
            color="yellow" position="top" playerType={mode === 2 ? 'ai' : 'human'}
            finished={tokens.yellow.filter(t => t.pathIndex >= 56).length}
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
            finished={tokens.red.filter(t => t.pathIndex >= 56).length}
            isActive={currentPlayer === 'red'}
            diceValue={diceDisplay} isRolling={isRolling}
            canRoll={currentPlayer === 'red' && !diceRolled && !isRolling && !isMoving && !winner}
            onRoll={rollDice}
            consecutiveSixes={currentPlayer === 'red' ? consecutiveSixes : 0}
            noMoves={currentPlayer === 'red' && diceRolled && validMoves.length === 0}
          />
          <PlayerPanel
            color="blue" position="bottom" playerType={mode === 2 ? 'human' : 'human'}
            finished={tokens.blue.filter(t => t.pathIndex >= 56).length}
            isActive={currentPlayer === 'blue'}
            diceValue={diceDisplay} isRolling={isRolling}
            canRoll={currentPlayer === 'blue' && !diceRolled && !isRolling && !isMoving && !winner}
            onRoll={rollDice}
            consecutiveSixes={currentPlayer === 'blue' ? consecutiveSixes : 0}
            noMoves={currentPlayer === 'blue' && diceRolled && validMoves.length === 0}
          />
        </div>
      </div>

      {/* Winner Overlay - Scorecard */}
      {winner && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in p-4">
          <Scorecard 
            gameName="Ludo" 
            scoreOrStatus={`${winner === 'green' ? 'সবুজ' : winner === 'red' ? 'লাল' : winner === 'yellow' ? 'হলুদ' : 'নীল'} টিম জয়ী!`} 
            avatarUrl={`https://api.dicebear.com/7.x/avataaars/svg?seed=${winner}Ludo`}
            playerName="Ludo Champion"
          />
          <Button
            size="lg"
            className="mt-8 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-full font-bold shadow-lg text-xl px-8 py-6"
            onClick={restartGame}
          >
            <RefreshCw className="w-6 h-6 mr-2" /> আবার খেলুন
          </Button>
        </div>
      )}
    </div>
  );
};

export default LudoGame;
