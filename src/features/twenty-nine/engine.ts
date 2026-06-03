import { Card, Suit, Rank, PlayerPosition, Trick } from './types';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['J', '9', 'A', '10', 'K', 'Q', '8', '7'];

const RANK_VALUES: Record<Rank, number> = {
  'J': 3,
  '9': 2,
  'A': 1,
  '10': 1,
  'K': 0,
  'Q': 0,
  '8': 0,
  '7': 0
};

// Internal power ranking for evaluating tricks (Highest to Lowest)
const RANK_POWER: Record<Rank, number> = {
  'J': 8,
  '9': 7,
  'A': 6,
  '10': 5,
  'K': 4,
  'Q': 3,
  '8': 2,
  '7': 1
};

export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `${rank}_${suit}`,
        suit,
        rank,
        value: RANK_VALUES[rank]
      });
    }
  }
  return deck;
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const getNextPlayer = (current: PlayerPosition): PlayerPosition => {
  const order: PlayerPosition[] = ['bottom', 'left', 'top', 'right'];
  return order[(order.indexOf(current) + 1) % 4];
};

export const evaluateTrick = (trick: Trick, trumpSuit: Suit | null, trumpRevealed: boolean): PlayerPosition | null => {
  let winningCard: Card | null = null;
  let winner: PlayerPosition | null = null;

  const positions: PlayerPosition[] = ['bottom', 'left', 'top', 'right'];

  for (const pos of positions) {
    const card = trick.cards[pos];
    if (!card) continue;

    if (!winningCard) {
      winningCard = card;
      winner = pos;
      continue;
    }

    const isWinningTrump = trumpRevealed && winningCard.suit === trumpSuit;
    const isCurrentTrump = trumpRevealed && card.suit === trumpSuit;

    if (isCurrentTrump && !isWinningTrump) {
      // First trump played
      winningCard = card;
      winner = pos;
    } else if (isCurrentTrump && isWinningTrump) {
      // Both trump, check power
      if (RANK_POWER[card.rank] > RANK_POWER[winningCard.rank]) {
        winningCard = card;
        winner = pos;
      }
    } else if (!isWinningTrump && card.suit === trick.leadSuit) {
      // Following suit, check power
      if (RANK_POWER[card.rank] > RANK_POWER[winningCard.rank]) {
        winningCard = card;
        winner = pos;
      }
    }
  }

  return winner;
};

export const calculateTrickPoints = (trick: Trick): number => {
  return Object.values(trick.cards).reduce((sum, card) => sum + (card ? card.value : 0), 0);
};

export const getValidMoves = (
  hand: Card[],
  leadSuit: Suit | null,
  trumpSuit: Suit | null,
  trumpRevealed: boolean
): Card[] => {
  if (!leadSuit) return hand; // Can play anything if leading

  const hasLeadSuit = hand.some(c => c.suit === leadSuit);

  if (hasLeadSuit) {
    // Must follow suit if possible
    // Note: If trump is NOT revealed, they CANNOT play the hidden trump card even if it matches lead suit,
    // unless they reveal it. But for simple MVP, we assume the hidden trump is just a normal card until revealed.
    // In strict 29, the hidden trump card is not in the hand, it's set aside.
    return hand.filter(c => c.suit === leadSuit);
  } else {
    // Doesn't have lead suit, can play anything (or reveal trump)
    return hand;
  }
};

export const checkPair = (hand: Card[], trumpSuit: Suit): boolean => {
  const hasKing = hand.some(c => c.suit === trumpSuit && c.rank === 'K');
  const hasQueen = hand.some(c => c.suit === trumpSuit && c.rank === 'Q');
  return hasKing && hasQueen;
};

export const sortHand = (hand: Card[], hiddenTrumpCardId?: string): Card[] => {
  const suitOrder: Record<Suit, number> = {
    spades: 4,
    hearts: 3,
    diamonds: 2,
    clubs: 1
  };
  
  const visibleCards = hand.filter(c => c.id !== hiddenTrumpCardId);
  const hiddenCard = hand.find(c => c.id === hiddenTrumpCardId);
  
  visibleCards.sort((a, b) => {
    if (suitOrder[a.suit] !== suitOrder[b.suit]) {
      return suitOrder[b.suit] - suitOrder[a.suit];
    }
    return RANK_POWER[b.rank] - RANK_POWER[a.rank];
  });
  
  if (hiddenCard) {
    // Insert hidden card at the 7th position (index 6) to visually represent it as the 7th card
    visibleCards.splice(6, 0, hiddenCard);
  }
  
  return visibleCards;
};

// --- AI HELPER FUNCTIONS ---

export const evaluateHandStrength = (hand: Card[]): number => {
  let strength = 0;
  const suitCounts: Record<string, { J: boolean, 9: boolean, count: number }> = {
    spades: { J: false, 9: false, count: 0 },
    hearts: { J: false, 9: false, count: 0 },
    diamonds: { J: false, 9: false, count: 0 },
    clubs: { J: false, 9: false, count: 0 }
  };

  for (const card of hand) {
    strength += card.value;
    suitCounts[card.suit].count++;
    if (card.rank === 'J') suitCounts[card.suit].J = true;
    if (card.rank === '9') suitCounts[card.suit]['9'] = true;
  }

  for (const suit of SUITS) {
    if (suitCounts[suit].J && suitCounts[suit]['9']) {
      strength += 2;
    }
  }
  return strength;
};

export const getBestAIPlay = (
  validMoves: Card[],
  trick: Trick,
  trumpSuit: Suit | null,
  trumpRevealed: boolean,
  aiPosition: PlayerPosition,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  playedCards: Card[] = []
): Card => {
  if (validMoves.length === 1) return validMoves[0];

  // 1. Easy Mode: Completely Random
  if (difficulty === 'easy') {
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }

  // Prioritize declaring marriage if AI holds both King and Queen of trump
  if (trumpRevealed && trumpSuit) {
    const hasKing = validMoves.some(c => c.suit === trumpSuit && c.rank === 'K');
    const hasQueen = validMoves.some(c => c.suit === trumpSuit && c.rank === 'Q');
    if (hasKing && hasQueen) {
      const marriageCard = validMoves.find(c => c.suit === trumpSuit && (c.rank === 'K' || c.rank === 'Q'));
      if (marriageCard) return marriageCard;
    }
  }

  const leadSuit = trick.leadSuit;
  const partnerMap: Record<PlayerPosition, PlayerPosition> = {
    bottom: 'top', top: 'bottom', left: 'right', right: 'left'
  };
  const partner = partnerMap[aiPosition];
  const currentWinner = evaluateTrick(trick, trumpSuit, trumpRevealed);
  const isPartnerWinning = currentWinner === partner;

  // 2. Hard Mode: Card Counting, Boss cards, Partner feeding, saving trumps
  if (difficulty === 'hard') {
    const deck = createDeck();
    const myHandIds = new Set(validMoves.map(c => c.id));
    const playedIds = new Set(playedCards.map(c => c.id));
    const remainingCards = deck.filter(c => !myHandIds.has(c.id) && !playedIds.has(c.id));

    const isBossCard = (card: Card) => {
      const remainingOfSuit = remainingCards.filter(c => c.suit === card.suit);
      if (remainingOfSuit.length === 0) return true;
      return !remainingOfSuit.some(c => RANK_POWER[c.rank] > RANK_POWER[card.rank]);
    };

    if (!leadSuit) {
      // AI is leading the trick
      // Try to lead a boss card to secure the trick
      const bossCards = validMoves.filter(isBossCard);
      if (bossCards.length > 0) {
        // Play highest power boss card
        return bossCards.sort((a, b) => RANK_POWER[b.rank] - RANK_POWER[a.rank])[0];
      }
      // If no boss card, lead a low power card (value = 0) of a non-trump suit to avoid bleeding points
      const nonTrumpLows = validMoves.filter(c => c.suit !== trumpSuit && c.value === 0);
      if (nonTrumpLows.length > 0) {
        return nonTrumpLows.sort((a, b) => RANK_POWER[a.rank] - RANK_POWER[b.rank])[0];
      }
      // Otherwise lead lowest power card
      return validMoves.sort((a, b) => RANK_POWER[a.rank] - RANK_POWER[b.rank])[0];
    }

    const hasLeadSuit = validMoves.some(c => c.suit === leadSuit);
    if (hasLeadSuit) {
      const sortedLeadSuit = validMoves.filter(c => c.suit === leadSuit).sort((a, b) => RANK_POWER[b.rank] - RANK_POWER[a.rank]);
      const currentWinningCard = currentWinner ? trick.cards[currentWinner] : null;

      if (isPartnerWinning) {
        // Feed partner point cards!
        const pointCards = sortedLeadSuit.filter(c => c.value > 0).sort((a, b) => b.value - a.value);
        if (pointCards.length > 0) return pointCards[0];
        // Otherwise play lowest card
        return sortedLeadSuit[sortedLeadSuit.length - 1];
      } else {
        // Partner is not winning, try to win the trick with the lowest possible card that beats it
        if (currentWinningCard) {
          const isWinningTrump = trumpRevealed && currentWinningCard.suit === trumpSuit;
          if (!isWinningTrump && currentWinningCard.suit === leadSuit) {
            const winningMoves = sortedLeadSuit.filter(c => RANK_POWER[c.rank] > RANK_POWER[currentWinningCard.rank]);
            if (winningMoves.length > 0) {
              // Play the lowest winning card to save higher cards
              return winningMoves.sort((a, b) => RANK_POWER[a.rank] - RANK_POWER[b.rank])[0];
            }
          }
        }
        // If we can't win, throw the lowest value / power card
        return sortedLeadSuit.sort((a, b) => a.value - b.value || RANK_POWER[a.rank] - RANK_POWER[b.rank])[0];
      }
    }

    // AI does not have the lead suit
    const trumps = validMoves.filter(c => c.suit === trumpSuit);
    if (trumpRevealed && trumpSuit && trumps.length > 0 && !isPartnerWinning) {
      const currentWinningCard = currentWinner ? trick.cards[currentWinner] : null;
      if (currentWinningCard) {
        const isWinningTrump = currentWinningCard.suit === trumpSuit;
        if (isWinningTrump) {
          const winningTrumps = trumps.filter(c => RANK_POWER[c.rank] > RANK_POWER[currentWinningCard.rank]);
          if (winningTrumps.length > 0) {
            // Play lowest trump that wins
            return winningTrumps.sort((a, b) => RANK_POWER[a.rank] - RANK_POWER[b.rank])[0];
          }
        } else {
          // Current winner is not a trump, so any trump wins! Play lowest trump.
          return trumps.sort((a, b) => RANK_POWER[a.rank] - RANK_POWER[b.rank])[0];
        }
      }
    }

    if (isPartnerWinning) {
      // Feed partner with high point cards
      const nonTrumps = validMoves.filter(c => c.suit !== trumpSuit);
      const feedCards = (nonTrumps.length > 0 ? nonTrumps : validMoves).sort((a, b) => b.value - a.value || RANK_POWER[b.rank] - RANK_POWER[a.rank]);
      return feedCards[0];
    }

    // Play lowest value / power card
    return validMoves.sort((a, b) => a.value - b.value || RANK_POWER[a.rank] - RANK_POWER[b.rank])[0];
  }

  // 3. Medium Mode: Original Heuristic
  if (!leadSuit) {
    const sortedByPower = [...validMoves].sort((a, b) => RANK_POWER[b.rank] - RANK_POWER[a.rank]);
    const safeLeads = sortedByPower.filter(c => c.rank === 'J' || c.rank === '9' || c.value === 0);
    return safeLeads.length > 0 ? safeLeads[0] : sortedByPower[0];
  }

  const hasLeadSuit = validMoves.some(c => c.suit === leadSuit);
  if (hasLeadSuit) {
    const sortedLeadSuit = validMoves.filter(c => c.suit === leadSuit).sort((a, b) => RANK_POWER[b.rank] - RANK_POWER[a.rank]);
    const currentWinningCard = currentWinner ? trick.cards[currentWinner] : null;
    
    if (currentWinningCard && currentWinningCard.suit === leadSuit) {
      const ourBestCard = sortedLeadSuit[0];
      if (RANK_POWER[ourBestCard.rank] > RANK_POWER[currentWinningCard.rank] && !isPartnerWinning) {
        return ourBestCard; 
      }
    }
    
    if (isPartnerWinning) {
      const pointCards = sortedLeadSuit.filter(c => c.value > 0).sort((a, b) => a.value - b.value);
      if (pointCards.length > 0) return pointCards[pointCards.length - 1]; 
    }

    return sortedLeadSuit[sortedLeadSuit.length - 1];
  }

  const trumps = validMoves.filter(c => c.suit === trumpSuit);
  if (trumpRevealed && trumps.length > 0 && !isPartnerWinning) {
    const trickPoints = calculateTrickPoints(trick);
    if (trickPoints > 0) {
      const sortedTrumps = trumps.sort((a, b) => RANK_POWER[a.rank] - RANK_POWER[b.rank]);
      return sortedTrumps[0];
    }
  }

  if (isPartnerWinning) {
    const pointCards = validMoves.filter(c => c.value > 0).sort((a, b) => a.value - b.value);
    if (pointCards.length > 0) return pointCards[pointCards.length - 1];
  }

  const sortedOffSuit = [...validMoves].sort((a, b) => {
    if (a.value !== b.value) return a.value - b.value;
    return RANK_POWER[a.rank] - RANK_POWER[b.rank];
  });
  return sortedOffSuit[0];
};
