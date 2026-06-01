import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, PlayerPosition, Card, Bid, Trick, Suit } from './types';
import { createDeck, shuffleDeck, getNextPlayer, evaluateTrick, calculateTrickPoints, getValidMoves, checkPair } from './engine';

const INITIAL_STATE: GameState = {
  mode: null,
  phase: 'lobby',
  players: {
    bottom: { id: 'p1', name: 'You', isAI: false },
    left: { id: 'p2', name: 'AI Left', isAI: true },
    top: { id: 'p3', name: 'AI Partner', isAI: true },
    right: { id: 'p4', name: 'AI Right', isAI: true }
  },
  myPosition: 'bottom',
  hands: { bottom: [], left: [], top: [], right: [] },
  bids: [],
  currentBid: 15,
  biddingQueue: [],
  highestBidder: null,
  challenger: null,
  bidWinner: null,
  activeBidder: 'right', // typically player right of dealer starts bidding. Let's assume bottom is dealer for now, so right starts.
  trumpSuit: null,
  hiddenTrumpCard: null,
  trumpRevealed: false,
  trumpRevealer: null,
  currentTrick: { leadPlayer: 'right', leadSuit: null, cards: { bottom: null, left: null, top: null, right: null }, winner: null, points: 0 },
  tricksWon: { bottom: [], left: [], top: [], right: [] },
  turn: 'right',
  scores: { team1: 0, team2: 0 },
  roundPoints: { team1: 0, team2: 0 },
  pairRevealedBy: null,
  pairPointsAdded: false,
  passedPlayers: []
};

export const useTwentyNine = () => {
  const [state, setState] = useState<GameState>(INITIAL_STATE);

  const startGame = (mode: 'ai' | 'multiplayer') => {
    setState(prev => ({ ...prev, mode, phase: 'dealing_1' }));
    dealFirstHalf();
  };

  const dealFirstHalf = () => {
    const deck = shuffleDeck(createDeck());
    // Deal 4 cards to each
    const newHands = {
      bottom: deck.slice(0, 4),
      left: deck.slice(4, 8),
      top: deck.slice(8, 12),
      right: deck.slice(12, 16)
    };
    
    // Store remaining deck temporarily in a ref or state. We'll just put it in a hidden state property.
    // For simplicity, let's just add it to state.
    setState(prev => ({
      ...prev,
      phase: 'bidding',
      hands: newHands,
      remainingDeck: deck.slice(16, 32), // Custom addition not in type, but ok for JS
      activeBidder: 'right', // right of dealer
      biddingQueue: ['left', 'top'], // 'bottom' is already the challenger
      highestBidder: 'right', // Right is the initial defender
      challenger: 'bottom',   // Bottom is the first challenger
      currentBid: 15,
      bids: [],
      bidWinner: null,
      trumpSuit: null,
      hiddenTrumpCard: null,
      trumpRevealed: false,
      trumpRevealer: null,
      currentTrick: { leadPlayer: 'right', leadSuit: null, cards: { bottom: null, left: null, top: null, right: null }, winner: null, points: 0 },
      tricksWon: { bottom: [], left: [], top: [], right: [] },
      roundPoints: { team1: 0, team2: 0 },
      passedPlayers: []
    } as any));
  };

  const placeBid = (amount: number | 'pass') => {
    setState(prev => {
      const newBids = [...prev.bids, { player: prev.activeBidder, amount }];
      
      let newPassedPlayers = prev.passedPlayers || [];
      let newQueue = prev.biddingQueue ? [...prev.biddingQueue] : [];
      let newHighestBidder = prev.highestBidder;
      let newChallenger = prev.challenger;
      let newActiveBidder = prev.activeBidder;
      let nextPhase = prev.phase;
      let bidWinner = prev.bidWinner;
      let currentBid = prev.currentBid;

      const validBids = newBids.filter(b => b.amount !== 'pass');
      const hasValidBid = validBids.length > 0;

      if (!hasValidBid) {
        // No valid bids yet. Just finding the first person to bid.
        if (amount === 'pass') {
          newPassedPlayers = [...newPassedPlayers, prev.activeBidder];
          if (newPassedPlayers.length === 4) {
            setTimeout(dealFirstHalf, 1000);
            return { ...prev, bids: newBids, currentBid: 15, passedPlayers: newPassedPlayers };
          }
          
          newHighestBidder = prev.challenger;
          if (newQueue.length > 0) {
            newChallenger = newQueue.shift()!;
          }
          newActiveBidder = newHighestBidder!;
        } else {
          // First valid bid made!
          currentBid = amount as number;
          newHighestBidder = prev.activeBidder;
          newActiveBidder = prev.challenger!;
        }
      } else {
        // Duel mode
        if (amount === 'pass') {
          newPassedPlayers = [...newPassedPlayers, prev.activeBidder];
          
          if (prev.activeBidder === prev.highestBidder) {
            // Defender passed
            newHighestBidder = prev.challenger;
            if (newQueue.length > 0) {
              newChallenger = newQueue.shift()!;
              newActiveBidder = newChallenger;
            } else {
              nextPhase = 'dealing_2';
              bidWinner = newHighestBidder;
              newActiveBidder = bidWinner!;
            }
          } else if (prev.activeBidder === prev.challenger) {
            // Challenger passed
            if (newQueue.length > 0) {
              newChallenger = newQueue.shift()!;
              newActiveBidder = newChallenger;
            } else {
              nextPhase = 'dealing_2';
              bidWinner = newHighestBidder;
              newActiveBidder = bidWinner!;
            }
          }
        } else {
          // A higher bid was made
          currentBid = amount as number;
          newHighestBidder = prev.activeBidder;
          
          if (prev.activeBidder === prev.challenger) {
            newChallenger = prev.highestBidder;
            newActiveBidder = newChallenger!;
          } else {
            newChallenger = prev.challenger;
            newActiveBidder = newChallenger!;
          }
        }
      }

      return {
        ...prev,
        bids: newBids,
        currentBid,
        highestBidder: newHighestBidder,
        challenger: newChallenger,
        activeBidder: newActiveBidder,
        bidWinner,
        passedPlayers: newPassedPlayers,
        biddingQueue: newQueue,
        phase: nextPhase
      };
    });
  };

  const setTrump = (card: Card) => {
    setState((prev: any) => {
      // Remove card from hand and set as hidden trump
      const newHand = prev.hands[prev.activeBidder].filter((c: Card) => c.id !== card.id);
      
      // Deal remaining cards
      const rem = prev.remainingDeck;
      const finalHands = {
        bottom: [...(prev.activeBidder === 'bottom' ? newHand : prev.hands.bottom), ...rem.slice(0, 4)],
        left: [...(prev.activeBidder === 'left' ? newHand : prev.hands.left), ...rem.slice(4, 8)],
        top: [...(prev.activeBidder === 'top' ? newHand : prev.hands.top), ...rem.slice(8, 12)],
        right: [...(prev.activeBidder === 'right' ? newHand : prev.hands.right), ...rem.slice(12, 16)]
      };

      return {
        ...prev,
        phase: 'playing',
        trumpSuit: card.suit,
        hiddenTrumpCard: card,
        trumpRevealed: false,
        hands: finalHands,
        turn: 'right' // Player right of dealer leads the first trick
      };
    });
  };

  const revealTrump = () => {
    setState(prev => ({
      ...prev,
      trumpRevealed: true,
      trumpRevealer: prev.turn,
      // The hidden card goes back to the bidder's hand
      hands: {
        ...prev.hands,
        [prev.bidWinner!]: [...prev.hands[prev.bidWinner!], prev.hiddenTrumpCard!]
      }
    }));
  };

  const playCard = (player: PlayerPosition, card: Card) => {
    setState(prev => {
      if (prev.turn !== player) return prev;

      const newHand = prev.hands[player].filter(c => c.id !== card.id);
      const newTrickCards = { ...prev.currentTrick.cards, [player]: card };
      const isFirstCard = !prev.currentTrick.leadSuit;
      
      const newTrick: Trick = {
        ...prev.currentTrick,
        leadSuit: isFirstCard ? card.suit : prev.currentTrick.leadSuit,
        cards: newTrickCards
      };

      let nextTurn = getNextPlayer(player);
      let nextPhase = prev.phase;
      
      // Check if trick is complete
      const cardsPlayed = Object.values(newTrickCards).filter(c => c !== null).length;
      if (cardsPlayed === 4) {
        // Resolve trick
        const winner = evaluateTrick(newTrick, prev.trumpSuit, prev.trumpRevealed);
        const points = calculateTrickPoints(newTrick);
        newTrick.winner = winner;
        newTrick.points = points;
        
        // Setup next turn after delay
        setTimeout(() => resolveTrick(newTrick), 1500);
        nextTurn = player; // Temporary hold
      }

      return {
        ...prev,
        hands: { ...prev.hands, [player]: newHand },
        currentTrick: newTrick,
        turn: nextTurn,
        phase: nextPhase
      };
    });
  };

  const resolveTrick = (trick: Trick) => {
    setState(prev => {
      const winner = trick.winner!;
      const newTricksWon = { ...prev.tricksWon, [winner]: [...prev.tricksWon[winner], trick] };
      
      // Calculate points
      const team1Points = (newTricksWon.bottom.reduce((sum, t) => sum + t.points, 0) + newTricksWon.top.reduce((sum, t) => sum + t.points, 0));
      const team2Points = (newTricksWon.left.reduce((sum, t) => sum + t.points, 0) + newTricksWon.right.reduce((sum, t) => sum + t.points, 0));

      // Check if round is over (8 tricks = 32 cards played)
      const totalTricks = Object.values(newTricksWon).reduce((sum, tricks) => sum + tricks.length, 0);
      
      if (totalTricks === 8) {
        return handleRoundEnd({ ...prev, tricksWon: newTricksWon, roundPoints: { team1: team1Points, team2: team2Points } });
      }

      return {
        ...prev,
        tricksWon: newTricksWon,
        roundPoints: { team1: team1Points, team2: team2Points },
        currentTrick: { leadPlayer: winner, leadSuit: null, cards: { bottom: null, left: null, top: null, right: null }, winner: null, points: 0 },
        turn: winner
      };
    });
  };

  const handleRoundEnd = (state: GameState) => {
    let t1Score = state.scores.team1;
    let t2Score = state.scores.team2;
    
    // Last trick winner gets +1 point
    const lastTrickWinner = state.currentTrick.winner;
    if (lastTrickWinner === 'bottom' || lastTrickWinner === 'top') state.roundPoints.team1 += 1;
    if (lastTrickWinner === 'left' || lastTrickWinner === 'right') state.roundPoints.team2 += 1;

    // Apply Pair Rule points if applicable (simplified for MVP)
    
    const bidTeam = (state.bidWinner === 'bottom' || state.bidWinner === 'top') ? 'team1' : 'team2';
    const bidAmount = state.currentBid;

    if (bidTeam === 'team1') {
      if (state.roundPoints.team1 >= bidAmount) t1Score += 1;
      else t1Score -= 1;
    } else {
      if (state.roundPoints.team2 >= bidAmount) t2Score += 1;
      else t2Score -= 1;
    }

    return {
      ...state,
      phase: 'round_over',
      scores: { team1: t1Score, team2: t2Score }
    };
  };

  // --- AI LOGIC ---
  useEffect(() => {
    if (state.mode !== 'ai') return;

    if (state.phase === 'bidding') {
      const activePlayer = state.players[state.activeBidder];
      if (activePlayer.isAI) {
        const timer = setTimeout(() => {
          // Very simple AI: random chance to bid +1 or pass
          // A real AI would evaluate hand strength
          if (state.currentBid < 20 && Math.random() > 0.5) {
            placeBid(state.currentBid + 1);
          } else {
            placeBid('pass');
          }
        }, 2000);
        return () => clearTimeout(timer);
      }
    }

    if (state.phase === 'dealing_2') {
      const activePlayer = state.players[state.activeBidder];
      if (activePlayer.isAI) {
        const timer = setTimeout(() => {
          // AI randomly picks a card from its hand to be trump
          const hand = state.hands[state.activeBidder];
          if (hand.length > 0) {
            const randomCard = hand[Math.floor(Math.random() * hand.length)];
            setTrump(randomCard);
          }
        }, 1500);
        return () => clearTimeout(timer);
      }
    }

    if (state.phase === 'playing') {
      const activePlayer = state.players[state.turn];
      if (activePlayer.isAI && Object.values(state.currentTrick.cards).filter(c => c !== null).length < 4) {
        const timer = setTimeout(() => {
          const hand = state.hands[state.turn];
          if (hand.length > 0) {
            const validMoves = getValidMoves(hand, state.currentTrick.leadSuit, state.trumpSuit, state.trumpRevealed);
            
            // AI might want to ask for trump if they can't follow suit and trump isn't revealed
            if (!state.trumpRevealed && state.currentTrick.leadSuit && !hand.some(c => c.suit === state.currentTrick.leadSuit)) {
              if (Math.random() > 0.5) revealTrump(); // 50% chance to reveal
            }

            const cardToPlay = validMoves[Math.floor(Math.random() * validMoves.length)] || hand[0];
            playCard(state.turn, cardToPlay);
          }
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [state.phase, state.turn, state.activeBidder, state.mode, state.currentTrick.cards]);

  return {
    state,
    startGame,
    placeBid,
    setTrump,
    revealTrump,
    playCard
  };
};
