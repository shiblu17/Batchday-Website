import React, { useState, useEffect, useRef } from 'react';
import { useTwentyNine } from './useTwentyNine';
import { CardUI } from './CardUI';
import { PlayerPosition } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { playCardSwoosh, playDealSound, playTrickWinSound } from './audio';

export const TwentyNineBoard: React.FC = () => {
  const { state, startGame, placeBid, setTrump, revealTrump, playCard, updateSettings, handleDoubleDecision, handleRedoubleDecision, handleSingleHandDecision } = useTwentyNine();
  const prevTrickWinner = useRef<PlayerPosition | null>(null);

  // Play sound when trick is won
  useEffect(() => {
    if (state.currentTrick.winner && !prevTrickWinner.current) {
      playTrickWinSound();
    }
    prevTrickWinner.current = state.currentTrick.winner;
  }, [state.currentTrick.winner]);

  // Deal sounds
  const prevPhase = useRef<string | null>(null);
  useEffect(() => {
    if ((state.phase === 'dealing_1' || state.phase === 'dealing_2') && prevPhase.current !== state.phase) {
      playDealSound();
    }
    prevPhase.current = state.phase;
  }, [state.phase]);

  // Card play sounds
  const prevTrickCards = useRef<number>(0);
  useEffect(() => {
    const currentCardsCount = Object.values(state.currentTrick.cards).filter(c => c !== null).length;
    if (currentCardsCount > prevTrickCards.current) {
      playCardSwoosh();
    }
    prevTrickCards.current = currentCardsCount;
  }, [state.currentTrick.cards]);

  const [showLastHand, setShowLastHand] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  if (state.phase === 'lobby') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-white">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-black font-display text-amber-500 drop-shadow-lg mb-4">
            ২৯ <span className="text-white">Twenty-Nine</span>
          </h1>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <button 
            onClick={() => startGame('ai')}
            className="px-8 py-4 bg-amber-600 text-white rounded-2xl font-bold text-xl shadow-xl hover:scale-105 transition-all"
          >
            Play vs AI
          </button>
        </div>
      </div>
    );
  }

  const renderCard = (card: any, pos: PlayerPosition, isPlayable: boolean, isHidden: boolean = false) => (
    <CardUI 
      card={card} 
      isHidden={isHidden} 
      isPlayable={isPlayable}
      onClick={() => {
        if (state.phase === 'playing' && isPlayable) {
          playCard(pos, card);
        }
      }}
    />
  );

  // Helper to determine if a player is currently active (bidding, selecting trump, or playing)
  const isPlayerActive = (pos: PlayerPosition) => {
    if (state.phase === 'lobby' || state.phase === 'game_over') return false;
    
    // In bidding, it's the active bidder's turn
    if (state.phase === 'bidding') return state.activeBidder === pos;
    if (state.phase === 'doubling_phase') return state.activeBidder === pos;
    if (state.phase === 'redoubling_phase') return state.activeBidder === pos;
    if (state.phase === 'single_hand_decision') return state.activeBidder === pos;
    
    // In setting trump phase, it's the active bidder's turn
    if (state.phase === 'set_trump') return state.activeBidder === pos;
    
    // In playing phase, it's the turn player
    if (state.phase === 'playing') return state.turn === pos;
    
    return false;
  };

  const isSittingOut = (pos: PlayerPosition) => {
    if (!state.isSingleHand) return false;
    const partnerMap: Record<PlayerPosition, PlayerPosition> = {
      bottom: 'top', top: 'bottom', left: 'right', right: 'left'
    };
    return state.bidWinner ? partnerMap[state.bidWinner] === pos : false;
  };

  // Render a thinking bubble if it's an AI's turn
  const renderThinking = (pos: PlayerPosition) => {
    if (isPlayerActive(pos) && state.players[pos].isAI) {
      const actionText = state.phase === 'bidding' ? 'Bidding...' : (state.phase === 'dealing_2' ? 'Choosing Trump...' : 'Thinking...');
      return (
        <div className="absolute -top-6 right-0 translate-x-1/2 bg-white text-black text-[10px] font-bold px-2 py-1 rounded-full shadow-lg border border-gray-200 animate-bounce flex gap-1 items-center z-50 whitespace-nowrap">
          <span>{actionText}</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative w-full h-full bg-[#2d1b11] overflow-hidden font-sans select-none flex justify-center text-white">
      
      {/* Game Message Toast */}
      <AnimatePresence>
        {state.gameMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className="absolute top-0 left-1/2 z-[100] px-6 py-3 bg-red-600/90 backdrop-blur-md text-white font-bold rounded-full shadow-[0_0_20px_rgba(220,38,38,0.5)] border border-red-400 text-sm md:text-base pointer-events-none text-center"
          >
            {state.gameMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top HUD */}
      <div className="absolute top-6 sm:top-8 w-full max-w-[500px] px-4 flex justify-between items-start text-[10px] sm:text-xs font-bold z-20 pointer-events-none">
        <div className="flex flex-col items-start gap-1">
          <div className="flex gap-2">
            <button className="w-8 h-8 rounded-full bg-gradient-to-b from-[#b5b31d] to-[#4c4a03] border-2 border-[#1a1a1a] shadow-[inset_0_2px_4px_rgba(255,255,255,0.5)] flex items-center justify-center text-lg pointer-events-auto active:scale-95">
              «
            </button>
            <button 
              onClick={() => setShowSettings(true)}
              className="w-8 h-8 rounded-full bg-gradient-to-b from-[#b5b31d] to-[#4c4a03] border-2 border-[#1a1a1a] shadow-[inset_0_2px_4px_rgba(255,255,255,0.5)] flex items-center justify-center text-lg pointer-events-auto active:scale-95"
            >
              ⚙
            </button>
          </div>
          {state.isSingleHand ? (
            <div className="mt-2 text-amber-300 font-bold whitespace-nowrap bg-black/40 px-2 py-1 rounded">
              {state.bidWinner ? state.players[state.bidWinner].name : '-'} is playing Single Hand
            </div>
          ) : (
            <>
              <div className="mt-2 text-white/90">Trump Player</div>
              <div className="text-white/90">
                {state.bidWinner ? state.players[state.bidWinner].name : '-'} {state.currentBid > 15 ? `- ${state.currentBid}` : ''}
              </div>
              {state.bidWinner === 'bottom' && state.trumpSuit && !state.trumpRevealed && (
                <div className="text-amber-400 font-bold mt-1 bg-black/40 px-2 py-0.5 rounded border border-amber-400/30">
                  Trump: {state.trumpSuit === 'hearts' ? '♥' : state.trumpSuit === 'diamonds' ? '♦' : state.trumpSuit === 'clubs' ? '♣' : '♠'}
                </div>
              )}
            </>
          )}
          <button 
            onClick={() => {
              if (state.lastTrick) setShowLastHand(true);
            }}
            disabled={!state.lastTrick}
            className="mt-1 px-3 py-1 bg-gradient-to-b from-[#a0744e] to-[#734e30] border border-[#d6af84] rounded-sm shadow-md pointer-events-auto uppercase disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Last Hand
          </button>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-2">
             <button className="w-8 h-8 rounded-full bg-gradient-to-b from-[#b5b31d] to-[#4c4a03] border-2 border-[#1a1a1a] shadow-[inset_0_2px_4px_rgba(255,255,255,0.5)] flex items-center justify-center text-lg pointer-events-auto active:scale-95">
              💡
            </button>
          </div>
          <div className="mt-2 text-white/90 font-bold bg-black/40 px-3 py-2 rounded-md border border-white/10 flex flex-col gap-2 min-w-[120px]">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-300">Us:</span>
              <div className="flex gap-1 flex-wrap w-[60px] justify-end">
                {Array.from({ length: Math.abs(state.scores.team1) }).map((_, i) => (
                  <div key={i} className={`w-3 h-3 rounded-full border border-white/30 shadow-md ${state.scores.team1 > 0 ? 'bg-red-600' : 'bg-slate-900'}`} />
                ))}
                {state.scores.team1 === 0 && <span className="text-gray-500">-</span>}
              </div>
            </div>
            <div className="flex justify-between items-center text-xs border-b border-white/10 pb-1">
              <span className="text-gray-300">Them:</span>
              <div className="flex gap-1 flex-wrap w-[60px] justify-end">
                {Array.from({ length: Math.abs(state.scores.team2) }).map((_, i) => (
                  <div key={i} className={`w-3 h-3 rounded-full border border-white/30 shadow-md ${state.scores.team2 > 0 ? 'bg-red-600' : 'bg-slate-900'}`} />
                ))}
                {state.scores.team2 === 0 && <span className="text-gray-500">-</span>}
              </div>
            </div>
            <div className="text-amber-400 text-sm text-center pt-1">
              {state.isSingleHand 
                ? `Tricks: ${(state.bidWinner === 'bottom' || state.bidWinner === 'top') ? state.tricksWon.bottom.length + state.tricksWon.top.length : state.tricksWon.left.length + state.tricksWon.right.length}/8` 
                : `Cards: ${state.roundPoints.team1} - ${state.roundPoints.team2}`}
            </div>
          </div>
          <button className="mt-1 px-4 py-1 bg-gradient-to-b from-[#a0744e] to-[#734e30] border border-[#d6af84] rounded-sm shadow-md pointer-events-auto uppercase">
            Skip
          </button>
        </div>
      </div>

      {/* The 3D Table */}
      <div 
        className="absolute top-[48%] sm:top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-[420px] aspect-[8/9] sm:aspect-[4/5] shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex flex-col z-0 transition-colors duration-1000"
        style={state.settings.theme === 'green' ? {
          borderRadius: '50%',
          background: '#155227',
          backgroundImage: 'radial-gradient(circle, #207a3c 0%, #0d3618 100%)',
          boxShadow: 'inset 0 0 50px rgba(0,0,0,0.9), inset 0 0 0 6px #5c3a21, inset 0 0 0 10px #2a160a, inset 0 0 0 16px #4a2e15'
        } : { 
          borderRadius: '50%',
          background: '#854d27',
          backgroundImage: 'linear-gradient(90deg, transparent 50%, rgba(255,255,255,0.03) 50%), repeating-linear-gradient(90deg, #7c4521 0px, #7c4521 30px, #633618 30px, #633618 32px)',
          boxShadow: 'inset 0 0 50px rgba(0,0,0,0.9), inset 0 0 0 6px #d09a45, inset 0 0 0 10px #4a2e15, inset 0 0 0 16px #825a31'
        }}
      />

      {/* Avatars */}
      <div className="absolute top-[48%] sm:top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-[420px] aspect-[8/9] sm:aspect-[4/5] pointer-events-none z-30">
        {/* Top Avatar */}
        {!isSittingOut('top') && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            {renderThinking('top')}
            {state.trumpRevealed && state.trumpRevealer === 'top' && (
               <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute -top-6 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-xl border border-red-400 whitespace-nowrap z-50">
                 Declared Trump!
               </motion.div>
            )}
            <div className="bg-white/90 px-2 py-0.5 rounded-sm text-[10px] font-bold text-black mb-1 shadow">
              {state.players['top'].name}
            </div>
            <div className={`w-12 h-12 bg-[#e0d6c8] rounded-full border-[3px] overflow-hidden shadow-lg flex items-end justify-center transition-all duration-300 ${isPlayerActive('top') ? 'border-amber-400 ring-4 ring-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.6)]' : 'border-[#4a2e15]'}`}>
               <div className="w-8 h-8 bg-slate-500 rounded-full mb-[-8px]" />
            </div>
          </div>
        )}
      </div>

      {/* Left Avatar (Screen Relative to prevent clipping but keep on sides) */}
      {!isSittingOut('left') && (
        <div className="absolute top-[48%] sm:top-1/2 left-2 sm:left-4 -translate-y-1/2 flex flex-col items-center z-30 pointer-events-auto">
          {renderThinking('left')}
          {state.trumpRevealed && state.trumpRevealer === 'left' && (
             <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute -top-6 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-xl border border-red-400 whitespace-nowrap z-50">
               Declared Trump!
             </motion.div>
          )}
          <div className="bg-white/90 px-2 py-0.5 rounded-sm text-[10px] font-bold text-black mb-1 shadow whitespace-nowrap">
            {state.players['left'].name}
          </div>
          <div className={`w-12 h-12 bg-[#e0d6c8] rounded-full border-[3px] overflow-hidden shadow-lg flex items-end justify-center transition-all duration-300 ${isPlayerActive('left') ? 'border-amber-400 ring-4 ring-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.6)]' : 'border-[#4a2e15]'}`}>
             <div className="w-8 h-8 bg-slate-500 rounded-full mb-[-8px]" />
          </div>
        </div>
      )}

      {/* Right Avatar (Screen Relative) */}
      {!isSittingOut('right') && (
        <div className="absolute top-[48%] sm:top-1/2 right-2 sm:right-4 -translate-y-1/2 flex flex-col items-center z-30 pointer-events-auto">
          {renderThinking('right')}
          {state.trumpRevealed && state.trumpRevealer === 'right' && (
             <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute -top-6 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-xl border border-red-400 whitespace-nowrap z-50">
               Declared Trump!
             </motion.div>
          )}
          <div className="bg-white/90 px-2 py-0.5 rounded-sm text-[10px] font-bold text-black mb-1 shadow whitespace-nowrap">
            {state.players['right'].name}
          </div>
          <div className={`w-12 h-12 bg-[#e0d6c8] rounded-full border-[3px] overflow-hidden shadow-lg flex items-end justify-center transition-all duration-300 ${isPlayerActive('right') ? 'border-amber-400 ring-4 ring-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.6)]' : 'border-[#4a2e15]'}`}>
             <div className="w-8 h-8 bg-slate-500 rounded-full mb-[-8px]" />
          </div>
        </div>
      )}

      {/* Internal Table Elements */}
      <div className="absolute top-[48%] sm:top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-[420px] aspect-[8/9] sm:aspect-[4/5] pointer-events-none z-10">
        
        {/* Top Trick / Status Cards */}
        <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[60%] flex justify-between items-start">
          <div className="flex flex-col items-center">
            <span className="text-white text-xs font-bold mb-1 shadow-black drop-shadow-md">They</span>
            <div className="relative w-10 h-14">
              {/* Bottom Card (The 6) */}
              <div className="absolute inset-0 bg-white rounded shadow-sm border border-gray-300 flex flex-col justify-between p-1 overflow-hidden">
                <div className={`text-[9px] font-bold leading-none ${state.scores.team2 >= 0 ? 'text-red-600' : 'text-slate-900'}`}>
                  6<br/>{state.scores.team2 >= 0 ? '♥' : '♠'}
                </div>
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl opacity-20 ${state.scores.team2 >= 0 ? 'text-red-600' : 'text-slate-900'}`}>
                  {state.scores.team2 >= 0 ? '♥' : '♠'}
                </div>
                <div className={`text-[9px] font-bold leading-none rotate-180 ${state.scores.team2 >= 0 ? 'text-red-600' : 'text-slate-900'}`}>
                  6<br/>{state.scores.team2 >= 0 ? '♥' : '♠'}
                </div>
              </div>

              {/* Top Card (Card Back) */}
              <motion.div 
                animate={{ y: Math.abs(state.scores.team2) * 8 }} 
                transition={{ type: 'spring', damping: 15 }}
                className="absolute inset-0 bg-blue-800 rounded shadow-[0_2px_4px_rgba(0,0,0,0.5)] border border-white flex items-center justify-center overflow-hidden z-10"
              >
                <div className="w-[85%] h-[85%] border border-white/40 bg-[repeating-linear-gradient(45deg,transparent,transparent_3px,rgba(255,255,255,0.2)_3px,rgba(255,255,255,0.2)_6px)]" />
              </motion.div>

              {state.roundPoints.team2 > 0 && (
                <div className="absolute inset-x-0 -bottom-8 flex justify-center pointer-events-none z-20">
                  <div className="bg-black/80 rounded-full w-6 h-6 flex items-center justify-center text-amber-400 font-bold text-[11px] shadow-lg border border-white/20">
                    {state.roundPoints.team2}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {!state.isSingleHand && (
            <div className="flex flex-col items-center -mt-4 relative">
              <span className="text-white text-xs font-bold mb-1 shadow-black drop-shadow-md">Trump</span>
              
              {state.trumpRevealed && state.hiddenTrumpCard ? (
                <motion.div initial={{ rotateY: 180 }} animate={{ rotateY: 0 }} transition={{ duration: 0.6 }} className="scale-75 origin-top">
                  <CardUI card={state.hiddenTrumpCard} />
                </motion.div>
              ) : state.trumpSuit ? (
                <div className="w-10 h-14 bg-red-700 rounded border-2 border-white/80 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center">
                   <span className="text-white font-bold">?</span>
                </div>
              ) : (
                <div className="w-10 h-14 bg-white/5 rounded border border-white/20 border-dashed" />
              )}
            </div>
          )}

          <div className="flex flex-col items-center">
            <span className="text-white text-xs font-bold mb-1 shadow-black drop-shadow-md">We</span>
            <div className="relative w-10 h-14">
              {/* Bottom Card (The 6) */}
              <div className="absolute inset-0 bg-white rounded shadow-sm border border-gray-300 flex flex-col justify-between p-1 overflow-hidden">
                <div className={`text-[9px] font-bold leading-none ${state.scores.team1 >= 0 ? 'text-red-600' : 'text-slate-900'}`}>
                  6<br/>{state.scores.team1 >= 0 ? '♥' : '♠'}
                </div>
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl opacity-20 ${state.scores.team1 >= 0 ? 'text-red-600' : 'text-slate-900'}`}>
                  {state.scores.team1 >= 0 ? '♥' : '♠'}
                </div>
                <div className={`text-[9px] font-bold leading-none rotate-180 ${state.scores.team1 >= 0 ? 'text-red-600' : 'text-slate-900'}`}>
                  6<br/>{state.scores.team1 >= 0 ? '♥' : '♠'}
                </div>
              </div>

              {/* Top Card (Card Back) */}
              <motion.div 
                animate={{ y: Math.abs(state.scores.team1) * 8 }} 
                transition={{ type: 'spring', damping: 15 }}
                className="absolute inset-0 bg-blue-800 rounded shadow-[0_2px_4px_rgba(0,0,0,0.5)] border border-white flex items-center justify-center overflow-hidden z-10"
              >
                <div className="w-[85%] h-[85%] border border-white/40 bg-[repeating-linear-gradient(45deg,transparent,transparent_3px,rgba(255,255,255,0.2)_3px,rgba(255,255,255,0.2)_6px)]" />
              </motion.div>

              {state.roundPoints.team1 > 0 && (
                <div className="absolute inset-x-0 -bottom-8 flex justify-center pointer-events-none z-20">
                  <div className="bg-black/80 rounded-full w-6 h-6 flex items-center justify-center text-amber-400 font-bold text-[11px] shadow-lg border border-white/20">
                    {state.roundPoints.team1}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center Played Cards */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
          <AnimatePresence>
            {state.currentTrick.cards.top && (
              <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute top-[35%] left-1/2 -translate-x-1/2 z-10 scale-[0.65]">
                <CardUI card={state.currentTrick.cards.top} />
              </motion.div>
            )}
            {state.currentTrick.cards.left && (
              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="absolute top-[45%] left-[25%] -translate-x-1/2 z-20 scale-[0.65]">
                <CardUI card={state.currentTrick.cards.left} />
              </motion.div>
            )}
            {state.currentTrick.cards.right && (
              <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="absolute top-[45%] right-[25%] translate-x-1/2 z-20 scale-[0.65]">
                <CardUI card={state.currentTrick.cards.right} />
              </motion.div>
            )}
            {state.currentTrick.cards.bottom && (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute bottom-[25%] left-1/2 -translate-x-1/2 z-30 scale-[0.65]">
                <CardUI card={state.currentTrick.cards.bottom} />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Turn Indicator */}
          {state.phase === 'playing' && state.turn === 'bottom' && (
             <div className="absolute bottom-[18%] left-1/2 -translate-x-1/2 text-white font-bold text-sm tracking-wide shadow-black drop-shadow-md animate-pulse">
               Your Turn
             </div>
          )}
        </div>

        {/* Trump Reveal Button */}
        {state.phase === 'playing' && 
         !state.trumpRevealed && 
         state.turn === 'bottom' && 
         state.currentTrick.leadSuit !== null &&
         !state.hands['bottom'].some(c => c.suit === state.currentTrick.leadSuit) && (
          <div className="absolute top-[60%] sm:top-[65%] left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
             <button 
               onClick={revealTrump}
               className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-800 text-white font-bold rounded-full shadow-lg border-2 border-red-400 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 animate-pulse"
             >
               <span>👁️</span> Show Trump
             </button>
          </div>
        )}
        
      </div>

      {/* Bidding Grid (Transparent, tightly packed) */}
      {state.phase === 'bidding' && state.activeBidder === 'bottom' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-auto w-[90%] max-w-[320px]">
          <div className="bg-[#3a2010] p-[4px] rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.8)] border-2 border-[#52321c]">
            <div className="grid grid-cols-4 gap-[2px] mb-[2px]">
              {[16,17,18,19,20,21,22,23,24,25,26,27].map(bid => {
                const isDefender = state.activeBidder === state.duelDefender;
                const disabled = isDefender ? bid < state.currentBid : bid <= state.currentBid;
                return (
                  <button 
                    key={bid}
                    disabled={disabled}
                    onClick={() => placeBid(bid)}
                    className="h-10 sm:h-12 bg-gradient-to-b from-[#a26842] to-[#734324] text-white text-base sm:text-lg font-bold shadow-[inset_0_2px_2px_rgba(255,255,255,0.2),0_2px_4px_rgba(0,0,0,0.5)] disabled:opacity-40 hover:brightness-110 active:translate-y-px transition-all rounded-sm flex items-center justify-center"
                  >
                    {bid}
                  </button>
                );
              })}
              <button 
                disabled={state.activeBidder === state.duelDefender ? 28 < state.currentBid : 28 <= state.currentBid}
                onClick={() => placeBid(28)}
                className="h-10 sm:h-12 bg-gradient-to-b from-[#a26842] to-[#734324] text-white text-base sm:text-lg font-bold shadow-[inset_0_2px_2px_rgba(255,255,255,0.2),0_2px_4px_rgba(0,0,0,0.5)] disabled:opacity-40 hover:brightness-110 active:translate-y-px transition-all rounded-sm rounded-bl-md flex items-center justify-center"
              >
                28
              </button>
              <button 
                onClick={() => placeBid('pass')} 
                className="col-span-3 h-10 sm:h-12 bg-gradient-to-b from-[#a26842] to-[#734324] text-white text-base sm:text-lg font-bold shadow-[inset_0_2px_2px_rgba(255,255,255,0.2),0_2px_4px_rgba(0,0,0,0.5)] hover:brightness-110 active:translate-y-px transition-all rounded-sm rounded-br-md flex items-center justify-center"
              >
                Pass
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Doubling Phase UI */}
      {state.phase === 'doubling_phase' && state.activeBidder === 'bottom' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-auto w-[90%] max-w-[320px]">
          <div className="bg-[#3a2010] p-4 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.8)] border-2 border-[#52321c] flex flex-col items-center text-center">
            <h3 className="text-amber-400 font-bold mb-4 text-lg">Opponent bid {state.currentBid}. Double the game?</h3>
            <div className="flex gap-4 w-full">
              <button onClick={() => handleDoubleDecision('double')} className="flex-1 h-12 bg-gradient-to-b from-[#2a5a3a] to-[#13331c] text-white font-bold rounded shadow-lg hover:brightness-110 active:scale-95 transition-all">DOUBLE</button>
              <button onClick={() => handleDoubleDecision('cancel')} className="flex-1 h-12 bg-[#52321c] text-white font-bold rounded shadow-lg hover:brightness-110 active:scale-95 transition-all">Pass</button>
            </div>
          </div>
        </div>
      )}

      {state.phase === 'doubling_phase' && state.activeBidder !== 'bottom' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 flex flex-col items-center text-center">
          <div className="text-white text-lg font-bold bg-black/60 px-6 py-2 rounded-full animate-pulse border border-white/20">
            Waiting for {state.players[state.activeBidder].name} to Double or Pass...
          </div>
        </div>
      )}

      {/* Redoubling Phase UI */}
      {state.phase === 'redoubling_phase' && state.activeBidder === 'bottom' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-auto w-[90%] max-w-[320px]">
          <div className="bg-[#4a1313] p-4 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.8)] border-2 border-[#ff4444] flex flex-col items-center text-center">
            <h3 className="text-[#ff8888] font-bold mb-4 text-lg">Opponent Doubled! Redouble?</h3>
            <div className="flex gap-4 w-full">
              <button onClick={() => handleRedoubleDecision('redouble')} className="flex-1 h-12 bg-gradient-to-b from-[#8a2a2a] to-[#4a1313] text-white font-bold rounded shadow-lg hover:brightness-110 active:scale-95 transition-all border border-[#ff4444]">REDOUBLE</button>
              <button onClick={() => handleRedoubleDecision('cancel')} className="flex-1 h-12 bg-[#52321c] text-white font-bold rounded shadow-lg hover:brightness-110 active:scale-95 transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {state.phase === 'redoubling_phase' && state.activeBidder !== 'bottom' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 flex flex-col items-center text-center">
          <div className="text-white text-lg font-bold bg-black/60 px-6 py-2 rounded-full animate-pulse border border-[#ff4444]/40">
            Waiting for {state.players[state.activeBidder].name} to Redouble or Cancel...
          </div>
        </div>
      )}

      {/* Single Hand Decision UI */}
      {state.phase === 'single_hand_decision' && state.activeBidder === 'bottom' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-auto w-[90%] max-w-[320px]">
          <div className="bg-[#3a2010] p-4 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.8)] border-2 border-amber-500 flex flex-col items-center text-center">
            <h3 className="text-amber-400 font-bold mb-2 text-lg">Play Single Hand (29)?</h3>
            <p className="text-xs text-amber-200/70 mb-4 leading-tight">You must win all 8 tricks alone without Trump.</p>
            <div className="flex gap-4 w-full">
              <button onClick={() => handleSingleHandDecision('yes')} className="flex-1 h-12 bg-gradient-to-b from-[#8a5a2a] to-[#4a3313] text-white font-bold rounded shadow-lg hover:brightness-110 active:scale-95 transition-all border border-amber-600">PLAY ALONE</button>
              <button onClick={() => handleSingleHandDecision('no')} className="flex-1 h-12 bg-[#52321c] text-white font-bold rounded shadow-lg hover:brightness-110 active:scale-95 transition-all">Play Normal</button>
            </div>
          </div>
        </div>
      )}

      {state.phase === 'single_hand_decision' && state.activeBidder !== 'bottom' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 flex flex-col items-center text-center">
          <div className="text-white text-lg font-bold bg-black/60 px-6 py-2 rounded-full animate-pulse border border-amber-500/30">
            Waiting for {state.players[state.activeBidder].name} to decide Single Hand...
          </div>
        </div>
      )}

      {/* Trump Selection Grid */}
      {state.phase === 'set_trump' && state.activeBidder === 'bottom' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-auto w-[90%] max-w-[340px]">
          <div className="bg-[#3a2010] p-4 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.8)] border-2 border-[#52321c] flex flex-col items-center">
            <h3 className="text-amber-400 font-bold mb-4 text-center text-lg drop-shadow-md">Select Trump Suit</h3>
            <div className="flex gap-3 justify-center w-full mb-5">
              {(['spades', 'hearts', 'diamonds', 'clubs'] as Suit[]).map(suit => (
                <div 
                  key={suit} 
                  className="w-[60px] sm:w-[70px] hover:-translate-y-2 hover:scale-105 transition-all cursor-pointer shadow-lg" 
                  onClick={() => setTrump({ id: `dummy_${suit}`, suit, rank: '2', value: 0 })}
                >
                  <CardUI card={{ id: `dummy_${suit}`, suit, rank: '2', value: 0 }} isHidden={false} isPlayable={true} />
                </div>
              ))}
            </div>
            
            <div className="w-full flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#8a5a3a] to-transparent"></div>
              <span className="text-[#cba388] text-xs font-bold uppercase tracking-widest">OR</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#8a5a3a] to-transparent"></div>
            </div>

            <button 
              onClick={() => setTrump('7th_card')}
              className="w-full h-12 bg-gradient-to-b from-[#8a3a3a] to-[#5c2020] text-amber-100 text-sm sm:text-base font-bold shadow-[inset_0_2px_2px_rgba(255,255,255,0.2),0_4px_8px_rgba(0,0,0,0.6)] hover:brightness-110 active:translate-y-px transition-all rounded-lg flex items-center justify-center gap-2 border border-[#a85050]"
            >
              <span className="text-xl">❓</span> 7th Card (Mystery)
            </button>
          </div>
        </div>
      )}

      {/* Waiting for other players to bid or set trump */}
      {state.phase === 'bidding' && state.activeBidder !== 'bottom' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none flex flex-col items-center">
          <div className="text-white text-lg font-bold shadow-black drop-shadow-md bg-black/40 px-6 py-2 rounded-full border border-white/10 backdrop-blur-sm animate-pulse text-center">
            Waiting for {state.players[state.activeBidder].name} to bid...
          </div>
          {state.currentBid > 15 && state.highestBidder && (
            <div className="text-amber-400 text-xl font-black mt-3 drop-shadow-lg shadow-black bg-black/60 px-6 py-2 rounded-lg border border-amber-500/30">
              Highest Bid: {state.currentBid} (by {state.players[state.highestBidder].name})
            </div>
          )}
        </div>
      )}

      {/* Waiting for other players to set trump */}
      {state.phase === 'set_trump' && state.activeBidder !== 'bottom' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none flex flex-col items-center text-center">
          <div className="text-white text-lg font-bold shadow-black drop-shadow-md bg-black/40 px-6 py-2 rounded-full border border-white/10 backdrop-blur-sm animate-pulse">
            Waiting for {state.players[state.activeBidder].name} to set Trump...
          </div>
        </div>
      )}

      {/* Bottom Player (Self) Hand - Pinned to bottom exactly like screenshot */}
      <div className="absolute bottom-4 sm:bottom-6 left-0 w-full z-40 bg-transparent flex flex-col justify-end items-center pointer-events-none">
        
        {/* Bottom Avatar positioned on top of the hand container */}
        <div className="flex flex-col items-center mb-2 pointer-events-auto relative">
          {isPlayerActive('bottom') && (
            <div className="absolute -top-6 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg border border-amber-600 animate-pulse z-50 whitespace-nowrap">
              {state.phase === 'bidding' ? 'Your Turn to Bid' : (state.phase === 'dealing_2' ? 'Set Trump' : 'Your Turn')}
            </div>
          )}
          <div className="bg-white/90 px-3 py-0.5 rounded-t-md text-[10px] font-bold text-black border-b border-black/20 shadow">
            You
          </div>
          <div className={`w-14 h-14 bg-[#e0d6c8] rounded-full border-[3px] overflow-hidden shadow-lg flex items-end justify-center transition-all duration-300 ${isPlayerActive('bottom') ? 'border-amber-400 ring-4 ring-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.6)]' : 'border-[#4a2e15]'}`}>
             <div className="w-10 h-10 bg-slate-500 rounded-full mb-[-12px]" />
          </div>
        </div>

        <div className="flex justify-center w-full max-w-[600px] pointer-events-auto px-2">
           {state.hands['bottom'].map((card, i) => {
             const isHiddenTrump = card.id === state.hiddenTrumpCard?.id && !state.trumpRevealed;
             
             // Check if the player has any playable cards of the lead suit
             const leadSuit = state.currentTrick.leadSuit;
             const hasLeadSuit = leadSuit ? state.hands['bottom'].some(c => 
               c.suit === leadSuit && !(c.id === state.hiddenTrumpCard?.id && !state.trumpRevealed)
             ) : false;
             
             // The card is valid if there's no lead suit, or the player doesn't have the lead suit, or the card matches the lead suit
             const isValidSuit = !leadSuit || !hasLeadSuit || card.suit === leadSuit;
             
             const isPlayable = state.turn === 'bottom' && state.phase === 'playing' && !isHiddenTrump && isValidSuit;
             return (
               <div key={card.id} className="w-[14vw] sm:w-[12vw] max-w-[70px] -ml-[6vw] sm:-ml-[3vw] md:-ml-6 first:ml-0 transform transition-transform hover:-translate-y-4 hover:z-50 cursor-pointer">
                 {renderCard(card, 'bottom', isPlayable, isHiddenTrump)}
               </div>
             );
           })}
        </div>
      </div>

      {/* Round Over Overlay */}
      {state.phase === 'round_over' && (
        <div className={`absolute inset-0 ${state.lastRoundResult?.team1Won ? 'bg-green-900/90' : 'bg-red-900/90'} backdrop-blur-md z-50 flex flex-col items-center justify-center text-white p-8 text-center pointer-events-auto transition-colors duration-1000`}>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
            <h2 className={`text-4xl md:text-6xl font-black mb-2 drop-shadow-lg ${state.lastRoundResult?.team1Won ? 'text-green-400' : 'text-red-400'}`}>
              {state.lastRoundResult?.team1Won ? 'You Won the Round!' : 'You Lost the Round!'}
            </h2>
            
            <div className="mb-8 p-4 bg-black/40 rounded-2xl border border-white/20 w-full max-w-md shadow-2xl backdrop-blur-lg mt-4">
              <h3 className="text-xl font-bold text-slate-300 mb-4">Bid Winner: {state.players[state.bidWinner!].name} ({state.currentBid})</h3>
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
              className="px-8 py-4 bg-amber-600 text-white rounded-full font-bold text-xl shadow-[0_0_40px_rgba(217,119,6,0.4)] hover:scale-105 hover:shadow-[0_0_60px_rgba(217,119,6,0.6)] transition-all pointer-events-auto cursor-pointer"
            >
              Start Next Round
            </button>
          </motion.div>
        </div>
      )}

      {/* Last Trick Modal */}
      <AnimatePresence>
        {showLastHand && state.lastTrick && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLastHand(false)}
            className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center pointer-events-auto p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#2d1b11] border-2 border-[#8b5a2b] rounded-2xl p-6 shadow-2xl max-w-md w-full"
            >
              <h2 className="text-2xl font-bold text-amber-500 mb-4 text-center font-display">Last Trick</h2>
              <div className="relative w-full aspect-square bg-[#1a0f0a] rounded-xl border border-[#4a2f1d] p-4">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
                  {state.lastTrick.cards['top'] && (
                    <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', damping: 15, delay: 0.1 }}>
                      <CardUI card={state.lastTrick.cards['top']} isPlayable={false} scale={0.8} />
                    </motion.div>
                  )}
                  <span className="text-xs text-center block mt-1 text-white/70">Top</span>
                </div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
                  {state.lastTrick.cards['bottom'] && (
                    <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', damping: 15, delay: 0.4 }}>
                      <CardUI card={state.lastTrick.cards['bottom']} isPlayable={false} scale={0.8} />
                    </motion.div>
                  )}
                  <span className="text-xs text-center block mt-1 text-white/70">You</span>
                </div>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                  {state.lastTrick.cards['left'] && (
                    <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', damping: 15, delay: 0.2 }}>
                      <CardUI card={state.lastTrick.cards['left']} isPlayable={false} scale={0.8} />
                    </motion.div>
                  )}
                  <span className="text-xs text-center block mt-1 text-white/70">Left</span>
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                  {state.lastTrick.cards['right'] && (
                    <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', damping: 15, delay: 0.3 }}>
                      <CardUI card={state.lastTrick.cards['right']} isPlayable={false} scale={0.8} />
                    </motion.div>
                  )}
                  <span className="text-xs text-center block mt-1 text-white/70">Right</span>
                </div>
              </div>
              <div className="mt-4 text-center">
                <p className="text-white/80">Winner: <strong className="text-amber-400 capitalize">{state.lastTrick.winner === 'bottom' ? 'You' : state.lastTrick.winner}</strong></p>
                <p className="text-white/80">Points: <strong className="text-amber-400">{state.lastTrick.points}</strong></p>
              </div>
              <button
                onClick={() => setShowLastHand(false)}
                className="mt-6 w-full py-3 bg-[#8b5a2b] text-white rounded-xl font-bold hover:bg-[#a06b35] transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSettings(false)}
            className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center pointer-events-auto p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#2d1b11] border-2 border-[#8b5a2b] rounded-2xl p-6 shadow-2xl max-w-sm w-full"
            >
              <h2 className="text-2xl font-bold text-amber-500 mb-6 text-center font-display">Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">Game Speed</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateSettings('normal', state.settings.theme)}
                      className={`flex-1 py-2 rounded-lg font-bold border ${state.settings.speed === 'normal' ? 'bg-amber-600 border-amber-400 text-white' : 'bg-black/40 border-white/10 text-gray-400 hover:bg-black/60'}`}
                    >
                      Normal
                    </button>
                    <button 
                      onClick={() => updateSettings('fast', state.settings.theme)}
                      className={`flex-1 py-2 rounded-lg font-bold border ${state.settings.speed === 'fast' ? 'bg-amber-600 border-amber-400 text-white' : 'bg-black/40 border-white/10 text-gray-400 hover:bg-black/60'}`}
                    >
                      Fast
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">Table Theme</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateSettings(state.settings.speed, 'wooden')}
                      className={`flex-1 py-2 rounded-lg font-bold border ${state.settings.theme === 'wooden' ? 'bg-[#52321c] border-[#a26842] text-white' : 'bg-black/40 border-white/10 text-gray-400 hover:bg-black/60'}`}
                    >
                      Wooden
                    </button>
                    <button 
                      onClick={() => updateSettings(state.settings.speed, 'green')}
                      className={`flex-1 py-2 rounded-lg font-bold border ${state.settings.theme === 'green' ? 'bg-[#1e4a28] border-[#34a04d] text-white' : 'bg-black/40 border-white/10 text-gray-400 hover:bg-black/60'}`}
                    >
                      Casino Green
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowSettings(false)}
                className="mt-8 w-full py-3 bg-[#8b5a2b] text-white rounded-xl font-bold hover:bg-[#a06b35] transition-colors"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
