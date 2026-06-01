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
  
  return [...hand].sort((a, b) => {
    // Keep the hidden trump card at the very end so its position doesn't give away its suit
    if (a.id === hiddenTrumpCardId && b.id !== hiddenTrumpCardId) return 1;
    if (b.id === hiddenTrumpCardId && a.id !== hiddenTrumpCardId) return -1;
    
    if (suitOrder[a.suit] !== suitOrder[b.suit]) {
      return suitOrder[b.suit] - suitOrder[a.suit];
    }
    return RANK_POWER[b.rank] - RANK_POWER[a.rank];
  });
};
