import React, { useEffect, useRef } from 'react';
import { useTwentyNine } from './useTwentyNine';
import { CardUI } from './CardUI';
import { PlayerPosition, Card } from './types';
import { motion, AnimatePresence } from 'framer-motion';

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
      <div className={`bg-card/90 backdrop-blur-md px-2 py-1 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl shadow-lg border-2 z-20 ${isTurn || isBidder ? 'border-primary ring-2 sm:ring-4 ring-primary/20 animate-pulse scale-105' : 'border-border'}`}>
        <div className="font-bold text-xs sm:text-sm truncate max-w-[80px] sm:max-w-none">{player.name}</div>
        <div className="text-[10px] sm:text-xs text-muted-foreground flex justify-between gap-1 sm:gap-4 mt-0.5 sm:mt-1">
          <span className="hidden sm:inline">{pos === 'bottom' || pos === 'top' ? 'Team 1' : 'Team 2'}</span>
          <span className="font-bold text-foreground">
            {state.tricksWon[pos].length} tricks
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-[85vh] sm:h-[80vh] bg-green-900 rounded-3xl shadow-inner border-[6px] sm:border-8 border-green-950 overflow-hidden flex flex-col justify-between p-2 sm:p-8">
      {/* Decorative center logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
        <div className="w-[40vw] h-[40vw] sm:w-[30vw] sm:h-[30vw] rounded-full border-4 sm:border-8 border-white flex items-center justify-center">
          <span className="text-[15vw] sm:text-[10vw] font-black text-white">29</span>
        </div>
      </div>

      {/* Top Player */}
      <div className="flex flex-col items-center gap-2 sm:gap-4">
        {renderPlayerBadge('top')}
        {renderHand('top', false)}
      </div>

      {/* Center Area (Left / Tricks / Right) */}
      <div className="flex justify-between items-center w-full flex-1 my-2 sm:my-4">
        
        {/* Left Player */}
        <div className="flex flex-row items-center gap-2 sm:gap-4 w-20 sm:w-32 justify-end">
          <div className="absolute left-2 sm:static z-20">
            {renderPlayerBadge('left')}
          </div>
          <div className="ml-8 sm:ml-0">
            {renderHand('left', true)}
          </div>
        </div>

        {/* The Trick Table & Game Info Center */}
        <div className="relative w-48 h-48 sm:w-80 sm:h-80 rounded-full border border-white/20 flex items-center justify-center bg-black/20 backdrop-blur-sm shadow-2xl z-10 shrink-0">
          
          {/* Phase Overlays */}
          {state.phase === 'bidding' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-full text-white z-20">
              <h3 className="font-bold text-lg text-primary">Bidding Phase</h3>
              <p className="text-sm opacity-80 mb-2">Current Bid: {state.currentBid}</p>
              
              {state.activeBidder === state.myPosition ? (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 sm:gap-2 p-2">
                  {[16,17,18,19,20,21,22,23,24,25,26,27,28,29].map(bid => (
                    <button 
                      key={bid}
                      disabled={bid <= state.currentBid}
                      onClick={() => placeBid(bid)}
                      className="px-1.5 py-1.5 sm:px-2 sm:py-1 bg-white text-black text-[10px] sm:text-xs font-bold rounded disabled:opacity-30 hover:scale-110 transition-transform"
                    >
                      {bid}
                    </button>
                  ))}
                  <button onClick={() => placeBid('pass')} className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded col-span-4 sm:col-span-5 hover:bg-red-600 transition-colors">Pass</button>
                </div>
              ) : (
                <p className="text-xs animate-pulse">Waiting for {state.players[state.activeBidder].name}...</p>
              )}
            </div>
          )}

          {state.phase === 'dealing_2' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-full text-white z-20 p-4 text-center">
              <h3 className="font-bold text-lg text-primary mb-2">Set Trump</h3>
              {state.activeBidder === state.myPosition ? (
                <p className="text-sm">Click a card from your hand to hide it as the Trump card.</p>
              ) : (
                <p className="text-sm animate-pulse">Waiting for {state.players[state.activeBidder].name} to set Trump...</p>
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

          {/* Trump Status Indicator */}
          {state.phase === 'playing' && (
            <div className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-1 rounded-full text-xs font-bold flex items-center gap-2">
              Trump: 
              {state.trumpRevealed ? (
                <span className={`text-lg ${state.trumpSuit === 'hearts' || state.trumpSuit === 'diamonds' ? 'text-red-400' : 'text-blue-200'}`}>
                  {state.trumpSuit === 'hearts' && '♥'}
                  {state.trumpSuit === 'diamonds' && '♦'}
                  {state.trumpSuit === 'clubs' && '♣'}
                  {state.trumpSuit === 'spades' && '♠'}
                </span>
              ) : (
                <span>Hidden (By {state.players[state.bidWinner!].name})</span>
              )}

              {!state.trumpRevealed && state.turn === state.myPosition && (
                <button 
                  onClick={revealTrump}
                  className="ml-2 px-2 py-0.5 bg-primary rounded text-black hover:bg-primary/80"
                >
                  Ask Trump
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Player */}
        <div className="flex flex-row items-center gap-2 sm:gap-4 w-20 sm:w-32 justify-start flex-row-reverse">
          <div className="absolute right-2 sm:static z-20">
            {renderPlayerBadge('right')}
          </div>
          <div className="mr-8 sm:mr-0">
            {renderHand('right', true)}
          </div>
        </div>

      </div>

      {/* Bottom Player (Self) */}
      <div className="flex flex-col items-center gap-2 sm:gap-4">
        {renderHand('bottom', false)}
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
