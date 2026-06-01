import React, { useEffect, useRef } from 'react';
import { useTwentyNine } from './useTwentyNine';
import { CardUI } from './CardUI';
import { PlayerPosition, Card } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from 'lucide-react';

// --- Sound Effects ---
const playCardSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch(e) {}
};

const playTrickWinSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    [400, 500, 600].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + (i * 0.1));
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime + (i * 0.1));
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (i * 0.1) + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + (i * 0.1));
      osc.stop(ctx.currentTime + (i * 0.1) + 0.1);
    });
  } catch(e) {}
};

export const TwentyNineBoard: React.FC = () => {
  const { state, startGame, placeBid, setTrump, revealTrump, playCard } = useTwentyNine();
  const prevTrickWinner = useRef<PlayerPosition | null>(null);

  // Play sound when trick is won
  useEffect(() => {
    if (state.currentTrick.winner && !prevTrickWinner.current) {
      playTrickWinSound();
    }
    prevTrickWinner.current = state.currentTrick.winner;
  }, [state.currentTrick.winner]);

  if (state.phase === 'lobby') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-black font-display text-primary drop-shadow-sm mb-4">
            ২৯ <span className="text-foreground">Twenty-Nine</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-md mx-auto">
            The classic South Asian trick-taking card game.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <button 
            onClick={() => startGame('ai')}
            className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-xl shadow-xl hover:scale-105 transition-all"
          >
            Play vs AI (Single Player)
          </button>
          <button 
            onClick={() => alert('Multiplayer coming soon!')}
            className="px-8 py-4 bg-secondary text-secondary-foreground rounded-2xl font-bold text-xl shadow-xl hover:scale-105 transition-all opacity-50 cursor-not-allowed"
          >
            Play with Friends (Multiplayer)
          </button>
        </div>
      </div>
    );
  }

  // Helper to render player hands (hidden for opponents, visible for self/myPosition)
  const renderHand = (pos: PlayerPosition, isVertical: boolean) => {
    const isMe = pos === state.myPosition;
    const hand = state.hands[pos];
    const isMyTurn = state.turn === pos && state.phase === 'playing';
    
    return (
      <div className={`flex ${isVertical ? 'flex-col -space-y-16 sm:-space-y-12' : '-space-x-8 sm:-space-x-12'} items-center justify-center`}>
        <AnimatePresence>
          {hand.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, scale: 0.5, y: isVertical ? 0 : 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0, y: -50 }}
              transition={{ delay: i * 0.1 }}
              className="z-10"
              style={{ zIndex: i }}
            >
              <CardUI 
                card={card} 
                isHidden={!isMe} 
                isPlayable={isMe && isMyTurn}
                onClick={() => {
                  if (state.phase === 'playing' && isMe && isMyTurn) {
                    playCardSound();
                    playCard(pos, card);
                  } else if (state.phase === 'dealing_2' && state.activeBidder === pos) {
                    playCardSound();
                    setTrump(card);
                  }
                }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  };

  const renderPlayerBadge = (pos: PlayerPosition) => {
    const player = state.players[pos];
    const isTurn = state.turn === pos && state.phase === 'playing';
    const isBidder = state.activeBidder === pos && state.phase === 'bidding';
    
    return (
      <div className={`flex flex-col items-center justify-center z-20 transition-all duration-300 ${isTurn || isBidder ? 'scale-110' : ''}`}>
        <div className="bg-white/80 backdrop-blur-sm px-3 py-0.5 rounded-t-md text-[10px] sm:text-xs font-bold text-black border-b border-black/10">
          {player.name}
        </div>
        <div className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-300 border-2 flex items-center justify-center overflow-hidden shadow-lg ${isTurn || isBidder ? 'border-amber-400 ring-4 ring-amber-400/40 animate-pulse' : 'border-white/50'}`}>
          <User className="w-8 h-8 sm:w-10 sm:h-10 text-slate-500 mt-2" />
        </div>
        {state.phase === 'playing' && (
          <div className="bg-black/60 px-2 py-0.5 rounded-b-md text-[10px] font-bold text-white mt-[-2px] z-10">
            {state.tricksWon[pos].length} tricks
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative w-full h-[85vh] sm:h-[80vh] bg-[#3e2723] overflow-hidden flex flex-col justify-between items-center py-2 sm:py-8 font-sans">
      
      {/* Wooden Oval Table Background */}
      <div className="absolute top-10 sm:top-12 bottom-10 sm:bottom-12 left-2 right-2 sm:left-1/2 sm:-translate-x-1/2 sm:w-[600px] rounded-[100px] sm:rounded-[200px] bg-gradient-to-b from-[#8d6e63] via-[#795548] to-[#5d4037] shadow-[inset_0_0_40px_rgba(0,0,0,0.8),0_20px_50px_rgba(0,0,0,0.5)] border-[8px] border-[#4e342e] flex flex-col overflow-hidden">
        
        {/* Table Grain Texture (Subtle) */}
        <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(0,0,0,0.1)_2px,rgba(0,0,0,0.1)_4px)]" />

        {/* Top HUD / Scoreboard inside the table */}
        {(state.phase === 'playing' || state.phase === 'bidding' || state.phase === 'dealing_2') && (
          <div className="absolute top-8 sm:top-12 left-1/2 -translate-x-1/2 w-[80%] max-w-[300px] flex justify-between items-center px-4 py-2 text-white font-bold text-xs sm:text-sm z-10 opacity-90">
            <div className="text-center">
              <div className="text-white/70 mb-1">They</div>
              <div className="text-xl sm:text-2xl">{state.roundPoints.team2}</div>
            </div>
            <div className="text-center">
              <div className="text-white/70 mb-1">Trump</div>
              <div className="w-10 h-14 sm:w-12 sm:h-16 rounded border border-white/20 bg-white/10 flex items-center justify-center">
                 {state.trumpRevealed ? (
                   <span className={`text-2xl ${state.trumpSuit === 'hearts' || state.trumpSuit === 'diamonds' ? 'text-red-400' : 'text-slate-800'}`}>
                     {state.trumpSuit === 'hearts' && '♥'}
                     {state.trumpSuit === 'diamonds' && '♦'}
                     {state.trumpSuit === 'clubs' && '♣'}
                     {state.trumpSuit === 'spades' && '♠'}
                   </span>
                 ) : state.trumpSuit ? (
                   <span className="text-white/50 text-[10px]">Hidden</span>
                 ) : (
                   <span className="text-white/20 text-[10px]">-</span>
                 )}
              </div>
            </div>
            <div className="text-center">
              <div className="text-white/70 mb-1">We</div>
              <div className="text-xl sm:text-2xl">{state.roundPoints.team1}</div>
            </div>
          </div>
        )}

      {/* Top Player */}
      <div className="flex flex-col items-center z-20 absolute top-2 sm:top-4 w-full">
        {renderPlayerBadge('top')}
        <div className="mt-2 scale-75 sm:scale-100">
          {renderHand('top', false)}
        </div>
      </div>

      {/* Center Area (Left / Tricks / Right) */}
      <div className="flex justify-between items-center w-full flex-1 my-2 sm:my-4 z-10 px-2 sm:px-12 relative h-full">
        
        {/* Left Player */}
        <div className="flex flex-row items-center justify-start absolute left-0 top-1/2 -translate-y-1/2 z-20">
          {renderPlayerBadge('left')}
          <div className="-ml-4 scale-75 sm:scale-100 opacity-80 sm:opacity-100">
            {renderHand('left', true)}
          </div>
        </div>

        {/* The Trick Table & Game Info Center */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[320px] sm:max-w-[400px] h-64 sm:h-80 flex items-center justify-center z-30">
          
          {/* Phase Overlays */}
          {state.phase === 'bidding' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center w-full max-w-[280px] sm:max-w-[320px] mx-auto bg-[#8d6e63]/90 border-[4px] border-[#5d4037] rounded-xl shadow-2xl p-2 z-50">
              <div className="grid grid-cols-4 gap-1 sm:gap-2 w-full">
                {[16,17,18,19,20,21,22,23,24,25,26,27].map(bid => (
                  <button 
                    key={bid}
                    disabled={bid <= state.currentBid}
                    onClick={() => placeBid(bid)}
                    className="aspect-square bg-[#795548] text-white text-lg sm:text-xl font-bold rounded shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),0_4px_8px_rgba(0,0,0,0.5)] disabled:opacity-30 disabled:shadow-none hover:bg-[#8d6e63] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center"
                  >
                    {bid}
                  </button>
                ))}
                <button 
                  disabled={28 <= state.currentBid}
                  onClick={() => placeBid(28)}
                  className="aspect-square bg-[#795548] text-white text-lg sm:text-xl font-bold rounded shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),0_4px_8px_rgba(0,0,0,0.5)] disabled:opacity-30 hover:bg-[#8d6e63] transition-all flex items-center justify-center"
                >
                  28
                </button>
                <button 
                  onClick={() => placeBid('pass')} 
                  className="col-span-3 bg-[#795548] text-white text-lg sm:text-xl font-bold rounded shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),0_4px_8px_rgba(0,0,0,0.5)] hover:bg-[#8d6e63] active:translate-y-1 transition-all"
                >
                  Pass
                </button>
              </div>
            </div>
          )}

          {state.phase === 'dealing_2' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center w-full max-w-[280px] bg-[#8d6e63]/95 border-[4px] border-[#5d4037] rounded-xl shadow-2xl p-6 text-center text-white z-50">
              <h3 className="font-bold text-xl sm:text-2xl mb-4 drop-shadow-md">
                {state.players[state.bidWinner!].name} Won Bid ({state.currentBid})
              </h3>
              {state.activeBidder === state.myPosition ? (
                <p className="text-sm sm:text-base opacity-90">Click a card from your hand below to hide it as the Trump card.</p>
              ) : (
                <p className="text-sm sm:text-base animate-pulse">Waiting for them to set Trump...</p>
              )}
            </div>
          )}

          {/* Played Cards in Trick */}
          <AnimatePresence>
            {state.currentTrick.cards.top && (
              <motion.div initial={{ y: -50, opacity: 0, rotate: 0 }} animate={{ y: 0, opacity: 1, rotate: 5 }} className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2">
                <CardUI card={state.currentTrick.cards.top} className="scale-[0.6] sm:scale-75 shadow-2xl" />
              </motion.div>
            )}
            {state.currentTrick.cards.bottom && (
              <motion.div initial={{ y: 50, opacity: 0, rotate: 0 }} animate={{ y: 0, opacity: 1, rotate: -5 }} className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2">
                <CardUI card={state.currentTrick.cards.bottom} className="scale-[0.6] sm:scale-75 shadow-2xl z-10" />
              </motion.div>
            )}
            {state.currentTrick.cards.left && (
              <motion.div initial={{ x: -50, opacity: 0, rotate: 90 }} animate={{ x: 0, opacity: 1, rotate: 80 }} className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2">
                <CardUI card={state.currentTrick.cards.left} className="scale-[0.6] sm:scale-75 shadow-2xl" />
              </motion.div>
            )}
            {state.currentTrick.cards.right && (
              <motion.div initial={{ x: 50, opacity: 0, rotate: -90 }} animate={{ x: 0, opacity: 1, rotate: -100 }} className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2">
                <CardUI card={state.currentTrick.cards.right} className="scale-[0.6] sm:scale-75 shadow-2xl" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Trump Status Indicator (Only show Ask Trump button, as HUD is at the top now) */}
          {state.phase === 'playing' && !state.trumpRevealed && state.turn === state.myPosition && (
            <div className="absolute bottom-[-30px] left-1/2 -translate-x-1/2 bg-[#5d4037]/90 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg border border-[#8d6e63]">
              <button 
                onClick={revealTrump}
                className="hover:text-amber-200 transition-colors"
              >
                Reveal Trump
              </button>
            </div>
          )}
        </div>

        {/* Right Player */}
        <div className="flex flex-row items-center justify-end absolute right-0 top-1/2 -translate-y-1/2 z-20">
          <div className="-mr-4 scale-75 sm:scale-100 opacity-80 sm:opacity-100 z-0">
            {renderHand('right', true)}
          </div>
          {renderPlayerBadge('right')}
        </div>

      </div>
      
      {/* Table bottom rim finish */}
      </div>

      {/* Bottom Player (Self) */}
      <div className="flex flex-col items-center z-20 absolute bottom-2 sm:bottom-4 w-full">
        <div className="mb-2 scale-[0.85] sm:scale-100">
          {renderHand('bottom', false)}
        </div>
        {renderPlayerBadge('bottom')}
      </div>

      {/* Round Over Overlay */}
      {state.phase === 'round_over' && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center text-white p-8 text-center rounded-3xl">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
            <h2 className="text-4xl md:text-6xl font-black mb-2 text-primary drop-shadow-lg">Round Over!</h2>
            
            <div className="mb-8 p-4 bg-white/5 rounded-2xl border border-white/10 w-full max-w-md">
              <h3 className="text-xl font-bold text-muted-foreground mb-4">Bid Winner: {state.players[state.bidWinner!].name} ({state.currentBid})</h3>
              <div className="flex justify-between gap-4">
                <div className="flex-1 bg-gradient-to-br from-green-600/40 to-emerald-900/40 p-4 rounded-xl border border-green-500/30 shadow-inner">
                  <h3 className="text-sm font-bold text-green-200 mb-1">Team 1</h3>
                  <p className="text-xs text-green-100/50 mb-2">(You & AI Partner)</p>
                  <p className="text-4xl font-black text-white">{state.scores.team1}</p>
                  <p className="text-xs mt-2 text-green-300">Round Pts: {state.roundPoints.team1}</p>
                </div>
                <div className="flex-1 bg-gradient-to-br from-red-600/40 to-rose-900/40 p-4 rounded-xl border border-red-500/30 shadow-inner">
                  <h3 className="text-sm font-bold text-red-200 mb-1">Team 2</h3>
                  <p className="text-xs text-red-100/50 mb-2">(Left & Right)</p>
                  <p className="text-4xl font-black text-white">{state.scores.team2}</p>
                  <p className="text-xs mt-2 text-red-300">Round Pts: {state.roundPoints.team2}</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => startGame(state.mode!)} 
              className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-bold text-xl shadow-[0_0_40px_rgba(var(--primary),0.4)] hover:scale-105 hover:shadow-[0_0_60px_rgba(var(--primary),0.6)] transition-all"
            >
              Start Next Round
            </button>
          </motion.div>
        </div>
      )}

    </div>
  );
};
