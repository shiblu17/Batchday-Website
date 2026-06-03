import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, PlayerPosition, Card, Bid, Trick, Suit } from './types';
import { createDeck, shuffleDeck, getNextPlayer, evaluateTrick, calculateTrickPoints, getValidMoves, checkPair, sortHand, evaluateHandStrength, getBestAIPlay } from './engine';
import { supabase } from '@/integrations/supabase/client';
import votersData from '@/data/voters.json';

const order: PlayerPosition[] = ['bottom', 'left', 'top', 'right'];

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const dbToLocal = (pos: PlayerPosition, myPos: PlayerPosition): PlayerPosition => {
  if (!myPos) return pos;
  if (!order.includes(pos)) return pos;
  const myIndex = order.indexOf(myPos);
  const posIndex = order.indexOf(pos);
  return order[(posIndex - myIndex + 4) % 4];
};

const localToDb = (pos: PlayerPosition, myPos: PlayerPosition): PlayerPosition => {
  if (!myPos) return pos;
  if (!order.includes(pos)) return pos;
  const myIndex = order.indexOf(myPos);
  const localIndex = order.indexOf(pos);
  return order[(localIndex + myIndex) % 4];
};

const rotatePlayerMap = <T>(map: Record<PlayerPosition, T>, myPos: PlayerPosition, direction: 'dbToLocal' | 'localToDb'): Record<PlayerPosition, T> => {
  const rotated = {} as Record<PlayerPosition, T>;
  (Object.keys(map) as PlayerPosition[]).forEach(pos => {
    const targetPos = direction === 'dbToLocal' ? dbToLocal(pos, myPos) : localToDb(pos, myPos);
    rotated[targetPos] = map[pos];
  });
  return rotated;
};

const rotatePlayerArray = (arr: PlayerPosition[], myPos: PlayerPosition, direction: 'dbToLocal' | 'localToDb'): PlayerPosition[] => {
  return arr.map(pos => direction === 'dbToLocal' ? dbToLocal(pos, myPos) : localToDb(pos, myPos));
};

const rotateTrick = (trick: any, myPos: PlayerPosition, direction: 'dbToLocal' | 'localToDb'): any => {
  if (!trick) return null;
  return {
    ...trick,
    leadPlayer: direction === 'dbToLocal' ? dbToLocal(trick.leadPlayer, myPos) : localToDb(trick.leadPlayer, myPos),
    winner: trick.winner ? (direction === 'dbToLocal' ? dbToLocal(trick.winner, myPos) : localToDb(trick.winner, myPos)) : null,
    cards: rotatePlayerMap(trick.cards, myPos, direction)
  };
};

const rotateTricksWon = (tricksWon: Record<PlayerPosition, any[]>, myPos: PlayerPosition, direction: 'dbToLocal' | 'localToDb') => {
  const rotated = {} as Record<PlayerPosition, any[]>;
  (Object.keys(tricksWon) as PlayerPosition[]).forEach(pos => {
    const targetPos = direction === 'dbToLocal' ? dbToLocal(pos, myPos) : localToDb(pos, myPos);
    rotated[targetPos] = (tricksWon[pos] || []).map(t => rotateTrick(t, myPos, direction));
  });
  return rotated;
};

const rotateScores = (scores: { team1: number; team2: number }, myPos: PlayerPosition) => {
  const isMyTeam2 = (myPos === 'left' || myPos === 'right');
  return isMyTeam2 ? { team1: scores.team2, team2: scores.team1 } : scores;
};

const rotateBids = (bids: Bid[], myPos: PlayerPosition, direction: 'dbToLocal' | 'localToDb'): Bid[] => {
  if (!bids) return [];
  return bids.map(b => ({
    ...b,
    player: direction === 'dbToLocal' ? dbToLocal(b.player, myPos) : localToDb(b.player, myPos)
  }));
};

const rotateStateDbToLocal = (dbState: any, myPos: PlayerPosition): GameState => {
  return {
    ...dbState,
    myPosition: 'bottom',
    activeBidder: dbToLocal(dbState.activeBidder, myPos),
    turn: dbToLocal(dbState.turn, myPos),
    highestBidder: dbState.highestBidder ? dbToLocal(dbState.highestBidder, myPos) : null,
    challenger: dbState.challenger ? dbToLocal(dbState.challenger, myPos) : null,
    bidWinner: dbState.bidWinner ? dbToLocal(dbState.bidWinner, myPos) : null,
    trumpRevealer: dbState.trumpRevealer ? dbToLocal(dbState.trumpRevealer, myPos) : null,
    pairRevealedBy: dbState.pairRevealedBy ? dbToLocal(dbState.pairRevealedBy, myPos) : null,
    duelDefender: dbState.duelDefender ? dbToLocal(dbState.duelDefender, myPos) : undefined,
    players: rotatePlayerMap(dbState.players, myPos, 'dbToLocal'),
    hands: rotatePlayerMap(dbState.hands, myPos, 'dbToLocal'),
    bids: rotateBids(dbState.bids || [], myPos, 'dbToLocal'),
    currentTrick: rotateTrick(dbState.currentTrick, myPos, 'dbToLocal'),
    lastTrick: rotateTrick(dbState.lastTrick, myPos, 'dbToLocal'),
    tricksWon: rotateTricksWon(dbState.tricksWon, myPos, 'dbToLocal'),
    passedPlayers: rotatePlayerArray(dbState.passedPlayers || [], myPos, 'dbToLocal'),
    biddingQueue: rotatePlayerArray(dbState.biddingQueue || [], myPos, 'dbToLocal'),
    scores: rotateScores(dbState.scores, myPos),
    roundPoints: rotateScores(dbState.roundPoints, myPos),
    activeReactions: rotatePlayerMap(dbState.activeReactions || {}, myPos, 'dbToLocal')
  };
};

const rotateStateLocalToDb = (localState: any, myPos: PlayerPosition): any => {
  return {
    ...localState,
    activeBidder: localToDb(localState.activeBidder, myPos),
    turn: localToDb(localState.turn, myPos),
    highestBidder: localState.highestBidder ? localToDb(localState.highestBidder, myPos) : null,
    challenger: localState.challenger ? localToDb(localState.challenger, myPos) : null,
    bidWinner: localState.bidWinner ? localToDb(localState.bidWinner, myPos) : null,
    trumpRevealer: localState.trumpRevealer ? localToDb(localState.trumpRevealer, myPos) : null,
    pairRevealedBy: localState.pairRevealedBy ? localToDb(localState.pairRevealedBy, myPos) : null,
    duelDefender: localState.duelDefender ? localToDb(localState.duelDefender, myPos) : undefined,
    players: rotatePlayerMap(localState.players, myPos, 'localToDb'),
    hands: rotatePlayerMap(localState.hands, myPos, 'localToDb'),
    bids: rotateBids(localState.bids || [], myPos, 'localToDb'),
    currentTrick: rotateTrick(localState.currentTrick, myPos, 'localToDb'),
    lastTrick: rotateTrick(localState.lastTrick, myPos, 'localToDb'),
    tricksWon: rotateTricksWon(localState.tricksWon, myPos, 'localToDb'),
    passedPlayers: rotatePlayerArray(localState.passedPlayers || [], myPos, 'localToDb'),
    biddingQueue: rotatePlayerArray(localState.biddingQueue || [], myPos, 'localToDb'),
    scores: rotateScores(localState.scores, myPos),
    roundPoints: rotateScores(localState.roundPoints, myPos),
    activeReactions: rotatePlayerMap(localState.activeReactions || {}, myPos, 'localToDb')
  };
};

const mapDbRoomToLocalState = (
  dbRoom: any,
  dbPlayers: any[],
  allHands: any[],
  myPos: PlayerPosition,
  isSpectator: boolean = false
): GameState => {
  const absPlayers: Record<PlayerPosition, { id: string; name: string; isAI: boolean }> = {
    bottom: { id: '', name: 'Empty', isAI: false },
    left: { id: '', name: 'Empty', isAI: false },
    top: { id: '', name: 'Empty', isAI: false },
    right: { id: '', name: 'Empty', isAI: false }
  };
  dbPlayers.forEach(p => {
    if (p.position === 'bottom' || p.position === 'left' || p.position === 'top' || p.position === 'right') {
      absPlayers[p.position as PlayerPosition] = {
        id: p.user_id,
        name: p.name,
        isAI: p.is_ai
      };
    }
  });

  const absHands: Record<PlayerPosition, Card[]> = {
    bottom: [],
    left: [],
    top: [],
    right: []
  };

  if (isSpectator) {
    order.forEach(pos => {
      const count = dbRoom.card_counts?.[pos] || 0;
      absHands[pos] = Array.from({ length: count }).map((_, idx) => ({
        id: `dummy_${pos}_${idx}`,
        suit: 'hearts',
        rank: '7',
        value: 0
      }));
    });
  } else {
    const myHandRow = allHands.find(h => h.position === myPos);
    const myCards = myHandRow ? (myHandRow.cards as Card[]) : [];
    absHands[myPos] = myCards;

    const isHostPlayer = dbRoom.creator_id === localStorage.getItem('twenty_nine_player_id');
    
    order.forEach(pos => {
      if (pos === myPos) return;
      if (isHostPlayer) {
        const handRow = allHands.find(h => h.position === pos);
        absHands[pos] = handRow ? (handRow.cards as Card[]) : [];
      } else {
        const count = dbRoom.card_counts?.[pos] || 0;
        absHands[pos] = Array.from({ length: count }).map((_, idx) => ({
          id: `dummy_${pos}_${idx}`,
          suit: 'hearts',
          rank: '7',
          value: 0
        }));
      }
    });
  }

  const absState = {
    mode: 'multiplayer' as const,
    phase: dbRoom.phase as any,
    players: absPlayers,
    myPosition: myPos,
    hands: absHands,
    bids: (dbRoom.bids || []) as Bid[],
    currentBid: dbRoom.current_bid,
    highestBidder: dbRoom.highest_bidder as PlayerPosition | null,
    challenger: dbRoom.challenger as PlayerPosition | null,
    bidWinner: dbRoom.bid_winner as PlayerPosition | null,
    activeBidder: dbRoom.active_bidder as PlayerPosition,
    passedPlayers: (dbRoom.passed_players || []) as PlayerPosition[],
    biddingQueue: (dbRoom.bidding_queue || []) as PlayerPosition[],
    duelDefender: dbRoom.duel_defender as PlayerPosition | undefined,
    isDoubled: dbRoom.is_doubled,
    isRedoubled: dbRoom.is_redoubled,
    isSingleHand: dbRoom.is_single_hand,
    gameMessage: dbRoom.game_message,
    trumpSuit: dbRoom.trump_suit as Suit | null,
    hiddenTrumpCard: dbRoom.hidden_trump_card as Card | null,
    trumpRevealed: dbRoom.trump_revealed,
    trumpRevealer: dbRoom.trump_revealer as PlayerPosition | null,
    pairRevealedBy: dbRoom.pair_revealed_by as PlayerPosition | null,
    pairPointsAdded: dbRoom.pair_points_added,
    currentTrick: dbRoom.current_trick,
    lastTrick: dbRoom.last_trick,
    tricksWon: dbRoom.tricks_won,
    turn: dbRoom.turn as PlayerPosition,
    scores: dbRoom.scores,
    roundPoints: dbRoom.round_points,
    settings: {
      speed: 'normal' as const,
      theme: 'wooden' as const
    },
    activeReactions: dbRoom.active_reactions || {}
  };

  return rotateStateDbToLocal(absState, myPos);
};

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

  // --- Multiplayer States ---
  const [userId] = useState(() => {
    let id = localStorage.getItem('twenty_nine_player_id');
    if (!id) {
      id = generateUUID();
      localStorage.setItem('twenty_nine_player_id', id);
    }
    return id;
  });
  const [nickname, setNicknameState] = useState(() => localStorage.getItem('ju_game_nickname_v2') || '');
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [myPosition, setMyPosition] = useState<PlayerPosition>('bottom');
  const [playersList, setPlayersList] = useState<any[]>([]);

  const playersListRef = useRef(playersList);
  useEffect(() => {
    playersListRef.current = playersList;
  }, [playersList]);

  const isLocalActionRef = useRef(false);
  const disconnectTimersRef = useRef<Record<PlayerPosition, any>>({
    bottom: null, left: null, top: null, right: null
  });

  const saveNickname = (name: string) => {
    localStorage.setItem('ju_game_nickname_v2', name);
    setNicknameState(name);
  };

  // --- Profile & Stats Integration ---
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Local match stats tracking (for user at 'bottom' position)
  const matchSingleHandsTriedRef = useRef(0);
  const matchSingleHandsWonRef = useRef(0);
  const matchHighestBidWonRef = useRef(0);
  const statsUploadedRef = useRef(false);

  const resetMatchStats = () => {
    matchSingleHandsTriedRef.current = 0;
    matchSingleHandsWonRef.current = 0;
    matchHighestBidWonRef.current = 0;
  };

  // Fetch or create profile when nickname changes
  useEffect(() => {
    if (!nickname) {
      setProfile(null);
      return;
    }

    const loadProfile = async () => {
      setLoadingProfile(true);
      try {
        let deviceUuid = localStorage.getItem('twenty_nine_device_uuid');
        if (!deviceUuid) {
          deviceUuid = generateUUID();
          localStorage.setItem('twenty_nine_device_uuid', deviceUuid);
        }

        const isVerified = nickname.endsWith(' ✅');
        const cleanName = isVerified ? nickname.slice(0, -2).trim() : nickname.trim();

        let dept = '';
        let hall = '';
        if (isVerified) {
          const voter = (votersData as any[]).find(v => v.name.toLowerCase() === cleanName.toLowerCase());
          if (voter) {
            dept = voter.dept;
            hall = voter.hall;
          }
        }

        const profileId = isVerified ? `${cleanName}:${dept}:${hall}` : deviceUuid;

        const { data, error } = await supabase
          .from('twenty_nine_profiles')
          .select('*')
          .eq('id', profileId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
          setLoadingProfile(false);
          return;
        }

        if (data) {
          // If guest and name has changed, update name in DB
          if (!isVerified && data.name !== cleanName) {
            const { error: updateErr } = await supabase
              .from('twenty_nine_profiles')
              .update({ name: cleanName })
              .eq('id', profileId);
            if (!updateErr) {
              data.name = cleanName;
            }
          }
          setProfile(data);
        } else {
          // Create default profile
          const newProfile = {
            id: profileId,
            is_verified: isVerified,
            name: cleanName,
            department: dept || null,
            hall: hall || null,
            games_played: 0,
            games_won: 0,
            single_hands_tried: 0,
            single_hands_won: 0,
            highest_bid_won: 0,
            practice_played: 0,
            practice_won: 0
          };

          const { error: insertErr } = await supabase
            .from('twenty_nine_profiles')
            .insert(newProfile);

          if (insertErr) {
            console.error('Error creating profile:', insertErr);
          } else {
            setProfile(newProfile);
          }
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [nickname]);

  // Save game stats to Supabase
  const saveStatsToDatabase = async (t1Score: number, t2Score: number, mode: 'ai' | 'multiplayer' | null) => {
    if (!nickname) return;

    // LocalStorage lookup to get fresh profile info
    let deviceUuid = localStorage.getItem('twenty_nine_device_uuid');
    if (!deviceUuid) return;

    const isVerified = nickname.endsWith(' ✅');
    const cleanName = isVerified ? nickname.slice(0, -2).trim() : nickname.trim();

    let dept = '';
    let hall = '';
    if (isVerified) {
      const voter = (votersData as any[]).find(v => v.name.toLowerCase() === cleanName.toLowerCase());
      if (voter) {
        dept = voter.dept;
        hall = voter.hall;
      }
    }

    const profileId = isVerified ? `${cleanName}:${dept}:${hall}` : deviceUuid;
    const userWonGame = (t1Score >= 6 || t2Score <= -6);

    try {
      const { data: currentProfile, error: fetchErr } = await supabase
        .from('twenty_nine_profiles')
        .select('*')
        .eq('id', profileId)
        .maybeSingle();

      if (fetchErr) {
        console.error('Error fetching profile for stats update:', fetchErr);
        return;
      }

      const baseProfile = currentProfile || {
        id: profileId,
        is_verified: isVerified,
        name: cleanName,
        department: dept || null,
        hall: hall || null,
        games_played: 0,
        games_won: 0,
        single_hands_tried: 0,
        single_hands_won: 0,
        highest_bid_won: 0,
        practice_played: 0,
        practice_won: 0
      };

      const updates: any = {};
      if (mode === 'multiplayer') {
        updates.games_played = baseProfile.games_played + 1;
        updates.games_won = baseProfile.games_won + (userWonGame ? 1 : 0);
        updates.single_hands_tried = baseProfile.single_hands_tried + matchSingleHandsTriedRef.current;
        updates.single_hands_won = baseProfile.single_hands_won + matchSingleHandsWonRef.current;
        updates.highest_bid_won = Math.max(baseProfile.highest_bid_won, matchHighestBidWonRef.current);
      } else if (mode === 'ai') {
        updates.practice_played = baseProfile.practice_played + 1;
        updates.practice_won = baseProfile.practice_won + (userWonGame ? 1 : 0);
      }

      if (!currentProfile) {
        // Perform insert if profile doesn't exist
        const { data: inserted, error: insertErr } = await supabase
          .from('twenty_nine_profiles')
          .insert({ ...baseProfile, ...updates })
          .select()
          .single();
        if (!insertErr && inserted) {
          setProfile(inserted);
        } else if (insertErr) {
          console.error('Error inserting profile with stats:', insertErr);
        }
      } else {
        // Perform update
        const { data: updated, error: updateErr } = await supabase
          .from('twenty_nine_profiles')
          .update(updates)
          .eq('id', profileId)
          .select()
          .single();
        if (!updateErr && updated) {
          setProfile(updated);
        } else if (updateErr) {
          console.error('Error updating stats in database:', updateErr);
        }
      }
    } catch (err) {
      console.error('Failed to save stats to database:', err);
    }
  };

  // Trigger stats upload when phase becomes game_over
  useEffect(() => {
    if (state.phase === 'game_over' && !statsUploadedRef.current) {
      statsUploadedRef.current = true;
      saveStatsToDatabase(state.scores.team1, state.scores.team2, state.mode);
    } else if (state.phase === 'dealing_1') {
      statsUploadedRef.current = false;
      resetMatchStats();
    }
  }, [state.phase]);


  const updateStateAndSync = useCallback((updater: (prev: GameState) => GameState) => {
    setState(prev => {
      const nextState = updater(prev);
      
      // If we are in multiplayer mode, we push the state to Supabase
      if (nextState.mode === 'multiplayer' && roomId) {
        const dbState = rotateStateLocalToDb(nextState, myPosition);
        
        isLocalActionRef.current = true;
        
        const dbUpdate = {
          phase: dbState.phase,
          active_bidder: dbState.activeBidder,
          turn: dbState.turn,
          current_bid: dbState.currentBid,
          bid_winner: dbState.bidWinner,
          highest_bidder: dbState.highestBidder,
          trump_suit: dbState.trumpSuit,
          hidden_trump_card: dbState.hiddenTrumpCard,
          trump_revealed: dbState.trumpRevealed,
          trump_revealer: dbState.trumpRevealer,
          pair_revealed_by: dbState.pairRevealedBy,
          pair_points_added: dbState.pairPointsAdded,
          is_doubled: dbState.isDoubled,
          is_redoubled: dbState.isRedoubled,
          is_single_hand: dbState.isSingleHand,
          game_message: dbState.gameMessage,
          current_trick: dbState.currentTrick,
          last_trick: dbState.lastTrick,
          tricks_won: dbState.tricksWon,
          scores: dbState.scores,
          round_points: dbState.roundPoints,
          bids: dbState.bids,
          passed_players: dbState.passedPlayers,
          bidding_queue: dbState.biddingQueue,
          duel_defender: dbState.duelDefender,
          challenger: dbState.challenger,
          card_counts: {
            bottom: dbState.hands.bottom?.length || 0,
            left: dbState.hands.left?.length || 0,
            top: dbState.hands.top?.length || 0,
            right: dbState.hands.right?.length || 0
          }
        };

        supabase
          .from('twenty_nine_rooms')
          .update(dbUpdate as any)
          .eq('id', roomId)
          .then(({ error }) => {
            if (error) {
              console.error('Error syncing room to Supabase:', error);
              alert(`Room Sync Error: ${error.message}`);
            }
          });
          
        const absMyHand = dbState.hands[myPosition];
        supabase
          .from('twenty_nine_hands')
          .update({ cards: absMyHand } as any)
          .eq('room_id', roomId)
          .eq('position', myPosition)
          .then(({ error }) => {
            if (error) {
              console.error('Error syncing hand to Supabase:', error);
              alert(`Hand Sync Error: ${error.message}`);
            }
          });

        // If we are the host, we also sync the hands of all AI players in the database
        if (isHost && dbState.players) {
          (Object.keys(dbState.players) as PlayerPosition[]).forEach(absPos => {
            const p = dbState.players[absPos];
            if (p && p.isAI) {
              const absAIHand = dbState.hands[absPos] || [];
              supabase
                .from('twenty_nine_hands')
                .update({ cards: absAIHand } as any)
                .eq('room_id', roomId)
                .eq('position', absPos)
                .then(({ error }) => {
                  if (error) {
                    console.error(`Error syncing AI (${absPos}) hand to Supabase:`, error);
                  }
                });
            }
          });
        }
      }
      
      return nextState;
    });
  }, [roomId, myPosition, isHost]);

  // --- Room actions ---
  const createRoom = async (nick: string) => {
    if (!nick.trim()) return;
    saveNickname(nick);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    const { data: room, error: roomError } = await supabase
      .from('twenty_nine_rooms')
      .insert({
        room_code: code,
        creator_id: userId,
        status: 'waiting',
        phase: 'multiplayer_lobby',
        scores: { team1: 0, team2: 0 },
        round_points: { team1: 0, team2: 0 },
        current_trick: { leadPlayer: null, leadSuit: null, cards: { bottom: null, left: null, top: null, right: null }, winner: null, points: 0 },
        tricks_won: { bottom: [], left: [], top: [], right: [] }
      } as any)
      .select()
      .single();

    if (roomError || !room) {
      console.error('Error creating room:', roomError);
      return;
    }

    const { error: playerError } = await supabase
      .from('twenty_nine_players')
      .insert({
        room_id: room.id,
        user_id: userId,
        name: nick,
        position: 'bottom',
        is_ai: false
      } as any);

    if (playerError) {
      console.error('Error adding creator to players:', playerError);
      return;
    }

    setRoomCode(code);
    setRoomId(room.id);
    setIsHost(true);
    setMyPosition('bottom');
    
    setState({
      ...INITIAL_STATE,
      mode: 'multiplayer',
      phase: 'multiplayer_lobby',
      myPosition: 'bottom',
      players: {
        bottom: { id: userId, name: nick, isAI: false },
        left: { id: '', name: 'Empty', isAI: false },
        top: { id: '', name: 'Empty', isAI: false },
        right: { id: '', name: 'Empty', isAI: false }
      }
    });

    await fetchRoomState(room.id, 'bottom');
  };

  const joinRoom = async (code: string, nick: string) => {
    if (!code.trim() || !nick.trim()) return;
    saveNickname(nick);

    const { data: room, error: roomError } = await supabase
      .from('twenty_nine_rooms')
      .select('*')
      .eq('room_code', code)
      .neq('status', 'finished')
      .single();

    if (roomError || !room) {
      alert('Room not found or game already finished!');
      return;
    }

    const { data: players, error: playersError } = await supabase
      .from('twenty_nine_players')
      .select('*')
      .eq('room_id', room.id);

    if (playersError || !players) {
      console.error('Error fetching players:', playersError);
      return;
    }

    const existingPlayer = players.find(p => p.user_id === userId);
    if (existingPlayer) {
      setRoomCode(code);
      setRoomId(room.id);
      setIsHost(room.creator_id === userId);
      const clientPos = existingPlayer.role === 'spectator' ? 'bottom' : existingPlayer.position;
      setMyPosition(clientPos as any);
      await fetchRoomState(room.id, clientPos as any);
      return;
    }

    const activePlayers = players.filter(p => p.role !== 'spectator');
    const isRoomFull = activePlayers.length >= 4;
    const isSpectator = isRoomFull || room.status === 'playing';

    let myPos: PlayerPosition;
    let role = 'player';

    if (isSpectator) {
      myPos = `spec_${userId.substring(0, 10)}` as any;
      role = 'spectator';
    } else {
      const takenPositions = activePlayers.map(p => p.position);
      const orderAbs: PlayerPosition[] = ['bottom', 'left', 'top', 'right'];
      const foundPos = orderAbs.find(pos => !takenPositions.includes(pos));
      if (!foundPos) {
        alert('Room is full!');
        return;
      }
      myPos = foundPos;
    }

    const { error: playerError } = await supabase
      .from('twenty_nine_players')
      .insert({
        room_id: room.id,
        user_id: userId,
        name: nick + (role === 'spectator' ? ' (Spectator)' : ''),
        position: myPos,
        is_ai: false,
        role: role
      } as any);

    if (playerError) {
      console.error('Error adding player:', playerError);
      alert(`Error joining room: ${playerError.message}\n\nDid you run the SQL migration (supabase_future_enhancements.sql) in your Supabase SQL Editor?`);
      return;
    }

    setRoomCode(code);
    setRoomId(room.id);
    setIsHost(false);
    
    const clientPos = role === 'spectator' ? 'bottom' : myPos;
    setMyPosition(clientPos);

    await fetchRoomState(room.id, clientPos);
  };

  const exitRoom = async () => {
    if (!roomId) return;

    if (isHost) {
      await supabase.from('twenty_nine_rooms').delete().eq('id', roomId);
    } else {
      await supabase
        .from('twenty_nine_players')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', userId);
    }

    setRoomCode(null);
    setRoomId(null);
    setIsHost(false);
    setMyPosition('bottom');
    setState(INITIAL_STATE);
  };

  const sendReaction = async (emoji: string | null, message: string | null) => {
    if (!roomId) return;
    const reactionObj = {
      emoji: emoji || null,
      message: message || null,
      timestamp: Date.now()
    };
    const { data: dbRoom } = await supabase
      .from('twenty_nine_rooms')
      .select('active_reactions')
      .eq('id', roomId)
      .single();
    const currentReactions = dbRoom?.active_reactions || {};
    const updatedReactions = {
      ...currentReactions,
      [myPosition]: reactionObj
    };
    const cleanReactions: any = {};
    Object.keys(updatedReactions).forEach(key => {
      const reaction = updatedReactions[key];
      if (reaction && Date.now() - reaction.timestamp < 3000) {
        cleanReactions[key] = reaction;
      }
    });
    await supabase
      .from('twenty_nine_rooms')
      .update({ active_reactions: cleanReactions } as any)
      .eq('id', roomId);
  };

  const addAIBot = async (localPos: PlayerPosition) => {
    if (!roomId || !isHost) return;
    const absPos = localToDb(localPos, myPosition);
    
    await supabase.from('twenty_nine_players').insert({
      room_id: roomId,
      user_id: generateUUID(),
      name: `AI ${localPos.charAt(0).toUpperCase() + localPos.slice(1)}`,
      position: absPos,
      is_ai: true
    } as any);
  };

  const removePlayerOrBot = async (localPos: PlayerPosition) => {
    if (!roomId || !isHost) return;
    const absPos = localToDb(localPos, myPosition);
    await supabase
      .from('twenty_nine_players')
      .delete()
      .eq('room_id', roomId)
      .eq('position', absPos);
  };

  const startOnlineGame = async () => {
    if (!roomId || !isHost) return;
    
    const { data: dbPlayers, error: fetchErr } = await supabase
      .from('twenty_nine_players')
      .select('*')
      .eq('room_id', roomId);
      
    if (fetchErr || !dbPlayers) {
      alert(`Failed to fetch players: ${fetchErr?.message}`);
      return;
    }
    
    const takenPositions = dbPlayers.map(p => p.position);
    const allPositions: PlayerPosition[] = ['bottom', 'left', 'top', 'right'];
    for (const pos of allPositions) {
      if (!takenPositions.includes(pos)) {
        const { error: botErr } = await supabase.from('twenty_nine_players').insert({
          room_id: roomId,
          user_id: generateUUID(),
          name: `AI Bot`,
          position: pos,
          is_ai: true
        } as any);
        if (botErr) {
          alert(`Failed to add bot for ${pos}: ${botErr.message}`);
          return;
        }
      }
    }

    // Query players again to ensure we have the newly added bots in our list
    const { data: latestPlayers, error: latestErr } = await supabase
      .from('twenty_nine_players')
      .select('*')
      .eq('room_id', roomId);

    if (latestErr || !latestPlayers) {
      alert(`Failed to refresh players: ${latestErr?.message}`);
      return;
    }

    const { error: roomErr } = await supabase
      .from('twenty_nine_rooms')
      .update({
        status: 'playing',
        phase: 'dealing_1'
      } as any)
      .eq('id', roomId);
      
    if (roomErr) {
      alert(`Failed to start game: ${roomErr.message}`);
      return;
    }
      
    dealFirstHalfOnline(latestPlayers || dbPlayers);
  };

  const fetchRoomState = async (rId: string, currentMyPos: PlayerPosition) => {
    const { data: dbRoom } = await supabase
      .from('twenty_nine_rooms')
      .select('*')
      .eq('id', rId)
      .single();
      
    const { data: dbPlayers } = await supabase
      .from('twenty_nine_players')
      .select('*')
      .eq('room_id', rId);

    if (dbRoom && dbPlayers) {
      const isSpec = dbPlayers.some(p => p.user_id === userId && p.role === 'spectator');
      
      const handsQuery = supabase.from('twenty_nine_hands').select('*').eq('room_id', rId);
      const creatorId = dbRoom?.creator_id;
      const isHostPlayer = creatorId === userId;
      if (!isHostPlayer && !isSpec) {
        handsQuery.eq('position', currentMyPos);
      }
      const { data: dbHands } = await handsQuery;

      if (dbHands) {
        const nextLocalState = mapDbRoomToLocalState(dbRoom, dbPlayers, dbHands, currentMyPos, isSpec);
        setState(nextLocalState);
        setPlayersList(dbPlayers);
      }
    }
  };

  const replacePlayerWithAI = async (localPos: PlayerPosition) => {
    if (!roomId) return;
    const absPos = localToDb(localPos, myPosition);
    
    await supabase
      .from('twenty_nine_players')
      .update({
        is_ai: true,
        name: `AI ${localPos.charAt(0).toUpperCase() + localPos.slice(1)}`
      } as any)
      .eq('room_id', roomId)
      .eq('position', absPos);
  };

  const updateGameMessage = async (msg: string) => {
    if (!roomId) return;
    await supabase
      .from('twenty_nine_rooms')
      .update({ game_message: msg } as any)
      .eq('id', roomId);
  };

  const dealFirstHalfOnline = async (players: any[] = playersListRef.current) => {
    if (!roomId || !isHost) return;
    
    const deck = shuffleDeck(createDeck());
    const absHands = {
      bottom: sortHand(deck.slice(0, 4)),
      left: sortHand(deck.slice(4, 8)),
      top: sortHand(deck.slice(8, 12)),
      right: sortHand(deck.slice(12, 16))
    };
    
    const hasZeroPoints = Object.values(absHands).some(hand => hand.reduce((sum, c) => sum + c.value, 0) === 0);
    if (hasZeroPoints) {
      return dealFirstHalfOnline(players);
    }
    
    const { error: deleteErr } = await supabase.from('twenty_nine_hands').delete().eq('room_id', roomId);
    if (deleteErr) {
      alert(`Failed to delete old hands: ${deleteErr.message}`);
      return;
    }
    
    const handsToInsert = Object.keys(absHands).map(pos => {
      const position = pos as PlayerPosition;
      return {
        room_id: roomId,
        position: position,
        user_id: position === 'bottom' ? userId : (players.find(p => p.position === position)?.user_id || userId),
        cards: absHands[position]
      };
    });
    const { error: insertErr } = await supabase.from('twenty_nine_hands').insert(handsToInsert as any);
    if (insertErr) {
      alert(`Failed to insert hands: ${insertErr.message}`);
      return;
    }
    
    const cardCounts = {
      bottom: absHands.bottom.length,
      left: absHands.left.length,
      top: absHands.top.length,
      right: absHands.right.length
    };
    
    const { error: updateErr } = await supabase
      .from('twenty_nine_rooms')
      .update({
        phase: 'bidding',
        active_bidder: 'right',
        bidding_queue: ['left', 'top'],
        highest_bidder: 'right',
        challenger: 'bottom',
        current_bid: 15,
        is_doubled: false,
        is_redoubled: false,
        is_single_hand: false,
        game_message: null,
        trump_suit: null,
        hidden_trump_card: null,
        trump_revealed: false,
        trump_revealer: null,
        pair_revealed_by: null,
        pair_points_added: false,
        current_trick: { leadPlayer: 'right', leadSuit: null, cards: { bottom: null, left: null, top: null, right: null }, winner: null, points: 0 },
        last_trick: null,
        tricks_won: { bottom: [], left: [], top: [], right: [] },
        scores: stateRef.current.scores || { team1: 0, team2: 0 },
        round_points: { team1: 0, team2: 0 },
        passed_players: [],
        card_counts: cardCounts,
        remaining_deck: deck.slice(16, 32)
      } as any)
      .eq('id', roomId);

    if (updateErr) {
      alert(`Failed to update room to bidding phase: ${updateErr.message}`);
      return;
    }
  };

  const dealSecondHalfOnline = async () => {
    if (!roomId || !isHost) return;
    
    const { data: dbRoom } = await supabase
      .from('twenty_nine_rooms')
      .select('*')
      .eq('id', roomId)
      .single();
      
    if (!dbRoom) return;
    
    const rem = dbRoom.remaining_deck as Card[];
    const hiddenTrump = dbRoom.hidden_trump_card as Card | null;
    const bidWinner = dbRoom.bid_winner as PlayerPosition;
    
    const { data: dbHands } = await supabase
      .from('twenty_nine_hands')
      .select('*')
      .eq('room_id', roomId);
      
    if (!dbHands) return;
    
    const getSortedWithHidden = (player: PlayerPosition, currentCards: Card[], newCards: Card[]) => {
      const allCards = [...currentCards, ...newCards];
      if (hiddenTrump && bidWinner === player && !hiddenTrump.id.startsWith('dummy_')) {
         const hiddenSuit = hiddenTrump.suit;
         const hiddenRank = hiddenTrump.rank;
         const otherCards = allCards.filter(c => !(c.suit === hiddenSuit && c.rank === hiddenRank));
         const sortedOthers = sortHand(otherCards);
         sortedOthers.splice(6, 0, hiddenTrump);
         return sortedOthers;
      }
      return sortHand(allCards);
    };

    const updatedAbsHands: Record<PlayerPosition, Card[]> = {} as any;
    const orderAbs: PlayerPosition[] = ['bottom', 'left', 'top', 'right'];
    for (let i = 0; i < 4; i++) {
      const pos = orderAbs[i];
      const handRow = dbHands.find(h => h.position === pos);
      const currentCards = handRow ? (handRow.cards as Card[]) : [];
      const newCards = rem.slice(i * 4, (i + 1) * 4);
      const finalHand = getSortedWithHidden(pos, currentCards, newCards);
      
      updatedAbsHands[pos] = finalHand;
      
      await supabase
        .from('twenty_nine_hands')
        .update({ cards: finalHand } as any)
        .eq('room_id', roomId)
        .eq('position', pos);
    }
    
    const cardCounts = {
      bottom: updatedAbsHands.bottom.length,
      left: updatedAbsHands.left.length,
      top: updatedAbsHands.top.length,
      right: updatedAbsHands.right.length
    };
    
    await supabase
      .from('twenty_nine_rooms')
      .update({
        phase: 'single_hand_decision',
        active_bidder: bidWinner,
        remaining_deck: [],
        card_counts: cardCounts,
        game_message: null
      } as any)
      .eq('id', roomId);
  };

  // --- Realtime Subscriptions ---
  useEffect(() => {
    if (state.mode !== 'multiplayer' || !roomId) return;

    const roomChannel = supabase.channel(`room_sync_${roomId}`);
    
    roomChannel
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'twenty_nine_rooms',
        filter: `id=eq.${roomId}`
      }, async (payload) => {
        if (isLocalActionRef.current) {
          isLocalActionRef.current = false;
          return;
        }

        const dbRoom = payload.new;
        const currentLocalState = stateRef.current;
        const phaseChanged = dbRoom.phase !== currentLocalState.phase;
        
        // Only perform a full DB select fetch if:
        // 1. Phase changed (e.g. lobby to bidding, set_trump to dealing_2)
        // 2. Local state is not yet populated
        const needsFullFetch = phaseChanged || 
                               !currentLocalState.players || 
                               Object.values(currentLocalState.players).some(p => p.id === '') || 
                               !currentLocalState.hands ||
                               currentLocalState.hands.bottom.length === 0;

        if (needsFullFetch) {
          console.log('[Room Subscription] Phase changed or state unpopulated, performing full DB fetch');
          const { data: dbPlayers } = await supabase
            .from('twenty_nine_players')
            .select('*')
            .eq('room_id', roomId);
            
          const isSpec = dbPlayers ? dbPlayers.some(p => p.user_id === userId && p.role === 'spectator') : false;

          const handsQuery = supabase.from('twenty_nine_hands').select('*').eq('room_id', roomId);
          if (!isHost && !isSpec) {
            handsQuery.eq('position', myPosition);
          }
          const { data: dbHands } = await handsQuery;

          if (dbPlayers && dbHands) {
            // Referee Marriage / Pair Check
            if (isHost && dbRoom.trump_revealed && !dbRoom.pair_revealed_by && dbRoom.trump_suit) {
              const tSuit = dbRoom.trump_suit;
              let pairPos: string | null = null;
              for (const h of dbHands) {
                const cards = h.cards as Card[];
                const hasKing = cards.some(c => c.suit === tSuit && c.rank === 'K');
                const hasQueen = cards.some(c => c.suit === tSuit && c.rank === 'Q');
                if (hasKing && hasQueen) {
                  pairPos = h.position;
                  break;
                }
              }
              if (pairPos) {
                await supabase
                  .from('twenty_nine_rooms')
                  .update({ pair_revealed_by: pairPos } as any)
                  .eq('id', roomId);
                return; // wait for next update triggered by this change
              }
            }

            const nextLocalState = mapDbRoomToLocalState(dbRoom, dbPlayers, dbHands, myPosition, isSpec);
            
            setState(prev => ({
              ...nextLocalState,
              settings: prev.settings
            }));
          }
        } else {
          // Perform synchronous local state merge to avoid DB select roundtrips
          console.log('[Room Subscription] Fast synchronous state merge');
          setState(prev => {
            const dbPrevState = rotateStateLocalToDb(prev, myPosition);
            const absPlayers = dbPrevState.players;
            const absHands = { ...dbPrevState.hands };
            
            const isSpec = playersListRef.current.some(p => p.user_id === userId && p.role === 'spectator');

            if (isSpec) {
              order.forEach(pos => {
                const count = dbRoom.card_counts?.[pos] || 0;
                absHands[pos] = Array.from({ length: count }).map((_, idx) => ({
                  id: `dummy_${pos}_${idx}`,
                  suit: 'hearts',
                  rank: '7',
                  value: 0
                }));
              });
            } else {
              const isHostPlayer = dbRoom.creator_id === userId;
              order.forEach(pos => {
                if (pos === myPosition) return;
                if (!isHostPlayer) {
                  const count = dbRoom.card_counts?.[pos] || 0;
                  const currentCount = absHands[pos]?.length || 0;
                  if (currentCount !== count) {
                    absHands[pos] = Array.from({ length: count }).map((_, idx) => ({
                      id: `dummy_${pos}_${idx}`,
                      suit: 'hearts',
                      rank: '7',
                      value: 0
                    }));
                  }
                }
              });
            }

            // Referee Marriage / Pair Check (Synchronous check using local hands for host)
            if (isHost && dbRoom.trump_revealed && !dbRoom.pair_revealed_by && dbRoom.trump_suit) {
              const tSuit = dbRoom.trump_suit;
              let pairPos: string | null = null;
              for (const pos of Object.keys(absHands) as PlayerPosition[]) {
                const cards = absHands[pos] || [];
                const hasKing = cards.some(c => c.suit === tSuit && c.rank === 'K');
                const hasQueen = cards.some(c => c.suit === tSuit && c.rank === 'Q');
                if (hasKing && hasQueen) {
                  pairPos = pos;
                  break;
                }
              }
              if (pairPos) {
                supabase
                  .from('twenty_nine_rooms')
                  .update({ pair_revealed_by: pairPos } as any)
                  .eq('id', roomId);
              }
            }

            const absState = {
              mode: 'multiplayer' as const,
              phase: dbRoom.phase as any,
              players: absPlayers,
              myPosition: myPosition,
              hands: absHands,
              bids: (dbRoom.bids || []) as Bid[],
              currentBid: dbRoom.current_bid,
              highestBidder: dbRoom.highest_bidder as PlayerPosition | null,
              challenger: dbRoom.challenger as PlayerPosition | null,
              bidWinner: dbRoom.bid_winner as PlayerPosition | null,
              activeBidder: dbRoom.active_bidder as PlayerPosition,
              passedPlayers: (dbRoom.passed_players || []) as PlayerPosition[],
              biddingQueue: (dbRoom.bidding_queue || []) as PlayerPosition[],
              duelDefender: dbRoom.duel_defender as PlayerPosition | undefined,
              isDoubled: dbRoom.is_doubled,
              isRedoubled: dbRoom.is_redoubled,
              isSingleHand: dbRoom.is_single_hand,
              gameMessage: dbRoom.game_message,
              trumpSuit: dbRoom.trump_suit as Suit | null,
              hiddenTrumpCard: dbRoom.hidden_trump_card as Card | null,
              trumpRevealed: dbRoom.trump_revealed,
              trumpRevealer: dbRoom.trump_revealer as PlayerPosition | null,
              pairRevealedBy: dbRoom.pair_revealed_by as PlayerPosition | null,
              pairPointsAdded: dbRoom.pair_points_added,
              currentTrick: dbRoom.current_trick,
              lastTrick: dbRoom.last_trick,
              tricksWon: dbRoom.tricks_won,
              turn: dbRoom.turn as PlayerPosition,
              scores: dbRoom.scores,
              roundPoints: dbRoom.round_points,
              settings: prev.settings,
              activeReactions: dbRoom.active_reactions || {}
            };

            return rotateStateDbToLocal(absState, myPosition);
          });
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'twenty_nine_rooms',
        filter: `id=eq.${roomId}`
      }, () => {
        alert('Room has been closed by the host.');
        setRoomCode(null);
        setRoomId(null);
        setIsHost(false);
        setState(INITIAL_STATE);
      })
      .subscribe((status, err) => {
        console.log(`room sync status: ${status}`, err || '');
      });

    const playersChannel = supabase.channel(`players_sync_${roomId}`);
    playersChannel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'twenty_nine_players',
        filter: `room_id=eq.${roomId}`
      }, async () => {
        const { data: dbPlayers } = await supabase
          .from('twenty_nine_players')
          .select('*')
          .eq('room_id', roomId);
          
        if (dbPlayers) {
          const absPlayers: Record<PlayerPosition, { id: string; name: string; isAI: boolean }> = {
            bottom: { id: '', name: 'Empty', isAI: false },
            left: { id: '', name: 'Empty', isAI: false },
            top: { id: '', name: 'Empty', isAI: false },
            right: { id: '', name: 'Empty', isAI: false }
          };
          dbPlayers.forEach(p => {
            if (p.position === 'bottom' || p.position === 'left' || p.position === 'top' || p.position === 'right') {
              absPlayers[p.position as PlayerPosition] = {
                id: p.user_id,
                name: p.name,
                isAI: p.is_ai
              };
            }
          });

          const localPlayers = rotatePlayerMap(absPlayers, myPosition, 'dbToLocal');
          
          setState(prev => ({
            ...prev,
            players: localPlayers
          }));
          
          setPlayersList(dbPlayers);
        }
      })
      .subscribe((status, err) => {
        console.log(`players sync status: ${status}`, err || '');
      });

    const handChannel = supabase.channel(`hand_sync_${roomId}`);
    handChannel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'twenty_nine_hands',
        filter: `room_id=eq.${roomId}`
      }, async (payload: any) => {
        if (payload.new && payload.new.position === myPosition) {
          const newCards = payload.new.cards as Card[];
          setState(prev => ({
            ...prev,
            hands: {
              ...prev.hands,
              bottom: newCards
            }
          }));
        }
      })
      .subscribe((status, err) => {
        console.log(`hand sync status: ${status}`, err || '');
      });

    return () => {
      roomChannel.unsubscribe();
      playersChannel.unsubscribe();
      handChannel.unsubscribe();
    };
  }, [roomId, myPosition, isHost, state.mode]);

  // --- Presence ---
  useEffect(() => {
    if (state.mode !== 'multiplayer' || !roomId) return;

    const presenceChannel = supabase.channel(`room_presence_${roomId}`);

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = presenceChannel.presenceState();
        const activeUserIds = new Set<string>();
        Object.values(presenceState).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p.user_id) activeUserIds.add(p.user_id);
          });
        });

        if (isHost && state.phase !== 'lobby' && state.phase !== 'multiplayer_lobby') {
          (Object.keys(state.players) as PlayerPosition[]).forEach(pos => {
            const p = state.players[pos];
            if (p && !p.isAI && p.id !== userId) {
              const isOnline = activeUserIds.has(p.id);
              if (!isOnline) {
                if (!disconnectTimersRef.current[pos]) {
                  disconnectTimersRef.current[pos] = setTimeout(() => {
                    replacePlayerWithAI(pos);
                    disconnectTimersRef.current[pos] = null;
                  }, 60000);
                  updateGameMessage(`Player ${p.name} disconnected. Replacing with AI in 60s...`);
                }
              } else {
                if (disconnectTimersRef.current[pos]) {
                  clearTimeout(disconnectTimersRef.current[pos]);
                  disconnectTimersRef.current[pos] = null;
                  updateGameMessage(`Player ${p.name} reconnected.`);
                }
              }
            }
          });
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ user_id: userId, name: nickname });
        }
      });

    return () => {
      presenceChannel.unsubscribe();
      Object.keys(disconnectTimersRef.current).forEach(key => {
        const pos = key as PlayerPosition;
        if (disconnectTimersRef.current[pos]) {
          clearTimeout(disconnectTimersRef.current[pos]);
          disconnectTimersRef.current[pos] = null;
        }
      });
    };
  }, [roomId, isHost, state.players, state.phase, state.mode]);

  // --- Game State Modifying Handlers ---

  const startGame = (mode: 'ai' | 'multiplayer') => {
    if (mode === 'multiplayer') {
      startOnlineGame();
    } else {
      setState(prev => ({ ...prev, mode, phase: 'dealing_1' }));
      dealFirstHalf();
    }
  };

  const updateSettings = (speed: 'normal' | 'fast', theme: 'wooden' | 'green') => {
    setState(prev => ({
      ...prev,
      settings: { speed, theme }
    }));
  };

  const dealFirstHalf = () => {
    const deck = shuffleDeck(createDeck());
    const newHands = {
      bottom: sortHand(deck.slice(0, 4)),
      left: sortHand(deck.slice(4, 8)),
      top: sortHand(deck.slice(8, 12)),
      right: sortHand(deck.slice(12, 16))
    };
    
    const hasZeroPoints = Object.values(newHands).some(hand => hand.reduce((sum, c) => sum + c.value, 0) === 0);
    if (hasZeroPoints) {
      return dealFirstHalf();
    }
    
    setState(prev => ({
      ...prev,
      phase: 'bidding',
      hands: newHands,
      remainingDeck: deck.slice(16, 32),
      activeBidder: 'right',
      biddingQueue: ['left', 'top'],
      highestBidder: 'right',
      challenger: 'bottom',
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
      pairRevealedBy: null,
      pairPointsAdded: false,
      currentTrick: { leadPlayer: 'right', leadSuit: null, cards: { bottom: null, left: null, top: null, right: null }, winner: null, points: 0 },
      lastTrick: null,
      tricksWon: { bottom: [], left: [], top: [], right: [] },
      roundPoints: { team1: 0, team2: 0 },
      passedPlayers: []
    } as any));
  };

  const placeBid = (amount: number | 'pass') => {
    updateStateAndSync(prev => {
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
        newActiveBidder = newHighestBidder!;
      } else if (amount === 'redouble') {
        isRedoubled = true;
        nextPhase = 'set_trump';
        bidWinner = newHighestBidder;
        newActiveBidder = bidWinner!;
      } else {
        const validBids = newBids.filter(b => typeof b.amount === 'number');
        const hasValidBid = validBids.length > 0;

        if (!hasValidBid) {
          if (amount === 'pass') {
            newPassedPlayers = [...newPassedPlayers, prev.activeBidder];
            if (newPassedPlayers.length === 4) {
              if (prev.mode === 'multiplayer') {
                if (isHost) {
                  setTimeout(dealFirstHalfOnline, 1000);
                }
              } else {
                setTimeout(dealFirstHalf, 1000);
              }
              return { ...prev, bids: newBids, currentBid: 15, passedPlayers: newPassedPlayers };
            }
            
            newHighestBidder = prev.challenger;
            if (newQueue.length > 0) {
              newChallenger = newQueue.shift()!;
            }
            newActiveBidder = newHighestBidder!;
          } else {
            currentBid = amount as number;
            newHighestBidder = prev.activeBidder;
            newActiveBidder = prev.challenger!;
            prev.duelDefender = prev.activeBidder;
          }
        } else {
          if (amount === 'pass') {
            newPassedPlayers = [...newPassedPlayers, prev.activeBidder];
            
            if (prev.activeBidder === prev.highestBidder) {
              newHighestBidder = prev.challenger;
              if (newQueue.length > 0) {
                newChallenger = newQueue.shift()!;
                newActiveBidder = newChallenger;
                prev.duelDefender = newHighestBidder;
              } else {
                nextPhase = 'doubling_phase';
                bidWinner = newHighestBidder;
                newActiveBidder = (bidWinner === 'bottom' || bidWinner === 'top') ? 'right' : 'bottom';
              }
            } else if (prev.activeBidder === prev.challenger) {
              if (newQueue.length > 0) {
                newChallenger = newQueue.shift()!;
                newActiveBidder = newChallenger;
                prev.duelDefender = newHighestBidder;
              } else {
                nextPhase = 'doubling_phase';
                bidWinner = newHighestBidder;
                newActiveBidder = (bidWinner === 'bottom' || bidWinner === 'top') ? 'right' : 'bottom';
              }
            }
          } else {
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
    updateStateAndSync(prev => {
      if (action === 'double') {
        const nextPhase = 'redoubling_phase';
        const newActiveBidder = (prev.bidWinner === 'bottom' || prev.bidWinner === 'top') ? 'bottom' : 'right';
        const msg = prev.activeBidder === 'bottom' ? "You doubled the game!" : `${prev.players[prev.activeBidder]?.name || 'Player'} doubled the game!`;
        return { ...prev, isDoubled: true, phase: nextPhase, activeBidder: newActiveBidder, gameMessage: msg };
      } else {
        return { ...prev, phase: 'set_trump', activeBidder: prev.bidWinner!, gameMessage: null };
      }
    });
  };

  const handleRedoubleDecision = (action: 'redouble' | 'cancel') => {
    updateStateAndSync(prev => {
      if (action === 'redouble') {
        const msg = prev.activeBidder === 'bottom' ? "You redoubled the game!" : `${prev.players[prev.activeBidder]?.name || 'Player'} redoubled the game!`;
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
    console.log(`[Single Hand Decision] Action chosen: ${action}`);
    updateStateAndSync(prev => {
      console.log(`[Single Hand Decision] prev.isSingleHand was: ${prev.isSingleHand}`);
      if (action === 'yes') {
        if (prev.bidWinner === 'bottom') {
          matchSingleHandsTriedRef.current += 1;
        }
        return {
          ...prev,
          isSingleHand: true,
          phase: 'playing',
          trumpRevealed: false,
          trumpSuit: null,
          hiddenTrumpCard: null,
          turn: prev.bidWinner!
        };
      } else {
        return { 
          ...prev, 
          isSingleHand: false,
          phase: 'playing',
          turn: 'right'
        };
      }
    });
  };

  useEffect(() => {
    if (state.phase === 'dealing_2') {
      if (state.mode === 'multiplayer') {
        if (isHost) {
          const timer = setTimeout(dealSecondHalfOnline, 1000);
          return () => clearTimeout(timer);
        }
      } else {
        const timer = setTimeout(dealSecondHalf, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [state.phase, state.mode, isHost]);

  const setTrump = (suitOrCard: Suit | Card | '7th_card') => {
    updateStateAndSync((prev: any) => {
      let hiddenCard: Card;
      let newHand = [...prev.hands[prev.activeBidder]];
      if (suitOrCard === '7th_card') {
        const playerIndex = ['bottom', 'left', 'top', 'right'].indexOf(prev.activeBidder);
        const rem = prev.remainingDeck;
        hiddenCard = rem[playerIndex * 4 + 2];
      } else {
        hiddenCard = suitOrCard as Card;
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
    updateStateAndSync(prev => {
      if (!prev.hiddenTrumpCard || prev.trumpRevealed) return prev;
      
      const newHands = { ...prev.hands };
      if (!prev.hiddenTrumpCard.id.startsWith('dummy_')) {
        const bidderHand = newHands[prev.bidWinner!];
        if (!bidderHand.some(c => c.id === prev.hiddenTrumpCard!.id)) {
          newHands[prev.bidWinner!] = sortHand([...bidderHand, prev.hiddenTrumpCard]);
        } else {
          newHands[prev.bidWinner!] = sortHand(bidderHand);
        }
      }

      let pairRevealedBy: PlayerPosition | null = null;
      const tSuit = prev.hiddenTrumpCard.suit;
      
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
    updateStateAndSync(prev => {
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
      
      const cardsPlayed = Object.values(newTrickCards).filter(c => c !== null).length;
      const requiredCards = prev.isSingleHand ? 3 : 4;
      
      if (cardsPlayed === requiredCards) {
        const winner = evaluateTrick(newTrick, prev.trumpSuit, prev.trumpRevealed);
        const points = calculateTrickPoints(newTrick);
        newTrick.winner = winner;
        newTrick.points = points;
        
        if (prev.mode !== 'multiplayer') {
          setTimeout(() => resolveTrick(newTrick), 1500);
        }
        nextTurn = player;
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
    updateStateAndSync(prev => {
      const winner = trick.winner!;
      const newTricksWon = { ...prev.tricksWon, [winner]: [...prev.tricksWon[winner], trick] };
      
      const team1Points = (newTricksWon.bottom.reduce((sum, t) => sum + t.points, 0) + newTricksWon.top.reduce((sum, t) => sum + t.points, 0));
      const team2Points = (newTricksWon.left.reduce((sum, t) => sum + t.points, 0) + newTricksWon.right.reduce((sum, t) => sum + t.points, 0));

      const bidTeam = (prev.bidWinner === 'bottom' || prev.bidWinner === 'top') ? 'team1' : 'team2';
      const winnerTeam = (winner === 'bottom' || winner === 'top') ? 'team1' : 'team2';

      const totalTricks = Object.values(newTricksWon).reduce((sum, tricks) => sum + tricks.length, 0);
      
      if (prev.isSingleHand) {
        if (winnerTeam !== bidTeam) {
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
    let bidAmount = state.currentBid;

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

    // Track stats if the user was the bid winner
    if (state.bidWinner === 'bottom') {
      if (team1Won) {
        if (state.isSingleHand) {
          matchSingleHandsWonRef.current += 1;
        }
        if (bidAmount > matchHighestBidWonRef.current) {
          matchHighestBidWonRef.current = bidAmount;
        }
      }
    }

    console.log(`[Round End Calculation]`, {
      bidTeam,
      bidAmount,
      isSingleHand: state.isSingleHand,
      isDoubled: state.isDoubled,
      isRedoubled: state.isRedoubled,
      stakes,
      roundPoints: state.roundPoints,
      team1Won,
      t1ScoreBefore: state.scores.team1,
      t2ScoreBefore: state.scores.team2,
      t1ScoreAfter: t1Score,
      t2ScoreAfter: t2Score
    });

    t1Score = Math.max(-6, Math.min(6, t1Score));
    t2Score = Math.max(-6, Math.min(6, t2Score));

    const isGameOver = (t1Score >= 6 || t1Score <= -6 || t2Score >= 6 || t2Score <= -6);
    const nextPhase = isGameOver ? 'game_over' : 'round_over';

    return {
      ...state,
      phase: nextPhase,
      scores: { team1: t1Score, team2: t2Score },
      lastRoundResult: { team1Won }
    };
  };

  // --- Multiplayer Host Trick Resolver ---
  useEffect(() => {
    if (state.mode !== 'multiplayer' || !isHost) return;
    if (state.phase !== 'playing') return;

    const cardsPlayed = Object.values(state.currentTrick.cards).filter(c => c !== null).length;
    const requiredCards = state.isSingleHand ? 3 : 4;

    if (cardsPlayed === requiredCards && !state.currentTrick.winner) {
      const winner = evaluateTrick(state.currentTrick, state.trumpSuit, state.trumpRevealed);
      const points = calculateTrickPoints(state.currentTrick);
      
      const completedTrick: Trick = {
        ...state.currentTrick,
        winner,
        points
      };

      console.log('[Host Trick Resolver] Trick is complete, scheduling resolution');
      const timer = setTimeout(() => {
        resolveTrick(completedTrick);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state.currentTrick, state.phase, state.mode, isHost, state.isSingleHand, state.trumpSuit, state.trumpRevealed]);

  // --- AI LOGIC ---
  useEffect(() => {
    const isMultiplayerAI = state.mode === 'multiplayer' && isHost;
    if (state.mode !== 'ai' && !isMultiplayerAI) return;

    if (state.phase === 'bidding') {
      const currentBidder = state.activeBidder;
      const currentPhase = state.phase;
      const activePlayer = state.players[currentBidder];
      if (activePlayer && activePlayer.isAI) {
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
                bidToPlace = latestState.currentBid;
              }
            } else {
              if (targetBid > latestState.currentBid) {
                bidToPlace = latestState.currentBid === 15 ? 16 : latestState.currentBid + 1;
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
      if (activePlayer && activePlayer.isAI) {
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
      if (activePlayer && activePlayer.isAI) {
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
      if (activePlayer && activePlayer.isAI) {
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
      if (activePlayer && activePlayer.isAI) {
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
          if (hand && hand.length > 0) {
            const suitScores = hand.reduce((acc, card) => {
              acc[card.suit] = (acc[card.suit] || 0) + (card.value * 2) + 1;
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
              setTrump('7th_card');
            } else {
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
      if (activePlayer && activePlayer.isAI && Object.values(state.currentTrick.cards).filter(c => c !== null).length < requiredCards) {
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

          if (latestState.currentTrick.cards[currentTurn] !== null) {
            return;
          }
          const hand = latestState.hands[currentTurn];
          if (hand && hand.length > 0) {
            let localHand = [...hand];
            let isTrumpRevealedLocal = latestState.trumpRevealed;
            
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

            const playedCards: Card[] = [];
            Object.values(latestState.tricksWon).forEach((tricks: any[]) => {
              tricks.forEach(t => {
                Object.values(t.cards).forEach((c: any) => {
                  if (c) playedCards.push(c);
                });
              });
            });
            Object.values(latestState.currentTrick.cards).forEach((c: any) => {
              if (c) playedCards.push(c);
            });

            const difficulty = localStorage.getItem('ju_twenty_nine_ai_difficulty') || 'medium';
            const validMoves = getValidMoves(localHand, latestState.currentTrick.leadSuit, latestState.trumpSuit, isTrumpRevealedLocal);
            const cardToPlay = getBestAIPlay(
              validMoves, 
              latestState.currentTrick, 
              latestState.trumpSuit, 
              isTrumpRevealedLocal, 
              currentTurn, 
              difficulty as any, 
              playedCards
            );
            playCard(currentTurn, cardToPlay);
          }
        }, state.settings.speed === 'fast' ? 500 : 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [state.phase, state.turn, state.activeBidder, state.mode, state.currentTrick.cards, isHost]);

  const returnToLobby = () => {
    if (state.mode === 'multiplayer') {
      exitRoom();
    } else {
      setState(INITIAL_STATE);
    }
  };

  const isSpectator = playersList.some(p => p.user_id === userId && p.role === 'spectator');

  return {
    state,
    roomCode,
    roomId,
    isHost,
    myPosition,
    playersList,
    nickname,
    saveNickname,
    createRoom,
    joinRoom,
    addAIBot,
    removePlayerOrBot,
    startOnlineGame,
    exitRoom,
    startGame,
    placeBid,
    handleDoubleDecision,
    handleRedoubleDecision,
    handleSingleHandDecision,
    setTrump,
    revealTrump,
    playCard,
    updateSettings,
    returnToLobby,
    profile,
    loadingProfile,
    sendReaction,
    isSpectator
  };
};
