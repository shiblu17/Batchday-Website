export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'J' | '9' | 'A' | '10' | 'K' | 'Q' | '8' | '7';

export interface Card {
  id: string; // e.g., "J_hearts"
  suit: Suit;
  rank: Rank;
  value: number; // J=3, 9=2, A=1, 10=1, rest=0
}

export type PlayerPosition = 'bottom' | 'left' | 'top' | 'right';
export type Team = 'team1' | 'team2'; // team1 = bottom+top, team2 = left+right

export interface Trick {
  leadPlayer: PlayerPosition;
  leadSuit: Suit | null;
  cards: Record<PlayerPosition, Card | null>;
  winner: PlayerPosition | null;
  points: number;
}

export interface Bid {
  player: PlayerPosition;
  amount: number | 'pass';
}

export interface GameState {
  mode: 'ai' | 'multiplayer' | null;
  phase: 'lobby' | 'dealing_1' | 'bidding' | 'dealing_2' | 'playing' | 'round_over';
  
  // Players
  players: Record<PlayerPosition, { id: string; name: string; isAI: boolean }>;
  myPosition: PlayerPosition;
  
  // Hands
  hands: Record<PlayerPosition, Card[]>;
  
  // Bidding
  bids: Bid[];
  currentBid: number;
  highestBidder: PlayerPosition | null;
  challenger: PlayerPosition | null;
  bidWinner: PlayerPosition | null;
  activeBidder: PlayerPosition;
  passedPlayers: PlayerPosition[];
  biddingQueue: PlayerPosition[];
  
  // Trump
  trumpSuit: Suit | null;
  hiddenTrumpCard: Card | null;
  trumpRevealed: boolean;
  trumpRevealer: PlayerPosition | null;
  
  // Gameplay
  currentTrick: Trick;
  tricksWon: Record<PlayerPosition, Trick[]>;
  turn: PlayerPosition;
  
  // Scores
  scores: { team1: number; team2: number }; // Overall game sets (Red/Black chips)
  roundPoints: { team1: number; team2: number }; // Points in current round (max 28/29)
  
  // Pair Rule
  pairRevealedBy: PlayerPosition | null; // Gives +/- 4 points based on team
  pairPointsAdded: boolean;
}
