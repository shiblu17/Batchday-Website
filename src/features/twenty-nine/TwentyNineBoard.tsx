import React from 'react';
import { useTwentyNine } from './useTwentyNine';
import { CardUI } from './CardUI';
import { PlayerPosition, Card } from './types';
import { motion, AnimatePresence } from 'framer-motion';

export const TwentyNineBoard: React.FC = () => {
  const { state, startGame, placeBid, setTrump, revealTrump, playCard } = useTwentyNine();

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
      <div className={`flex ${isVertical ? 'flex-col -space-y-12' : '-space-x-12'} items-center justify-center`}>
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
                    playCard(pos, card);
                  } else if (state.phase === 'dealing_2' && state.activeBidder === pos) {
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
      <div className={`bg-card/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border-2 ${isTurn || isBidder ? 'border-primary ring-4 ring-primary/20 animate-pulse' : 'border-border'}`}>
        <div className="font-bold text-sm">{player.name}</div>
        <div className="text-xs text-muted-foreground flex justify-between gap-4 mt-1">
          <span>{pos === 'bottom' || pos === 'top' ? 'Team 1' : 'Team 2'}</span>
          <span className="font-bold text-foreground">
            {state.tricksWon[pos].length} tricks
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-[80vh] bg-green-900 rounded-3xl shadow-inner border-8 border-green-950 overflow-hidden flex flex-col justify-between p-4 sm:p-8">
      {/* Decorative center logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
        <div className="w-[30vw] h-[30vw] rounded-full border-8 border-white flex items-center justify-center">
          <span className="text-[10vw] font-black text-white">29</span>
        </div>
      </div>

      {/* Top Player */}
      <div className="flex flex-col items-center gap-4">
        {renderPlayerBadge('top')}
        {renderHand('top', false)}
      </div>

      {/* Center Area (Left / Tricks / Right) */}
      <div className="flex justify-between items-center w-full flex-1 my-4">
        
        {/* Left Player */}
        <div className="flex flex-row items-center gap-4 w-32 justify-end">
          {renderPlayerBadge('left')}
          {renderHand('left', true)}
        </div>

        {/* The Trick Table & Game Info Center */}
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full border border-white/20 flex items-center justify-center bg-black/20 backdrop-blur-sm shadow-2xl">
          
          {/* Phase Overlays */}
          {state.phase === 'bidding' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-full text-white z-20">
              <h3 className="font-bold text-lg text-primary">Bidding Phase</h3>
              <p className="text-sm opacity-80 mb-2">Current Bid: {state.currentBid}</p>
              
              {state.activeBidder === state.myPosition ? (
                <div className="grid grid-cols-3 gap-2 p-2">
                  {[16,17,18,19,20,21,22,23,24,25,26,27,28,29].map(bid => (
                    <button 
                      key={bid}
                      disabled={bid <= state.currentBid}
                      onClick={() => placeBid(bid)}
                      className="px-2 py-1 bg-white text-black text-xs font-bold rounded disabled:opacity-30"
                    >
                      {bid}
                    </button>
                  ))}
                  <button onClick={() => placeBid('pass')} className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded col-span-3">Pass</button>
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
          {state.currentTrick.cards.top && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2">
              <CardUI card={state.currentTrick.cards.top} className="scale-75" />
            </div>
          )}
          {state.currentTrick.cards.bottom && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <CardUI card={state.currentTrick.cards.bottom} className="scale-75 shadow-2xl" />
            </div>
          )}
          {state.currentTrick.cards.left && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <CardUI card={state.currentTrick.cards.left} className="scale-75 rotate-90" />
            </div>
          )}
          {state.currentTrick.cards.right && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <CardUI card={state.currentTrick.cards.right} className="scale-75 -rotate-90" />
            </div>
          )}

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
        <div className="flex flex-row items-center gap-4 w-32 justify-start flex-row-reverse">
          {renderPlayerBadge('right')}
          {renderHand('right', true)}
        </div>

      </div>

      {/* Bottom Player (Self) */}
      <div className="flex flex-col items-center gap-4">
        {renderHand('bottom', false)}
        {renderPlayerBadge('bottom')}
      </div>

    </div>
  );
};
