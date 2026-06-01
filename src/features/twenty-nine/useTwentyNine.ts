import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, PlayerPosition, Card, Bid, Trick, Suit } from './types';
import { createDeck, shuffleDeck, getNextPlayer, evaluateTrick, calculateTrickPoints, getValidMoves, checkPair, sortHand, evaluateHandStrength, getBestAIPlay } from './engine';

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
  lastTrick: null,
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
      bottom: sortHand(deck.slice(0, 4)),
      left: sortHand(deck.slice(4, 8)),
      top: sortHand(deck.slice(8, 12)),
      right: sortHand(deck.slice(12, 16))
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
      lastTrick: null,
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

  const setTrump = (cardOrString: Card | '7th_card') => {
    setState((prev: any) => {
      let hiddenCard: Card;
      let newHand = [...prev.hands[prev.activeBidder]];
      const rem = prev.remainingDeck;
      let nextFour: Card[] = [];

      if (prev.activeBidder === 'bottom') nextFour = [...rem.slice(0, 4)];
      else if (prev.activeBidder === 'left') nextFour = [...rem.slice(4, 8)];
      else if (prev.activeBidder === 'top') nextFour = [...rem.slice(8, 12)];
      else if (prev.activeBidder === 'right') nextFour = [...rem.slice(12, 16)];

      if (cardOrString === '7th_card') {
        // The 7th card is the 3rd card in the next batch of 4
        hiddenCard = nextFour[2];
        // DO NOT remove it from nextFour! The player gets all 8 cards immediately.
      } else {
        hiddenCard = cardOrString;
        // If it's a real card from their hand (e.g. AI setting normal trump), remove it
        if (!hiddenCard.id.startsWith('dummy_')) {
          newHand = newHand.filter((c: Card) => c.id !== hiddenCard.id);
        }
      }
      
      // Deal remaining cards and sort
      const finalHands = {
        bottom: sortHand(prev.activeBidder === 'bottom' ? [...newHand, ...nextFour] : [...prev.hands.bottom, ...rem.slice(0, 4)], hiddenCard.id),
        left: sortHand(prev.activeBidder === 'left' ? [...newHand, ...nextFour] : [...prev.hands.left, ...rem.slice(4, 8)], hiddenCard.id),
        top: sortHand(prev.activeBidder === 'top' ? [...newHand, ...nextFour] : [...prev.hands.top, ...rem.slice(8, 12)], hiddenCard.id),
        right: sortHand(prev.activeBidder === 'right' ? [...newHand, ...nextFour] : [...prev.hands.right, ...rem.slice(12, 16)], hiddenCard.id)
      };

      return {
        ...prev,
        phase: 'playing',
        trumpSuit: hiddenCard.suit,
        hiddenTrumpCard: hiddenCard,
        trumpRevealed: false,
        hands: finalHands,
        turn: 'right' // Player right of dealer leads the first trick
      };
    });
  };

  const revealTrump = () => {
    setState(prev => {
      if (!prev.hiddenTrumpCard || prev.trumpRevealed) return prev;
      
      const newHands = { ...prev.hands };
      // Only give the card back if it's not a dummy conceptual card
      if (!prev.hiddenTrumpCard.id.startsWith('dummy_')) {
        const bidderHand = newHands[prev.bidWinner!];
        // Only add it if it's not already in their hand (like the 7th card is)
        if (!bidderHand.some(c => c.id === prev.hiddenTrumpCard!.id)) {
          newHands[prev.bidWinner!] = sortHand([...bidderHand, prev.hiddenTrumpCard]);
        } else {
          // It's already in the hand (7th card), just re-sort it without the hidden ID to place it correctly
          newHands[prev.bidWinner!] = sortHand(bidderHand);
        }
      }

      return {
        ...prev,
        trumpRevealed: true,
        trumpRevealer: prev.turn,
        hands: newHands
      }
    });
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
        return handleRoundEnd({ ...prev, tricksWon: newTricksWon, roundPoints: { team1: team1Points, team2: team2Points }, lastTrick: trick });
      }

      return {
        ...prev,
        tricksWon: newTricksWon,
        roundPoints: { team1: team1Points, team2: team2Points },
        currentTrick: { leadPlayer: winner, leadSuit: null, cards: { bottom: null, left: null, top: null, right: null }, winner: null, points: 0 },
        lastTrick: trick,
        turn: winner
      };
    });
  };

  const handleRoundEnd = (state: GameState) => {
    let t1Score = state.scores.team1;
    let t2Score = state.scores.team2;
    
    // Last trick point rule disabled as per user request (strict 28 points)

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
          const hand = state.hands[state.activeBidder];
          const strength = evaluateHandStrength(hand);
          
          let targetBid: number | 'pass' = 'pass';
          if (strength >= 5) targetBid = 19;
          else if (strength >= 4) targetBid = 18;
          else if (strength >= 3) targetBid = 17;
          else if (strength >= 2) targetBid = 16;

          if (targetBid !== 'pass' && targetBid > state.currentBid) {
            placeBid(targetBid);
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
          const hand = state.hands[state.activeBidder];
          if (hand.length > 0) {
            // Evaluate suits based on both count and power (Jack = 3, 9 = 2, A = 1, 10 = 1)
            const suitScores = hand.reduce((acc, card) => {
              acc[card.suit] = (acc[card.suit] || 0) + (card.value * 2) + 1; // 1 base point per card, plus power value
              return acc;
            }, {} as Record<string, number>);
            
            let bestSuit = '';
            let maxScore = 0;
            for (const suit in suitScores) {
              if (suitScores[suit] > maxScore) {
                maxScore = suitScores[suit];
                bestSuit = suit;
              }
            }

            if (maxScore <= 3) {
              // Weak hand (no suit has strong cards), opt for 7th card trump
              setTrump('7th_card');
            } else {
              // Pick a card from the strongest suit
              const cardToSet = hand.find(c => c.suit === bestSuit) || hand[0];
              setTrump(cardToSet);
            }
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
              const trickPoints = calculateTrickPoints(state.currentTrick);
              if (trickPoints > 0 || Math.random() > 0.6) {
                revealTrump(); 
              }
            }

            const cardToPlay = getBestAIPlay(validMoves, state.currentTrick, state.trumpSuit, state.trumpRevealed, state.turn);
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
