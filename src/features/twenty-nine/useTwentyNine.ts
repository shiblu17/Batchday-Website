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
  isDoubled: false,
  isRedoubled: false,
  isSingleHand: false,
  gameMessage: null,
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
  passedPlayers: [],
  settings: {
    speed: 'normal',
    theme: 'wooden'
  }
};

export const useTwentyNine = () => {
  const [state, setState] = useState<GameState>(INITIAL_STATE);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const lastPlayKeyRef = useRef<string>('');

  const startGame = (mode: 'ai' | 'multiplayer') => {
    setState(prev => ({ ...prev, mode, phase: 'dealing_1' }));
    dealFirstHalf();
  };

  const updateSettings = (speed: 'normal' | 'fast', theme: 'wooden' | 'green') => {
    setState(prev => ({
      ...prev,
      settings: { speed, theme }
    }));
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
    
    // Check for Round Cancellation (0 points in first 4 cards)
    const hasZeroPoints = Object.values(newHands).some(hand => hand.reduce((sum, c) => sum + c.value, 0) === 0);
    if (hasZeroPoints) {
      return dealFirstHalf(); // Recursively re-deal until hands are valid
    }
    
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
      isDoubled: false,
      isRedoubled: false,
      isSingleHand: false,
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

      let isDoubled = prev.isDoubled;
      let isRedoubled = prev.isRedoubled;
      let isSingleHand = prev.isSingleHand;

      if (amount === 'single_hand') {
        currentBid = 29;
        isSingleHand = true;
        bidWinner = prev.activeBidder;
        nextPhase = 'dealing_2';
        newActiveBidder = bidWinner;
      } else if (amount === 'double') {
        isDoubled = true;
        // Turn goes to the highest bidder to let them redouble or pass/continue
        newActiveBidder = newHighestBidder!;
      } else if (amount === 'redouble') {
        isRedoubled = true;
        // Bidding ends after redouble
        nextPhase = 'set_trump';
        bidWinner = newHighestBidder;
        newActiveBidder = bidWinner!;
      } else {
        const validBids = newBids.filter(b => typeof b.amount === 'number');
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
            prev.duelDefender = prev.activeBidder; // The first bidder is the original defender
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
                prev.duelDefender = newHighestBidder; // The winner of this duel becomes the defender for the next
              } else {
                nextPhase = 'doubling_phase';
                bidWinner = newHighestBidder;
                newActiveBidder = (bidWinner === 'bottom' || bidWinner === 'top') ? 'right' : 'bottom';
              }
            } else if (prev.activeBidder === prev.challenger) {
              // Challenger passed
              if (newQueue.length > 0) {
                newChallenger = newQueue.shift()!;
                newActiveBidder = newChallenger;
                prev.duelDefender = newHighestBidder; // highestBidder remains the defender
              } else {
                nextPhase = 'doubling_phase';
                bidWinner = newHighestBidder;
                newActiveBidder = (bidWinner === 'bottom' || bidWinner === 'top') ? 'right' : 'bottom';
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
      }

      return {
        ...prev,
        bids: newBids,
        currentBid,
        highestBidder: newHighestBidder,
        challenger: newChallenger,
        activeBidder: newActiveBidder,
        duelDefender: prev.duelDefender,
        phase: nextPhase,
        bidWinner,
        passedPlayers: newPassedPlayers,
        biddingQueue: newQueue,
        isDoubled,
        isRedoubled,
        isSingleHand
      };
    });
  };

  const handleDoubleDecision = (action: 'double' | 'cancel') => {
    setState(prev => {
      if (action === 'double') {
        const nextPhase = 'redoubling_phase';
        // Give redouble option to the bid winner's team
        const newActiveBidder = (prev.bidWinner === 'bottom' || prev.bidWinner === 'top') ? 'bottom' : 'right';
        const msg = prev.activeBidder === 'bottom' ? "You doubled the game!" : `${prev.players[prev.activeBidder].name} doubled the game!`;
        return { ...prev, isDoubled: true, phase: nextPhase, activeBidder: newActiveBidder, gameMessage: msg };
      } else {
        // Continue to set_trump
        return { ...prev, phase: 'set_trump', activeBidder: prev.bidWinner!, gameMessage: null };
      }
    });
  };

  const handleRedoubleDecision = (action: 'redouble' | 'cancel') => {
    setState(prev => {
      if (action === 'redouble') {
        const msg = prev.activeBidder === 'bottom' ? "You redoubled the game!" : `${prev.players[prev.activeBidder].name} redoubled the game!`;
        return { ...prev, isRedoubled: true, phase: 'set_trump', activeBidder: prev.bidWinner!, gameMessage: msg };
      } else {
        return { ...prev, phase: 'set_trump', activeBidder: prev.bidWinner!, gameMessage: null };
      }
    });
  };

  const dealSecondHalf = () => {
    setState((prev: any) => {
      const rem = prev.remainingDeck;
      const getSortedWithHidden = (player: PlayerPosition, newCards: Card[]) => {
        const allCards = [...prev.hands[player], ...newCards];
        if (prev.hiddenTrumpCard && prev.bidWinner === player && !prev.hiddenTrumpCard.id.startsWith('dummy_')) {
           const hiddenSuit = prev.hiddenTrumpCard.suit;
           const hiddenRank = prev.hiddenTrumpCard.rank;
           const otherCards = allCards.filter(c => !(c.suit === hiddenSuit && c.rank === hiddenRank));
           const sortedOthers = sortHand(otherCards);
           // Insert the hidden card at the 7th position (index 6)
           sortedOthers.splice(6, 0, prev.hiddenTrumpCard);
           return sortedOthers;
        }
        return sortHand(allCards);
      };

      const finalHands = {
        bottom: getSortedWithHidden('bottom', rem.slice(0, 4)),
        left: getSortedWithHidden('left', rem.slice(4, 8)),
        top: getSortedWithHidden('top', rem.slice(8, 12)),
        right: getSortedWithHidden('right', rem.slice(12, 16))
      };
      return {
        ...prev,
        hands: finalHands,
        remainingDeck: [],
        phase: 'single_hand_decision',
        activeBidder: prev.bidWinner!,
        gameMessage: null
      };
    });
  };

  const handleSingleHandDecision = (action: 'yes' | 'no') => {
    setState(prev => {
      if (action === 'yes') {
        return {
          ...prev,
          isSingleHand: true,
          phase: 'playing',
          trumpRevealed: false,
          trumpSuit: null,
          hiddenTrumpCard: null,
          turn: prev.bidWinner! // Bid winner always leads
        };
      } else {
        return { 
          ...prev, 
          phase: 'playing',
          turn: 'right' // Player right of dealer leads the first trick
        };
      }
    });
  };

  useEffect(() => {
    if (state.phase === 'dealing_2') {
      const timer = setTimeout(dealSecondHalf, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.phase]);

  const setTrump = (suitOrCard: Suit | Card | '7th_card') => {
    setState((prev: any) => {
      let hiddenCard: Card;
      let newHand = [...prev.hands[prev.activeBidder]];
      if (suitOrCard === '7th_card') {
        const playerIndex = ['bottom', 'left', 'top', 'right'].indexOf(prev.activeBidder);
        const rem = prev.remainingDeck;
        // The 7th card is the 3rd card in their 2nd batch (which is index 2 of their 4 cards)
        hiddenCard = rem[playerIndex * 4 + 2];
      } else {
        hiddenCard = suitOrCard as Card;
        // We no longer remove the card from the hand, so they always play with 8 cards.
      }
      
      const finalHands = {
        ...prev.hands,
        [prev.activeBidder]: sortHand(newHand, hiddenCard.id)
      };

      return {
        ...prev,
        phase: 'dealing_2',
        trumpSuit: hiddenCard.suit,
        hiddenTrumpCard: hiddenCard,
        trumpRevealed: false,
        hands: finalHands
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

      let pairRevealedBy: PlayerPosition | null = null;
      const tSuit = prev.hiddenTrumpCard.suit;
      
      // Check for Pair (King and Queen of Trump Suit)
      for (const player of Object.keys(newHands) as PlayerPosition[]) {
        const hand = newHands[player];
        const hasKing = hand.some(c => c.suit === tSuit && c.rank === 'K');
        const hasQueen = hand.some(c => c.suit === tSuit && c.rank === 'Q');
        if (hasKing && hasQueen) {
          pairRevealedBy = player;
          break;
        }
      }

      return {
        ...prev,
        trumpRevealed: true,
        trumpRevealer: prev.turn,
        hands: newHands,
        pairRevealedBy,
        pairPointsAdded: false
      };
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
      if (prev.isSingleHand) {
        const partner = prev.bidWinner === 'bottom' ? 'top' : prev.bidWinner === 'top' ? 'bottom' : prev.bidWinner === 'left' ? 'right' : 'left';
        if (nextTurn === partner) {
          nextTurn = getNextPlayer(nextTurn);
        }
      }

      let nextPhase = prev.phase;
      let newPairPointsAdded = prev.pairPointsAdded;
      let newGameMessage = prev.gameMessage;
      let newCurrentBid = prev.currentBid;

      // Check for Marriage Declaration
      const isTrumpKingOrQueen = prev.trumpSuit && card.suit === prev.trumpSuit && (card.rank === 'K' || card.rank === 'Q');
      if (prev.trumpRevealed && prev.pairRevealedBy === player && !prev.pairPointsAdded && isTrumpKingOrQueen) {
         newPairPointsAdded = true;
         const bidTeam = (prev.bidWinner === 'bottom' || prev.bidWinner === 'top') ? 'team1' : 'team2';
         const pairTeam = (player === 'bottom' || player === 'top') ? 'team1' : 'team2';
         
         let changeAmount = 0;
         if (pairTeam === bidTeam) {
           newCurrentBid = Math.max(16, prev.currentBid - 4);
           changeAmount = prev.currentBid - newCurrentBid;
         } else {
           newCurrentBid = Math.min(28, prev.currentBid + 4);
           changeAmount = newCurrentBid - prev.currentBid;
         }
         
         const diff = pairTeam === bidTeam ? 'decreased' : 'increased';
         if (changeAmount > 0) {
           newGameMessage = `Marriage Declared! Target bid is ${diff} by ${changeAmount}.`;
         } else {
           newGameMessage = `Marriage Declared! Target bid remains ${newCurrentBid} (Limit reached).`;
         }
      }
      
      // Check if trick is complete
      const cardsPlayed = Object.values(newTrickCards).filter(c => c !== null).length;
      const requiredCards = prev.isSingleHand ? 3 : 4;
      
      if (cardsPlayed === requiredCards) {
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
        phase: nextPhase,
        pairPointsAdded: newPairPointsAdded,
        gameMessage: newGameMessage,
        currentBid: newCurrentBid
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

      const bidTeam = (prev.bidWinner === 'bottom' || prev.bidWinner === 'top') ? 'team1' : 'team2';
      const winnerTeam = (winner === 'bottom' || winner === 'top') ? 'team1' : 'team2';

      // Check if round is over (8 tricks = 32 cards played, or 24 for single hand)
      const totalTricks = Object.values(newTricksWon).reduce((sum, tricks) => sum + tricks.length, 0);
      
      if (prev.isSingleHand) {
        if (winnerTeam !== bidTeam) {
          // Opponent won a trick! Instant loss.
          return handleRoundEnd({ ...prev, tricksWon: newTricksWon, roundPoints: { team1: team1Points, team2: team2Points }, lastTrick: trick, gameMessage: "Opponent won a trick! Single Hand Failed." });
        }
      }

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
    const bidTeam = (state.bidWinner === 'bottom' || state.bidWinner === 'top') ? 'team1' : 'team2';
    let bidAmount = state.currentBid; // Already adjusted and clamped to [16, 28] during round gameplay

    // Determine stakes
    let stakes = 1;
    if (state.isRedoubled) stakes = 4;
    else if (state.isDoubled) stakes = 2;

    let team1Won = false;
    if (state.isSingleHand) {
      if (bidTeam === 'team1') {
        const opponentWonTrick = state.tricksWon.left.length > 0 || state.tricksWon.right.length > 0;
        if (opponentWonTrick) { t1Score -= 3; team1Won = false; }
        else { t1Score += 3; team1Won = true; }
      } else {
        const opponentWonTrick = state.tricksWon.bottom.length > 0 || state.tricksWon.top.length > 0;
        if (opponentWonTrick) { t2Score -= 3; team1Won = true; }
        else { t2Score += 3; team1Won = false; }
      }
    } else {
      if (bidTeam === 'team1') {
        if (state.roundPoints.team1 >= bidAmount) { t1Score += stakes; team1Won = true; }
        else { t1Score -= stakes; team1Won = false; }
      } else {
        if (state.roundPoints.team2 >= bidAmount) { t2Score += stakes; team1Won = false; }
        else { t2Score -= stakes; team1Won = true; }
      }
    }

    return {
      ...state,
      phase: 'round_over',
      scores: { team1: t1Score, team2: t2Score },
      lastRoundResult: { team1Won }
    };
  };

  // --- AI LOGIC ---
  useEffect(() => {
    if (state.mode !== 'ai') return;

    if (state.phase === 'bidding') {
      const currentBidder = state.activeBidder;
      const currentPhase = state.phase;
      const activePlayer = state.players[currentBidder];
      if (activePlayer.isAI) {
        const timer = setTimeout(() => {
          const latestState = stateRef.current;
          if (latestState.phase !== currentPhase || latestState.activeBidder !== currentBidder) {
            return;
          }
          const playKey = `${currentPhase}_${currentBidder}_${latestState.bids.length}`;
          if (lastPlayKeyRef.current === playKey) {
            return;
          }
          lastPlayKeyRef.current = playKey;

          const hand = latestState.hands[currentBidder];
          const strength = evaluateHandStrength(hand);
          
          let targetBid: number | 'pass' = 'pass';
          if (strength >= 5) targetBid = 19;
          else if (strength >= 4) targetBid = 18;
          else if (strength >= 3) targetBid = 17;
          else if (strength >= 2) targetBid = 16;

          const isDefender = currentBidder === latestState.duelDefender;
          let bidToPlace: number | 'pass' = 'pass';
          
          if (targetBid !== 'pass') {
            if (isDefender) {
              if (targetBid >= latestState.currentBid) {
                bidToPlace = latestState.currentBid; // Match!
              }
            } else {
              if (targetBid > latestState.currentBid) {
                bidToPlace = latestState.currentBid === 15 ? 16 : latestState.currentBid + 1; // Bid +1
              }
            }
          }

          placeBid(bidToPlace);
        }, state.settings.speed === 'fast' ? 400 : 2000);
        return () => clearTimeout(timer);
      }
    }

    if (state.phase === 'doubling_phase') {
      const currentBidder = state.activeBidder;
      const currentPhase = state.phase;
      const activePlayer = state.players[currentBidder];
      if (activePlayer.isAI) {
        const timer = setTimeout(() => {
          const latestState = stateRef.current;
          if (latestState.phase !== currentPhase || latestState.activeBidder !== currentBidder) {
            return;
          }
          const playKey = `${currentPhase}_${currentBidder}_${latestState.isDoubled}`;
          if (lastPlayKeyRef.current === playKey) {
            return;
          }
          lastPlayKeyRef.current = playKey;

          const hand = latestState.hands[currentBidder];
          const strength = evaluateHandStrength(hand);
          if (strength >= 4 && latestState.currentBid >= 17) {
            handleDoubleDecision('double');
          } else {
            handleDoubleDecision('cancel');
          }
        }, state.settings.speed === 'fast' ? 400 : 1500);
        return () => clearTimeout(timer);
      }
    }

    if (state.phase === 'redoubling_phase') {
      const currentBidder = state.activeBidder;
      const currentPhase = state.phase;
      const activePlayer = state.players[currentBidder];
      if (activePlayer.isAI) {
        const timer = setTimeout(() => {
          const latestState = stateRef.current;
          if (latestState.phase !== currentPhase || latestState.activeBidder !== currentBidder) {
            return;
          }
          const playKey = `${currentPhase}_${currentBidder}_${latestState.isRedoubled}`;
          if (lastPlayKeyRef.current === playKey) {
            return;
          }
          lastPlayKeyRef.current = playKey;

          const hand = latestState.hands[currentBidder];
          const strength = evaluateHandStrength(hand);
          if (strength >= 6 && latestState.currentBid <= 18) {
            handleRedoubleDecision('redouble');
          } else {
            handleRedoubleDecision('cancel');
          }
        }, state.settings.speed === 'fast' ? 400 : 1500);
        return () => clearTimeout(timer);
      }
    }

    if (state.phase === 'single_hand_decision') {
      const currentBidder = state.activeBidder;
      const currentPhase = state.phase;
      const activePlayer = state.players[currentBidder];
      if (activePlayer.isAI) {
        const timer = setTimeout(() => {
          const latestState = stateRef.current;
          if (latestState.phase !== currentPhase || latestState.activeBidder !== currentBidder) {
            return;
          }
          const playKey = `${currentPhase}_${currentBidder}`;
          if (lastPlayKeyRef.current === playKey) {
            return;
          }
          lastPlayKeyRef.current = playKey;

          handleSingleHandDecision('no');
        }, state.settings.speed === 'fast' ? 400 : 1500);
        return () => clearTimeout(timer);
      }
    }

    if (state.phase === 'set_trump') {
      const currentBidder = state.activeBidder;
      const currentPhase = state.phase;
      const activePlayer = state.players[currentBidder];
      if (activePlayer.isAI) {
        const timer = setTimeout(() => {
          const latestState = stateRef.current;
          if (latestState.phase !== currentPhase || latestState.activeBidder !== currentBidder) {
            return;
          }
          const playKey = `${currentPhase}_${currentBidder}`;
          if (lastPlayKeyRef.current === playKey) {
            return;
          }
          lastPlayKeyRef.current = playKey;

          const hand = latestState.hands[currentBidder];
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
        }, state.settings.speed === 'fast' ? 400 : 1500);
        return () => clearTimeout(timer);
      }
    }

    if (state.phase === 'playing') {
      const currentTurn = state.turn;
      const currentPhase = state.phase;
      const activePlayer = state.players[currentTurn];
      const requiredCards = state.isSingleHand ? 3 : 4;
      if (activePlayer.isAI && Object.values(state.currentTrick.cards).filter(c => c !== null).length < requiredCards) {
        const timer = setTimeout(() => {
          const latestState = stateRef.current;
          if (latestState.phase !== currentPhase || latestState.turn !== currentTurn) {
            return;
          }
          const trickNumber = Object.values(latestState.tricksWon).reduce((sum, t) => sum + t.length, 0);
          const playKey = `${currentPhase}_${currentTurn}_${trickNumber}`;
          if (lastPlayKeyRef.current === playKey) {
            return;
          }
          lastPlayKeyRef.current = playKey;

          // Guard: If this player has already played a card in the current trick, do not play again.
          if (latestState.currentTrick.cards[currentTurn] !== null) {
            return;
          }
          const hand = latestState.hands[currentTurn];
          if (hand.length > 0) {
            let localHand = [...hand];
            let isTrumpRevealedLocal = latestState.trumpRevealed;
            
            // AI might want to ask for trump if they can't follow suit and trump isn't revealed
            if (!latestState.trumpRevealed && latestState.currentTrick.leadSuit && !hand.some(c => c.suit === latestState.currentTrick.leadSuit)) {
              const trickPoints = calculateTrickPoints(latestState.currentTrick);
              if (trickPoints > 0 || Math.random() > 0.6) {
                revealTrump();
                isTrumpRevealedLocal = true;
                if (latestState.bidWinner === currentTurn && latestState.hiddenTrumpCard && !latestState.hiddenTrumpCard.id.startsWith('dummy_')) {
                  if (!localHand.some(c => c.id === latestState.hiddenTrumpCard!.id)) {
                    localHand = sortHand([...localHand, latestState.hiddenTrumpCard]);
                  }
                }
              }
            }

            const validMoves = getValidMoves(localHand, latestState.currentTrick.leadSuit, latestState.trumpSuit, isTrumpRevealedLocal);
            const cardToPlay = getBestAIPlay(validMoves, latestState.currentTrick, latestState.trumpSuit, isTrumpRevealedLocal, currentTurn);
            playCard(currentTurn, cardToPlay);
          }
        }, state.settings.speed === 'fast' ? 500 : 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [state.phase, state.turn, state.activeBidder, state.mode, state.currentTrick.cards]);

  return {
    state,
    startGame,
    placeBid,
    handleDoubleDecision,
    handleRedoubleDecision,
    handleSingleHandDecision,
    setTrump,
    revealTrump,
    playCard,
    updateSettings
  };
};
