import React, { useState, useEffect, useRef } from 'react';
import { useTwentyNine } from './useTwentyNine';
import { CardUI } from './CardUI';
import { PlayerPosition } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { playCardSwoosh, playDealSound, playTrickWinSound } from './audio';
import GameLoginModal from '@/components/GameLoginModal';
import { shortenName } from './utils';
import { supabase } from '@/integrations/supabase/client';
import { 
  Trophy, 
  BarChart3, 
  LogOut, 
  ShieldCheck, 
  Award, 
  Medal, 
  Gamepad2, 
  Zap,
  Target,
  Crown
} from 'lucide-react';

const getCoverTransform = (score: number) => {
  const S = Math.min(6, Math.abs(score));
  if (S === 0) return { y: 0, x: 0, rotate: 0 };
  if (S === 1) return { y: 13, x: 13, rotate: -38 };
  if (S === 2) return { y: 17, x: 0, rotate: 0 };
  if (S === 3) return { y: 27, x: 13, rotate: -38 };
  if (S === 4) return { y: 31, x: 0, rotate: 0 };
  if (S === 5) return { y: 41, x: 13, rotate: -38 };
  return { y: 56, x: 0, rotate: 0 }; // S === 6
};

const getTrickResolveAnimation = (winner: PlayerPosition | null): any => {
  if (!winner) return {};
  
  let targetX = 0;
  let targetY = 0;
  
  switch (winner) {
    case 'top':
      targetY = -250;
      break;
    case 'bottom':
      targetY = 250;
      break;
    case 'left':
      targetX = -250;
      break;
    case 'right':
      targetX = 250;
      break;
  }

  return {
    x: [null, 0, targetX],
    y: [null, 0, targetY],
    opacity: [null, 1, 0],
    scale: [null, 1, 0.3],
    transition: {
      times: [0, 0.3, 1],
      duration: 1.2,
      ease: "easeInOut"
    }
  };
};

export const TwentyNineBoard: React.FC = () => {
  const { 
    state, 
    startGame, 
    placeBid, 
    setTrump, 
    revealTrump, 
    playCard, 
    updateSettings, 
    handleDoubleDecision, 
    handleRedoubleDecision, 
    handleSingleHandDecision, 
    returnToLobby,
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
    profile,
    loadingProfile,
    sendReaction,
    isSpectator
  } = useTwentyNine();

  const prevTrickWinner = useRef<PlayerPosition | null>(null);

  // Stats and Leaderboard Modals state
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [leaderboardTab, setLeaderboardTab] = useState<'batch52' | 'guest'>('batch52');
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('ju_twenty_nine_sound_enabled') !== 'false');
  const [voiceEnabled, setVoiceEnabled] = useState(() => localStorage.getItem('ju_twenty_nine_voice_enabled') !== 'false');

  const toggleVoice = () => {
    const nextVal = !voiceEnabled;
    setVoiceEnabled(nextVal);
    localStorage.setItem('ju_twenty_nine_voice_enabled', String(nextVal));
  };

  const [showReactionPopup, setShowReactionPopup] = useState(false);
  const [aiDiff, setAiDiff] = useState<'easy' | 'medium' | 'hard'>(() => (localStorage.getItem('ju_twenty_nine_ai_difficulty') as any) || 'medium');

  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    localStorage.setItem('ju_twenty_nine_sound_enabled', String(nextVal));
  };

  const fetchLeaderboard = async (tab: 'batch52' | 'guest') => {
    setLoadingLeaderboard(true);
    try {
      const isVerified = tab === 'batch52';
      const { data, error } = await supabase
        .from('twenty_nine_profiles')
        .select('*')
        .eq('is_verified', isVerified)
        .order('games_won', { ascending: false })
        .order('games_played', { ascending: true })
        .limit(10);

      if (!error && data) {
        setLeaderboardData(data);
      } else {
        console.error('Error fetching leaderboard:', error);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    if (showLeaderboardModal) {
      fetchLeaderboard(leaderboardTab);
    }
  }, [showLeaderboardModal, leaderboardTab]);

  const renderProfileHUD = () => {
    if (!profile) return null;
    const isVerified = profile.is_verified;
    
    return (
      <div className="w-full max-w-md bg-gradient-to-br from-[#2a170b]/90 to-[#1b0e06]/95 border-2 border-amber-800/40 rounded-3xl p-5 shadow-2xl backdrop-blur-md flex flex-col gap-4 text-white relative overflow-hidden group">
        {/* Decorative lighting background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Profile Card Header */}
        <div className="flex items-center gap-3.5 z-10">
          <div className="relative">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl flex items-center justify-center text-2xl border-2 border-amber-400/40 shadow-inner">
              {isVerified ? '🎓' : '👑'}
            </div>
            {isVerified && (
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[8px] font-bold p-0.5 rounded-full border border-white shadow-md flex items-center justify-center w-4 h-4" title="Verified Member">
                ✓
              </span>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-lg font-black tracking-wide text-amber-300 truncate flex items-center gap-1.5 uppercase font-display">
              {profile.name}
              {isVerified && <ShieldCheck className="w-4 h-4 text-green-400 inline" />}
            </h4>
            {isVerified ? (
              <p className="text-[10px] text-amber-200/50 uppercase tracking-widest font-bold truncate mt-0.5">
                {profile.department} • {profile.hall}
              </p>
            ) : (
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">
                Guest Player
              </p>
            )}
          </div>
          
          <button 
            onClick={() => saveNickname('')} 
            className="p-2 hover:bg-red-500/10 hover:text-red-400 text-slate-400/70 rounded-xl transition-all active:scale-90"
            title="Sign Out / Change Profile"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        
        {/* Stats Buttons & Navigation */}
        <div className="grid grid-cols-2 gap-3 z-10 mt-1">
          <button
            onClick={() => setShowStatsModal(true)}
            className="flex items-center justify-center gap-2 py-3 bg-amber-500/10 border border-amber-500/20 hover:border-amber-400/40 hover:bg-amber-500/20 text-amber-300 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95 shadow-sm"
          >
            <BarChart3 className="w-4 h-4" />
            My Stats
          </button>
          <button
            onClick={() => {
              setLeaderboardTab(isVerified ? 'batch52' : 'guest');
              setShowLeaderboardModal(true);
            }}
            className="flex items-center justify-center gap-2 py-3 bg-amber-500 border border-amber-400 hover:brightness-110 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95 shadow-md shadow-amber-500/10"
          >
            <Trophy className="w-4 h-4" />
            Leaderboard
          </button>
        </div>
      </div>
    );
  };

  const renderScoreCard = (score: number, teamLabel: string) => {
    const isRed = score >= 0;
    const suit = isRed ? '♥' : '♠';
    const colorClass = isRed ? 'text-red-600' : 'text-slate-900';
    const coverBg = isRed ? 'bg-blue-800' : 'bg-red-800';
    const transform = getCoverTransform(score);

    return (
      <div className="flex flex-col items-center">
        <span className="text-white text-xs font-bold mb-1 shadow-black drop-shadow-md">{teamLabel}</span>
        <div className="relative w-10 h-14 bg-white rounded shadow-sm border border-gray-300 overflow-hidden select-none">
          {/* Top-Left Corner Label */}
          <div className={`absolute top-[2px] left-[2px] text-[7px] font-bold leading-none ${colorClass}`}>
            6<br/>{suit}
          </div>
          
          {/* Bottom-Right Corner Label (rotated 180) */}
          <div className={`absolute bottom-[2px] right-[2px] text-[7px] font-bold leading-none rotate-180 ${colorClass}`}>
            6<br/>{suit}
          </div>

          {/* 6 Pips in a 3x2 Grid */}
          <div className="absolute inset-0 flex items-center justify-center p-2 pointer-events-none">
            <div className="grid grid-cols-2 grid-rows-3 gap-x-2 gap-y-[5px]">
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <span 
                  key={idx} 
                  className={`text-[9px] leading-none select-none ${colorClass}`}
                >
                  {suit}
                </span>
              ))}
            </div>
          </div>

          {/* Top Cover Card */}
          <motion.div 
            animate={transform} 
            transition={{ type: 'spring', damping: 15 }}
            className={`absolute inset-0 ${coverBg} rounded shadow-[0_2px_4px_rgba(0,0,0,0.5)] border border-white flex items-center justify-center overflow-hidden z-10`}
          >
            <img 
              src="/cards/back.png" 
              alt="Card Back Pattern" 
              className="w-full h-full object-fill opacity-25 mix-blend-overlay pointer-events-none select-none"
            />
            <div className="absolute inset-[3px] border border-white/30 rounded-sm pointer-events-none" />
          </motion.div>
        </div>
      </div>
    );
  };

  // Lobby Tab States
  const [lobbyTab, setLobbyTab] = useState<'selection' | 'multiplayer_home' | 'join_room'>('selection');
  const [nickInput, setNickInput] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (nickname) {
      setNickInput(nickname);
    }
  }, [nickname]);

  const handleCopyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
    const currentCardsCount = Object.values(state.currentTrick?.cards || {}).filter(c => c !== null).length;
    if (currentCardsCount > prevTrickCards.current) {
      playCardSwoosh();
    }
    prevTrickCards.current = currentCardsCount;
  }, [state.currentTrick.cards]);

  const [showLastHand, setShowLastHand] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tempRevealTrump, setTempRevealTrump] = useState(false);

  useEffect(() => {
    if (state.trumpRevealed) {
      setTempRevealTrump(true);
      const timer = setTimeout(() => {
        setTempRevealTrump(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setTempRevealTrump(false);
    }
  }, [state.trumpRevealed]);

  if (!nickname) {
    return (
      <div className="relative w-full h-full min-h-screen bg-[#2d1b11] flex items-center justify-center">
        <GameLoginModal 
          gameTitle="Batchday Twenty-Nine Pro" 
          onStart={(nick) => saveNickname(nick)} 
        />
      </div>
    );
  }

  if (state.phase === 'lobby') {
    return (
      <div className="w-full h-full overflow-y-auto flex flex-col items-center justify-start py-12 px-4 gap-6 text-white max-w-4xl mx-auto scrollbar-thin">
        <div className="text-center mb-4">
          <h1 className="text-5xl md:text-8xl font-black font-display text-amber-500 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] mb-2 tracking-wide animate-pulse">
            ২৯ <span className="text-white font-sans">Twenty-Nine</span>
          </h1>
          <p className="text-amber-200/60 text-xs md:text-sm uppercase tracking-[0.2em]">The Ultimate Bengali Card Game</p>
        </div>

        {lobbyTab === 'selection' && renderProfileHUD()}

        {lobbyTab === 'selection' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mt-4">
            {/* Card 1: Play vs AI */}
            <div className="bg-[#3a2010]/70 backdrop-blur-md p-6 rounded-3xl border border-[#52321c] shadow-[0_15px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between items-center text-center group hover:border-amber-500/40 transition-all duration-300">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                🤖
              </div>
              <h3 className="text-2xl font-black text-amber-400 mb-2">Single Player</h3>
              <p className="text-slate-300/80 text-sm mb-4 max-w-[240px]">
                Challenge smart offline bots. Fast-paced, offline friendly, and perfect for practice.
              </p>
              
              {/* Bot Difficulty Selector */}
              <div className="w-full mb-4 flex flex-col items-center">
                <span className="text-[10px] text-amber-300/70 font-bold uppercase tracking-wider mb-2">Bot Difficulty</span>
                <div className="flex bg-[#1e1008]/80 p-1 rounded-xl border border-amber-800/20 w-full max-w-[220px]">
                  {([
                    { val: 'easy', label: 'Easy' },
                    { val: 'medium', label: 'Medium' },
                    { val: 'hard', label: 'Hard' }
                  ] as const).map(({ val, label }) => {
                    const active = aiDiff === val;
                    return (
                      <button
                        key={val}
                        onClick={() => {
                          localStorage.setItem('ju_twenty_nine_ai_difficulty', val);
                          setAiDiff(val);
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          active 
                            ? 'bg-gradient-to-b from-amber-500 to-amber-700 text-white border border-amber-400 shadow-md scale-105' 
                            : 'text-amber-100/50 hover:text-amber-200'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button 
                onClick={() => startGame('ai')}
                className="w-full py-4 bg-gradient-to-b from-[#a26842] to-[#734324] text-white border border-[#d6af84]/30 rounded-2xl font-bold text-lg hover:brightness-110 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] active:scale-98 transition-all"
              >
                Play vs AI
              </button>
            </div>

            {/* Card 2: Play Online Multiplayer */}
            <div className="bg-[#3a2010]/70 backdrop-blur-md p-6 rounded-3xl border border-[#52321c] shadow-[0_15px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between items-center text-center group hover:border-amber-500/40 transition-all duration-300">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                👥
              </div>
              <h3 className="text-2xl font-black text-amber-400 mb-2">Online Multiplayer</h3>
              <p className="text-slate-300/80 text-sm mb-6 max-w-[240px]">
                Create a private lobby, invite your friends, or start with bots. Real-time gameplay.
              </p>
              <button 
                onClick={() => setLobbyTab('multiplayer_home')}
                className="w-full py-4 bg-gradient-to-b from-amber-500 to-amber-700 text-white border-2 border-amber-400 rounded-2xl font-bold text-lg hover:brightness-110 hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] active:scale-98 transition-all"
              >
                Play with Friends
              </button>
            </div>
          </div>
        )}

        {lobbyTab === 'multiplayer_home' && (
          <div className="bg-[#3a2010]/80 backdrop-blur-md p-8 rounded-3xl border border-[#52321c] shadow-[0_20px_50px_rgba(0,0,0,0.6)] w-full max-w-md flex flex-col items-center">
            <h3 className="text-2xl font-black text-amber-400 mb-6 uppercase tracking-wider">Multiplayer</h3>
            
            <div className="w-full space-y-4 mb-8">
              <div>
                <label className="text-xs font-bold text-amber-300/70 uppercase tracking-widest block mb-2">Your Name</label>
                <input 
                  type="text" 
                  value={nickInput}
                  onChange={e => setNickInput(e.target.value.slice(0, 12))}
                  placeholder="Enter nickname..."
                  className="w-full bg-[#1e1008] border border-[#52321c] rounded-2xl px-5 py-4 text-white font-bold text-lg focus:outline-none focus:border-amber-400 text-center uppercase tracking-wider shadow-inner"
                />
              </div>
            </div>

            <div className="w-full space-y-3">
              <button 
                onClick={() => createRoom(nickInput)}
                disabled={!nickInput.trim()}
                className="w-full py-4 bg-gradient-to-b from-amber-500 to-amber-700 text-white border-2 border-amber-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl font-bold text-lg hover:brightness-110 active:scale-98 transition-all shadow-lg"
              >
                Create Private Room
              </button>
              
              <button 
                onClick={() => setLobbyTab('join_room')}
                disabled={!nickInput.trim()}
                className="w-full py-4 bg-[#52321c] border border-amber-500/20 text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl font-bold text-lg hover:bg-[#684128] active:scale-98 transition-all"
              >
                Join with Code
              </button>
              
              <button 
                onClick={() => setLobbyTab('selection')}
                className="w-full py-2 text-xs text-amber-200/50 hover:text-amber-200 uppercase tracking-widest font-bold mt-2"
              >
                Go Back
              </button>
            </div>
          </div>
        )}

        {lobbyTab === 'join_room' && (
          <div className="bg-[#3a2010]/80 backdrop-blur-md p-8 rounded-3xl border border-[#52321c] shadow-[0_20px_50px_rgba(0,0,0,0.6)] w-full max-w-md flex flex-col items-center">
            <h3 className="text-2xl font-black text-amber-400 mb-6 uppercase tracking-wider">Join Room</h3>
            
            <div className="w-full space-y-4 mb-8">
              <div>
                <label className="text-xs font-bold text-amber-300/70 uppercase tracking-widest block mb-2 text-center">Enter 6-Digit Room Code</label>
                <input 
                  type="text" 
                  value={joinCodeInput}
                  onChange={e => setJoinCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123 456"
                  className="w-full bg-[#1e1008] border border-[#52321c] rounded-2xl px-5 py-4 text-amber-400 font-black text-3xl tracking-[0.3em] focus:outline-none focus:border-amber-400 text-center shadow-inner"
                />
              </div>
            </div>

            <div className="w-full space-y-3">
              <button 
                onClick={() => joinRoom(joinCodeInput, nickInput)}
                disabled={joinCodeInput.length !== 6 || !nickInput.trim()}
                className="w-full py-4 bg-gradient-to-b from-amber-500 to-amber-700 text-white border-2 border-amber-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl font-bold text-lg hover:brightness-110 active:scale-98 transition-all shadow-lg"
              >
                Join Room
              </button>
              
              <button 
                onClick={() => setLobbyTab('multiplayer_home')}
                className="w-full py-3 bg-[#52321c]/40 border border-white/5 text-slate-300 rounded-2xl font-bold hover:bg-[#52321c]/60 active:scale-98 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (state.phase === 'multiplayer_lobby') {
    return (
      <div className="w-full h-full overflow-y-auto flex flex-col items-center justify-start py-12 px-4 text-white max-w-4xl mx-auto scrollbar-thin">
        {/* Lobby Container */}
        <div className="bg-[#3a2010]/80 backdrop-blur-md p-8 rounded-3xl border border-[#52321c] shadow-[0_20px_50px_rgba(0,0,0,0.7)] w-full max-w-2xl flex flex-col items-center relative">
          <div className="absolute top-4 right-4 bg-black/40 border border-white/10 px-3 py-1 rounded-full text-xs font-mono text-amber-400 flex items-center gap-1.5 shadow-inner">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
            Lobby Connected
          </div>

          <h2 className="text-3xl md:text-4xl font-black text-amber-500 drop-shadow mb-2 uppercase tracking-wide">Private Lobby</h2>
          
          {/* Room Code Display */}
          <div className="flex flex-col items-center my-6 p-4 bg-[#1e1008] border border-[#52321c] rounded-2xl shadow-inner w-full max-w-sm">
            <span className="text-[10px] text-amber-200/50 uppercase tracking-[0.2em] font-bold mb-1">Room Access Code</span>
            <div className="flex items-center gap-3">
              <span className="text-4xl md:text-5xl font-black text-white tracking-[0.1em]">{roomCode}</span>
              <button 
                onClick={handleCopyCode}
                className="p-2.5 bg-white/5 hover:bg-white/15 text-amber-300 border border-white/10 rounded-xl transition-all shadow-md active:scale-90"
              >
                {copied ? '✅' : '📋'}
              </button>
            </div>
            {copied && <span className="text-[10px] text-green-400 font-bold mt-1.5 uppercase tracking-wider animate-bounce">Code Copied!</span>}
          </div>

          {/* Seat Layout representing the Table */}
          <div className="w-full grid grid-cols-3 gap-3 aspect-square max-w-[340px] my-6 relative bg-[#1e1008] rounded-full border-4 border-[#52321c] p-4 shadow-inner">
            {/* Top Seat */}
            <div className="col-start-2 col-end-3 row-start-1 row-end-2 flex flex-col items-center justify-center">
              <span className="text-[9px] font-bold text-amber-200/40 uppercase mb-1">Top</span>
              {state.players.top?.id ? (
                <div className="flex flex-col items-center">
                  <div className="w-11 h-11 bg-slate-700 border-2 border-amber-400 shadow-md rounded-full flex items-center justify-center text-lg">🤖</div>
                  <span className="text-xs font-bold mt-1 truncate max-w-[70px] uppercase text-amber-300 text-center">{shortenName(state.players.top?.name || 'Empty')}</span>
                  {isHost && state.players.top.isAI && (
                    <button onClick={() => removePlayerOrBot('top')} className="text-[9px] text-red-400 font-bold hover:underline mt-0.5">Remove</button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-11 h-11 border-2 border-white/10 border-dashed rounded-full flex items-center justify-center text-white/20 text-xs">?</div>
                  {isHost ? (
                    <button onClick={() => addAIBot('top')} className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded px-1.5 py-0.5 font-bold mt-1 shadow-inner active:scale-95 transition-all">Add Bot</button>
                  ) : (
                    <span className="text-[10px] text-white/30 mt-1 uppercase font-bold text-center">Waiting...</span>
                  )}
                </div>
              )}
            </div>

            {/* Left Seat */}
            <div className="col-start-1 col-end-2 row-start-2 row-end-3 flex flex-col items-center justify-center">
              <span className="text-[9px] font-bold text-amber-200/40 uppercase mb-1">Left</span>
              {state.players.left?.id ? (
                <div className="flex flex-col items-center">
                  <div className="w-11 h-11 bg-slate-700 border-2 border-amber-400 shadow-md rounded-full flex items-center justify-center text-lg">👤</div>
                  <span className="text-xs font-bold mt-1 truncate max-w-[70px] uppercase text-amber-300 text-center">{shortenName(state.players.left?.name || 'Empty')}</span>
                  {isHost && state.players.left.isAI && (
                    <button onClick={() => removePlayerOrBot('left')} className="text-[9px] text-red-400 font-bold hover:underline mt-0.5">Remove</button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-11 h-11 border-2 border-white/10 border-dashed rounded-full flex items-center justify-center text-white/20 text-xs">?</div>
                  {isHost ? (
                    <button onClick={() => addAIBot('left')} className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded px-1.5 py-0.5 font-bold mt-1 shadow-inner active:scale-95 transition-all">Add Bot</button>
                  ) : (
                    <span className="text-[10px] text-white/30 mt-1 uppercase font-bold text-center">Waiting...</span>
                  )}
                </div>
              )}
            </div>

            {/* Center Label (29 Logo) */}
            <div className="col-start-2 col-end-3 row-start-2 row-end-3 flex items-center justify-center">
              <span className="text-2xl font-black text-amber-500 border border-amber-500/20 w-12 h-12 rounded-full flex items-center justify-center shadow-md bg-black/20">২৯</span>
            </div>

            {/* Right Seat */}
            <div className="col-start-3 col-end-4 row-start-2 row-end-3 flex flex-col items-center justify-center">
              <span className="text-[9px] font-bold text-amber-200/40 uppercase mb-1">Right</span>
              {state.players.right?.id ? (
                <div className="flex flex-col items-center">
                  <div className="w-11 h-11 bg-slate-700 border-2 border-amber-400 shadow-md rounded-full flex items-center justify-center text-lg">👤</div>
                  <span className="text-xs font-bold mt-1 truncate max-w-[70px] uppercase text-amber-300 text-center">{shortenName(state.players.right?.name || 'Empty')}</span>
                  {isHost && state.players.right.isAI && (
                    <button onClick={() => removePlayerOrBot('right')} className="text-[9px] text-red-400 font-bold hover:underline mt-0.5">Remove</button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-11 h-11 border-2 border-white/10 border-dashed rounded-full flex items-center justify-center text-white/20 text-xs">?</div>
                  {isHost ? (
                    <button onClick={() => addAIBot('right')} className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded px-1.5 py-0.5 font-bold mt-1 shadow-inner active:scale-95 transition-all">Add Bot</button>
                  ) : (
                    <span className="text-[10px] text-white/30 mt-1 uppercase font-bold text-center">Waiting...</span>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Seat (Always Us) */}
            <div className="col-start-2 col-end-3 row-start-3 row-end-4 flex flex-col items-center justify-center">
              <span className="text-[9px] font-bold text-amber-200/40 uppercase mb-1">You</span>
              <div className="flex flex-col items-center">
                <div className="w-11 h-11 bg-amber-600 border-2 border-white shadow-[0_0_10px_rgba(251,191,36,0.5)] rounded-full flex items-center justify-center text-lg">👑</div>
                <span className="text-xs font-black mt-1 text-white uppercase truncate max-w-[80px] text-center">{shortenName(state.players.bottom?.name || 'Empty')}</span>
              </div>
            </div>
          </div>

          <div className="w-full border-t border-[#52321c] my-4 pt-4 text-center">
            <span className="text-xs text-amber-200/50 font-bold tracking-wider uppercase">Lobby Participants ({playersList.filter(p => p.role !== 'spectator').length}/4)</span>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex flex-col sm:flex-row gap-3 mt-4">
            {isHost ? (
              <button 
                onClick={startOnlineGame}
                className="flex-1 py-4 bg-gradient-to-b from-amber-500 to-amber-700 border-2 border-amber-400 text-white rounded-2xl font-bold text-lg hover:brightness-110 active:scale-95 transition-all shadow-lg uppercase tracking-wider"
              >
                Start Game
              </button>
            ) : (
              <div className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-amber-200 font-bold tracking-wider text-center animate-pulse">
                {isSpectator ? "SPECTATING - WAITING FOR HOST TO START..." : "WAITING FOR HOST TO START..."}
              </div>
            )}
            
            <button 
              onClick={exitRoom}
              className="py-4 px-6 bg-[#52321c] text-slate-300 border border-white/5 hover:bg-[#684128] rounded-2xl font-bold text-lg active:scale-95 transition-all"
            >
              Exit Lobby
            </button>
          </div>
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
        if (state.phase === 'playing' && isPlayable && !isSpectator) {
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

  // Render a reaction bubble above avatars or hand
  const renderReactionBubble = (pos: PlayerPosition) => {
    const reaction = state.activeReactions?.[pos];
    if (!reaction) return null;
    
    // Show only if within 3 seconds (3000ms)
    const isRecent = Date.now() - reaction.timestamp < 3000;
    if (!isRecent) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.5, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: -10 }}
        exit={{ opacity: 0, scale: 0.8, y: -20 }}
        className="absolute -top-12 bg-amber-950/90 border border-amber-500/30 text-white font-bold text-xs px-3 py-2 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.5)] flex items-center gap-1.5 whitespace-nowrap z-50 pointer-events-none"
      >
        {reaction.emoji && <span className="text-lg">{reaction.emoji}</span>}
        {reaction.message && <span>{reaction.message}</span>}
      </motion.div>
    );
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
            <button 
              onClick={() => setShowReactionPopup(prev => !prev)}
              className="w-8 h-8 rounded-full bg-gradient-to-b from-[#b5b31d] to-[#4c4a03] border-2 border-[#1a1a1a] shadow-[inset_0_2px_4px_rgba(255,255,255,0.5)] flex items-center justify-center text-lg pointer-events-auto active:scale-95"
              title="Reactions"
            >
              💬
            </button>
            <button 
              onClick={() => setShowHistoryDrawer(true)}
              className="w-8 h-8 rounded-full bg-gradient-to-b from-[#b5b31d] to-[#4c4a03] border-2 border-[#1a1a1a] shadow-[inset_0_2px_4px_rgba(255,255,255,0.5)] flex items-center justify-center text-lg pointer-events-auto active:scale-95"
              title="Trick History"
            >
              📜
            </button>
          </div>

          {isSpectator && (
            <div className="mt-2 flex items-center gap-1.5 px-3 py-1 bg-red-950/80 border border-red-500/30 rounded-full text-red-400 text-[10px] font-black tracking-widest uppercase animate-pulse shadow-inner">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
              Spectating
            </div>
          )}
          {state.isSingleHand ? (
            <div className="mt-2 text-amber-300 font-bold whitespace-nowrap bg-black/40 px-2 py-1 rounded">
              {state.bidWinner ? (state.players[state.bidWinner]?.name || 'Unknown') : '-'} is playing Single Hand
            </div>
          ) : (
            <>
              <div className="mt-2 text-white/90">Trump Player</div>
              <div className="text-white/90">
                {state.bidWinner ? (state.players[state.bidWinner]?.name || 'Unknown') : '-'} {state.currentBid > 15 ? `- ${state.currentBid}` : ''}
              </div>
              {state.trumpSuit && (state.trumpRevealed || state.bidWinner === 'bottom') && (
                <div className="text-amber-400 font-bold mt-1 bg-black/40 px-2 py-0.5 rounded border border-amber-400/30">
                  Trump: {state.trumpSuit === 'hearts' ? '♥' : state.trumpSuit === 'diamonds' ? '♦' : state.trumpSuit === 'clubs' ? '♣' : '♠'} {!state.trumpRevealed && '(Hidden)'}
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
      {/* Reaction / Emoji Picker Popup */}
      <AnimatePresence>
        {showReactionPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute top-16 left-4 z-[99] w-72 bg-amber-950/95 border border-[#d6af84]/40 backdrop-blur-md rounded-2xl p-4 shadow-[0_10px_25px_rgba(0,0,0,0.8)] pointer-events-auto flex flex-col gap-3"
          >
            <div className="flex justify-between items-center border-b border-[#d6af84]/20 pb-2">
              <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">Reactions & Chat</span>
              <button onClick={() => setShowReactionPopup(false)} className="text-white/60 hover:text-white text-xs">Close</button>
            </div>
            
            {/* Emojis Grid */}
            <div className="grid grid-cols-4 gap-2">
              {['👍', '😂', '🔥', '😮', '😢', '👏', '🤔', '🤬'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => {
                    sendReaction(emoji, null);
                    setShowReactionPopup(false);
                  }}
                  className="w-10 h-10 rounded-xl bg-amber-900/50 border border-amber-600/20 hover:border-amber-400 hover:bg-amber-800/60 active:scale-90 transition-all text-xl flex items-center justify-center"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Quick Messages List */}
            <div className="flex flex-col gap-1.5 border-t border-[#d6af84]/20 pt-2">
              {[
                "দারুণ চাল!",
                "কেমন খেললেন ভাই?",
                "আমার কাছে কিন্তু ট্রাম্প আছে!",
                "মাফ করবেন ভুল হয়ে গেছে!"
              ].map(msg => (
                <button
                  key={msg}
                  onClick={() => {
                    sendReaction(null, msg);
                    setShowReactionPopup(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg bg-amber-900/30 hover:bg-amber-800/60 border border-transparent hover:border-amber-500/20 text-xs font-semibold text-amber-100 hover:text-white transition-all whitespace-normal"
                >
                  {msg}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spectator Reactions Toast / Overlay */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
        {Object.keys(state.activeReactions || {}).map(pos => {
          if (!pos.startsWith('spec_')) return null;
          const reaction = state.activeReactions?.[pos];
          if (!reaction) return null;
          const isRecent = Date.now() - reaction.timestamp < 3000;
          if (!isRecent) return null;
          
          const specName = playersList.find(p => p.position === pos)?.name || "Spectator";

          return (
            <motion.div
              key={pos}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              className="bg-amber-950/90 border border-amber-500/20 text-white text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap font-bold"
            >
              <span className="text-amber-300 font-bold">{specName}:</span>
              {reaction.emoji && <span className="text-sm">{reaction.emoji}</span>}
              {reaction.message && <span>{reaction.message}</span>}
            </motion.div>
          );
        })}
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
            {renderReactionBubble('top')}
            {renderThinking('top')}
            {state.trumpRevealed && state.trumpRevealer === 'top' && (
               <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute -top-6 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-xl border border-red-400 whitespace-nowrap z-50">
                 Declared Trump!
               </motion.div>
            )}
            <div className="bg-white/90 px-2 py-0.5 rounded-sm text-[10px] font-bold text-black mb-1 shadow">
              {shortenName(state.players['top']?.name || 'Empty')}
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
          {renderReactionBubble('left')}
          {renderThinking('left')}
          {state.trumpRevealed && state.trumpRevealer === 'left' && (
             <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute -top-6 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-xl border border-red-400 whitespace-nowrap z-50">
               Declared Trump!
             </motion.div>
          )}
          <div className="bg-white/90 px-2 py-0.5 rounded-sm text-[10px] font-bold text-black mb-1 shadow whitespace-nowrap">
            {shortenName(state.players['left']?.name || 'Empty')}
          </div>
          <div className={`w-12 h-12 bg-[#e0d6c8] rounded-full border-[3px] overflow-hidden shadow-lg flex items-end justify-center transition-all duration-300 ${isPlayerActive('left') ? 'border-amber-400 ring-4 ring-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.6)]' : 'border-[#4a2e15]'}`}>
             <div className="w-8 h-8 bg-slate-500 rounded-full mb-[-8px]" />
          </div>
        </div>
      )}

      {/* Right Avatar (Screen Relative) */}
      {!isSittingOut('right') && (
        <div className="absolute top-[48%] sm:top-1/2 right-2 sm:right-4 -translate-y-1/2 flex flex-col items-center z-30 pointer-events-auto">
          {renderReactionBubble('right')}
          {renderThinking('right')}
          {state.trumpRevealed && state.trumpRevealer === 'right' && (
             <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute -top-6 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-xl border border-red-400 whitespace-nowrap z-50">
               Declared Trump!
             </motion.div>
          )}
          <div className="bg-white/90 px-2 py-0.5 rounded-sm text-[10px] font-bold text-black mb-1 shadow whitespace-nowrap">
            {shortenName(state.players['right']?.name || 'Empty')}
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
          <div className="relative">
            {renderScoreCard(state.scores.team2, "They")}
            {state.roundPoints.team2 > 0 && (
              <div className="absolute inset-x-0 -bottom-8 flex justify-center pointer-events-none z-20">
                <div className="bg-black/80 rounded-full w-6 h-6 flex items-center justify-center text-amber-400 font-bold text-[11px] shadow-lg border border-white/20">
                  {state.roundPoints.team2}
                </div>
              </div>
            )}
          </div>
          
          {!state.isSingleHand && (
            <div className="flex flex-col items-center -mt-4 relative">
              <span className="text-white text-xs font-bold mb-1 shadow-black drop-shadow-md">Trump</span>
              
              {state.trumpRevealed && tempRevealTrump && state.hiddenTrumpCard ? (
                <motion.div initial={{ rotateY: 180 }} animate={{ rotateY: 0 }} transition={{ duration: 0.6 }} className="scale-75 origin-top">
                  <CardUI card={state.hiddenTrumpCard} />
                </motion.div>
              ) : state.trumpSuit ? (
                <div className="w-10 h-14 bg-red-700 rounded border-2 border-white/80 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center">
                   <span className="text-white font-bold">{state.trumpRevealed ? (state.trumpSuit === 'hearts' ? '♥' : state.trumpSuit === 'diamonds' ? '♦' : state.trumpSuit === 'clubs' ? '♣' : '♠') : '?'}</span>
                </div>
              ) : (
                <div className="w-10 h-14 bg-white/5 rounded border border-white/20 border-dashed" />
              )}
            </div>
          )}

          <div className="relative">
            {renderScoreCard(state.scores.team1, "We")}
            {state.roundPoints.team1 > 0 && (
              <div className="absolute inset-x-0 -bottom-8 flex justify-center pointer-events-none z-20">
                <div className="bg-black/80 rounded-full w-6 h-6 flex items-center justify-center text-amber-400 font-bold text-[11px] shadow-lg border border-white/20">
                  {state.roundPoints.team1}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Played Cards */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
          {/* Top Played Card Slot */}
          <div className="absolute top-[35%] left-1/2 -translate-x-1/2 z-10 scale-[0.65]">
            <AnimatePresence mode="wait">
              {state.currentTrick?.cards?.top && (
                <motion.div 
                  key={`top-${state.currentTrick.cards.top.id}`} 
                  initial={{ y: -20, opacity: 0 }} 
                  animate={state.currentTrick.winner 
                    ? getTrickResolveAnimation(state.currentTrick.winner)
                    : { y: 0, x: 0, opacity: 1, scale: 1 }
                  }
                  exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                >
                  <CardUI card={state.currentTrick.cards.top} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Left Played Card Slot */}
          <div className="absolute top-[45%] left-[25%] -translate-x-1/2 z-20 scale-[0.65]">
            <AnimatePresence mode="wait">
              {state.currentTrick?.cards?.left && (
                <motion.div 
                  key={`left-${state.currentTrick.cards.left.id}`} 
                  initial={{ x: -20, opacity: 0 }} 
                  animate={state.currentTrick.winner 
                    ? getTrickResolveAnimation(state.currentTrick.winner)
                    : { x: 0, y: 0, opacity: 1, scale: 1 }
                  }
                  exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                >
                  <CardUI card={state.currentTrick.cards.left} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Played Card Slot */}
          <div className="absolute top-[45%] right-[25%] translate-x-1/2 z-20 scale-[0.65]">
            <AnimatePresence mode="wait">
              {state.currentTrick?.cards?.right && (
                <motion.div 
                  key={`right-${state.currentTrick.cards.right.id}`} 
                  initial={{ x: 20, opacity: 0 }} 
                  animate={state.currentTrick.winner 
                    ? getTrickResolveAnimation(state.currentTrick.winner)
                    : { x: 0, y: 0, opacity: 1, scale: 1 }
                  }
                  exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                >
                  <CardUI card={state.currentTrick.cards.right} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Played Card Slot */}
          <div className="absolute bottom-[25%] left-1/2 -translate-x-1/2 z-30 scale-[0.65]">
            <AnimatePresence mode="wait">
              {state.currentTrick?.cards?.bottom && (
                <motion.div 
                  key={`bottom-${state.currentTrick.cards.bottom.id}`} 
                  initial={{ y: 20, opacity: 0 }} 
                  animate={state.currentTrick.winner 
                    ? getTrickResolveAnimation(state.currentTrick.winner)
                    : { y: 0, x: 0, opacity: 1, scale: 1 }
                  }
                  exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                >
                  <CardUI card={state.currentTrick.cards.bottom} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          
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
         state.currentTrick.cards['bottom'] === null &&
         !state.hands['bottom'].some(c => c.suit === state.currentTrick.leadSuit) && 
         !isSpectator && (
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
      {state.phase === 'bidding' && state.activeBidder === 'bottom' && !isSpectator && (
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
      {state.phase === 'doubling_phase' && state.activeBidder === 'bottom' && !isSpectator && (
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

      {state.phase === 'doubling_phase' && (state.activeBidder !== 'bottom' || isSpectator) && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 flex flex-col items-center text-center">
          <div className="text-white text-lg font-bold bg-black/60 px-6 py-2 rounded-full animate-pulse border border-white/20">
            Waiting for {state.players[state.activeBidder]?.name || 'Player'} to Double or Pass...
          </div>
        </div>
      )}

      {/* Redoubling Phase UI */}
      {state.phase === 'redoubling_phase' && state.activeBidder === 'bottom' && !isSpectator && (
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

      {state.phase === 'redoubling_phase' && (state.activeBidder !== 'bottom' || isSpectator) && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 flex flex-col items-center text-center">
          <div className="text-white text-lg font-bold bg-black/60 px-6 py-2 rounded-full animate-pulse border border-[#ff4444]/40">
            Waiting for {state.players[state.activeBidder]?.name || 'Player'} to Redouble or Cancel...
          </div>
        </div>
      )}

      {/* Single Hand Decision UI */}
      {state.phase === 'single_hand_decision' && state.activeBidder === 'bottom' && !isSpectator && (
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

      {state.phase === 'single_hand_decision' && (state.activeBidder !== 'bottom' || isSpectator) && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 flex flex-col items-center text-center">
          <div className="text-white text-lg font-bold bg-black/60 px-6 py-2 rounded-full animate-pulse border border-amber-500/30">
            Waiting for {state.players[state.activeBidder]?.name || 'Player'} to decide Single Hand...
          </div>
        </div>
      )}

      {/* Trump Selection Grid */}
      {state.phase === 'set_trump' && state.activeBidder === 'bottom' && !isSpectator && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-auto w-[90%] max-w-[340px]">
          <div className="bg-[#3a2010] p-4 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.8)] border-2 border-[#52321c] flex flex-col items-center">
            <h3 className="text-amber-400 font-bold mb-4 text-center text-lg drop-shadow-md">Select Trump Suit</h3>
            <div className="flex gap-3 justify-center w-full mb-5">
              {(['spades', 'hearts', 'diamonds', 'clubs'] as Suit[]).map(suit => (
                <div 
                  key={suit} 
                  className="w-[60px] sm:w-[70px] hover:-translate-y-2 hover:scale-105 transition-all cursor-pointer shadow-lg" 
                  onClick={() => setTrump({ id: `dummy_${suit}`, suit, rank: 'A', value: 0 })}
                >
                  <CardUI card={{ id: `dummy_${suit}`, suit, rank: 'A', value: 0 }} isHidden={false} isPlayable={true} />
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
            Waiting for {state.players[state.activeBidder]?.name || 'Player'} to bid...
          </div>
          {state.currentBid > 15 && state.highestBidder && (
            <div className="text-amber-400 text-xl font-black mt-3 drop-shadow-lg shadow-black bg-black/60 px-6 py-2 rounded-lg border border-amber-500/30">
              Highest Bid: {state.currentBid} (by {state.players[state.highestBidder]?.name || 'Player'})
            </div>
          )}
        </div>
      )}

      {/* Waiting for other players to set trump */}
      {state.phase === 'set_trump' && (state.activeBidder !== 'bottom' || isSpectator) && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none flex flex-col items-center text-center">
          <div className="text-white text-lg font-bold shadow-black drop-shadow-md bg-black/40 px-6 py-2 rounded-full border border-white/10 backdrop-blur-sm animate-pulse">
            Waiting for {state.players[state.activeBidder]?.name || 'Player'} to set Trump...
          </div>
        </div>
      )}

      {/* Bottom Player (Self) Hand - Pinned to bottom exactly like screenshot */}
      <div className="absolute bottom-4 sm:bottom-6 left-0 w-full z-40 bg-transparent flex flex-col justify-end items-center pointer-events-none">
        
        {/* Bottom Avatar positioned on top of the hand container */}
        <div className="flex flex-col items-center mb-2 pointer-events-auto relative">
          {renderReactionBubble('bottom')}
          {isPlayerActive('bottom') && !isSpectator && (
            <div className="absolute -top-6 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg border border-amber-600 animate-pulse z-50 whitespace-nowrap">
              {state.phase === 'bidding' ? 'Your Turn to Bid' : (state.phase === 'dealing_2' ? 'Set Trump' : 'Your Turn')}
            </div>
          )}
          <div className="bg-white/90 px-3 py-0.5 rounded-t-md text-[10px] font-bold text-black border-b border-black/20 shadow">
            {isSpectator ? (state.players['bottom']?.name || 'Player') : 'You'}
          </div>
          <div className={`w-14 h-14 bg-[#e0d6c8] rounded-full border-[3px] overflow-hidden shadow-lg flex items-end justify-center transition-all duration-300 ${isPlayerActive('bottom') && !isSpectator ? 'border-amber-400 ring-4 ring-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.6)]' : 'border-[#4a2e15]'}`}>
             <div className="w-10 h-10 bg-slate-500 rounded-full mb-[-12px]" />
          </div>
        </div>

        <div className="flex justify-center w-full max-w-[600px] pointer-events-auto px-2">
           {state.hands['bottom'].map((card, i) => {
             const isTrumpCard = !!(state.hiddenTrumpCard && 
               !state.hiddenTrumpCard.id.startsWith('dummy_') && 
               (card.id === state.hiddenTrumpCard.id || 
                (card.suit === state.hiddenTrumpCard.suit && card.rank === state.hiddenTrumpCard.rank)));
             const isHiddenTrump = isTrumpCard && !state.trumpRevealed;
             
             // Check if the player has any playable cards of the lead suit
             const leadSuit = state.currentTrick.leadSuit;
             const hasLeadSuit = leadSuit ? state.hands['bottom'].some(c => {
               const isCUndercover = !!(state.hiddenTrumpCard && 
                 !state.hiddenTrumpCard.id.startsWith('dummy_') && 
                 (c.id === state.hiddenTrumpCard.id || 
                  (c.suit === state.hiddenTrumpCard.suit && c.rank === state.hiddenTrumpCard.rank)));
               return c.suit === leadSuit && !(isCUndercover && !state.trumpRevealed);
             }) : false;
             
             // The card is valid if there's no lead suit, or the player doesn't have the lead suit, or the card matches the lead suit
             const isValidSuit = !leadSuit || !hasLeadSuit || card.suit === leadSuit;
             
             const isPlayable = state.turn === 'bottom' && state.phase === 'playing' && !isHiddenTrump && isValidSuit && !isSpectator;
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
        <div className={`absolute inset-0 ${state.lastRoundResult?.team1Won ? 'bg-green-900/90' : 'bg-red-900/90'} backdrop-blur-md z-50 overflow-y-auto flex flex-col items-center justify-start py-12 px-6 text-white text-center pointer-events-auto transition-colors duration-1000`}>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
            <h2 className={`text-4xl md:text-6xl font-black mb-2 drop-shadow-lg ${state.lastRoundResult?.team1Won ? 'text-green-400' : 'text-red-400'}`}>
              {state.lastRoundResult?.team1Won ? 'You Won the Round!' : 'You Lost the Round!'}
            </h2>
            
            <div className="mb-8 p-4 bg-black/40 rounded-2xl border border-white/20 w-full max-w-md shadow-2xl backdrop-blur-lg mt-4">
              <h3 className="text-xl font-bold text-slate-300 mb-4">Bid Winner: {state.players[state.bidWinner!]?.name || 'Player'} ({state.currentBid})</h3>
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

      {/* Game Over Overlay */}
      {state.phase === 'game_over' && (
        <div className="absolute inset-0 bg-amber-950/95 backdrop-blur-md z-50 overflow-y-auto flex flex-col items-center justify-start py-12 px-6 text-white text-center pointer-events-auto">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
            <div className="w-20 h-20 bg-amber-500/20 border-2 border-amber-400 rounded-full flex items-center justify-center text-4xl mb-6 shadow-[0_0_30px_rgba(245,158,11,0.3)] animate-pulse">
              🏆
            </div>
            
            <h2 className="text-3xl md:text-5xl font-black mb-2 text-amber-400 drop-shadow-lg font-display">
              {state.scores.team1 >= 6 || state.scores.team2 <= -6 ? 'Team 1 Wins the Game!' : 'Team 2 Wins the Game!'}
            </h2>
            <p className="text-xs md:text-sm text-amber-200/70 mb-8 max-w-sm leading-relaxed">
              {state.scores.team1 >= 6 || state.scores.team2 <= -6 
                ? 'Congratulations! You and your AI Partner reached +6 points (or opponents reached -6) and won the game!' 
                : 'Opponents (AI Left & Right) reached +6 points (or your team reached -6) and won the game!'}
            </p>
            
            <div className="mb-8 p-6 bg-black/40 rounded-2xl border border-white/20 w-full max-w-md shadow-2xl backdrop-blur-lg">
              <h3 className="text-base font-bold text-slate-300 mb-4">Final Scoreboard</h3>
              <div className="flex justify-between gap-4">
                <div className="flex-1 bg-gradient-to-br from-green-600/40 to-emerald-900/40 p-4 rounded-xl border border-green-500/30">
                  <h3 className="text-xs font-bold text-green-200">Team 1</h3>
                  <p className="text-[10px] text-green-100/50 mb-2">(You & Partner)</p>
                  <p className="text-4xl font-black text-white">{state.scores.team1}</p>
                </div>
                <div className="flex-1 bg-gradient-to-br from-red-600/40 to-rose-900/40 p-4 rounded-xl border border-red-500/30">
                  <h3 className="text-xs font-bold text-red-200">Team 2</h3>
                  <p className="text-[10px] text-red-100/50 mb-2">(Left & Right)</p>
                  <p className="text-4xl font-black text-white">{state.scores.team2}</p>
                </div>
              </div>
            </div>

            <button 
              onClick={returnToLobby} 
              className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-700 text-white rounded-full font-bold text-lg shadow-[0_0_45px_rgba(217,119,6,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer border border-amber-400/50"
            >
              Return to Lobby
            </button>
          </motion.div>
        </div>
      )}

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

                <div>
                  <h3 className="text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">Sound Effects</h3>
                  <button 
                    onClick={toggleSound}
                    className={`w-full py-2.5 rounded-lg font-bold border transition-all ${soundEnabled ? 'bg-amber-600 border-amber-400 text-white' : 'bg-black/40 border-white/10 text-gray-400 hover:bg-black/60'}`}
                  >
                    {soundEnabled ? '🔊 Sounds On' : '🔇 Muted'}
                  </button>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">Bengali Voice Pack</h3>
                  <button 
                    onClick={toggleVoice}
                    className={`w-full py-2.5 rounded-lg font-bold border transition-all ${voiceEnabled ? 'bg-amber-600 border-amber-400 text-white' : 'bg-black/40 border-white/10 text-gray-400 hover:bg-black/60'}`}
                  >
                    {voiceEnabled ? '🗣️ Bengali Voice On' : '🔇 Voice Muted'}
                  </button>
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

        {showStatsModal && profile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowStatsModal(false)}
            className="absolute inset-0 z-[110] bg-black/75 backdrop-blur-md flex items-center justify-center pointer-events-auto p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-gradient-to-b from-[#2a170b] to-[#140b05] border-2 border-amber-600/40 rounded-3xl p-6 shadow-2xl max-w-md w-full text-white relative overflow-hidden"
            >
              {/* Border accents */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-600" />
              
              <h2 className="text-2xl font-black text-amber-300 mb-2 text-center font-display uppercase tracking-wider">
                খেলোয়াড় প্রোফাইল
              </h2>
              
              {/* User Identity Details */}
              <div className="flex flex-col items-center gap-1.5 py-4 border-b border-amber-800/20 mb-5">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl flex items-center justify-center text-3xl border border-amber-400/30 shadow-lg">
                  {profile.is_verified ? '🎓' : '👑'}
                </div>
                <h3 className="text-xl font-bold text-white flex items-center gap-1.5 mt-2 text-center uppercase">
                  {profile.name}
                  {profile.is_verified && <ShieldCheck className="w-5 h-5 text-green-400 animate-pulse" />}
                </h3>
                {profile.is_verified ? (
                  <p className="text-xs text-amber-200/60 uppercase font-semibold tracking-wider text-center">
                    {profile.department} • {profile.hall}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider text-center">
                    Guest Player (Local Profile)
                  </p>
                )}
              </div>

              {/* Stats Grid */}
              <div className="space-y-4">
                {/* Section: Multiplayer Record */}
                <div>
                  <h4 className="text-xs font-bold text-amber-400/80 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" />
                    Multiplayer Stats (Leaderboard)
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-black/30 p-2.5 rounded-xl border border-amber-800/10">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Played</p>
                      <p className="text-lg font-black text-white">{profile.games_played}</p>
                    </div>
                    <div className="bg-black/30 p-2.5 rounded-xl border border-amber-800/10">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Won</p>
                      <p className="text-lg font-black text-white">{profile.games_won}</p>
                    </div>
                    <div className="bg-black/30 p-2.5 rounded-xl border border-amber-800/10">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Win Rate</p>
                      <p className="text-lg font-black text-amber-300">
                        {profile.games_played > 0 
                          ? `${((profile.games_won / profile.games_played) * 100).toFixed(1)}%` 
                          : '0%'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section: Single Hand & Bid stats */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="bg-black/30 p-3 rounded-xl border border-amber-800/10 flex flex-col justify-between">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" />
                      Single Hand
                    </p>
                    <p className="text-lg font-black text-white">
                      {profile.single_hands_won} / {profile.single_hands_tried}
                    </p>
                    <p className="text-[9px] text-amber-200/50 font-bold uppercase mt-0.5">
                      Success Rate: {profile.single_hands_tried > 0 
                        ? `${((profile.single_hands_won / profile.single_hands_tried) * 100).toFixed(0)}%` 
                        : '0%'}
                    </p>
                  </div>
                  <div className="bg-black/30 p-3 rounded-xl border border-amber-800/10 flex flex-col justify-between">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1 flex items-center gap-1">
                      <Target className="w-3 h-3 text-amber-400" />
                      Highest Bid Won
                    </p>
                    <p className="text-2xl font-black text-amber-300">
                      {profile.highest_bid_won > 0 ? profile.highest_bid_won : '-'}
                    </p>
                    <p className="text-[9px] text-amber-200/50 font-bold uppercase mt-0.5">
                      Points out of 28
                    </p>
                  </div>
                </div>

                {/* Section: Practice Stats */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400/80 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Gamepad2 className="w-3.5 h-3.5" />
                    Practice Stats (Vs AI)
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Played</p>
                      <p className="text-lg font-black text-white">{profile.practice_played}</p>
                    </div>
                    <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Won</p>
                      <p className="text-lg font-black text-white">{profile.practice_won}</p>
                    </div>
                    <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Win Rate</p>
                      <p className="text-lg font-black text-amber-300/80">
                        {profile.practice_played > 0 
                          ? `${((profile.practice_won / profile.practice_played) * 100).toFixed(1)}%` 
                          : '0%'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowStatsModal(false)}
                className="mt-6 w-full py-3.5 bg-gradient-to-b from-amber-600 to-amber-800 text-white rounded-2xl font-bold uppercase tracking-wider border border-amber-500/30 hover:brightness-110 active:scale-98 transition-all shadow-md"
              >
                Close Stats
              </button>
            </motion.div>
          </motion.div>
        )}

        {showLeaderboardModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLeaderboardModal(false)}
            className="absolute inset-0 z-[110] bg-black/75 backdrop-blur-md flex items-center justify-center pointer-events-auto p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-gradient-to-b from-[#2a170b] to-[#140b05] border-2 border-amber-600/40 rounded-3xl p-6 shadow-2xl max-w-md w-full text-white relative overflow-hidden flex flex-col max-h-[90%]"
            >
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-600" />
              
              <h2 className="text-2xl font-black text-amber-300 mb-4 text-center font-display uppercase tracking-wider flex items-center justify-center gap-2">
                <Trophy className="w-6 h-6 text-amber-400 animate-pulse" />
                লিডারবোর্ড
              </h2>

              {/* Tabs */}
              <div className="flex p-1 bg-black/40 border border-amber-950 rounded-2xl mb-4">
                <button
                  onClick={() => setLeaderboardTab('batch52')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    leaderboardTab === 'batch52' 
                      ? 'bg-gradient-to-b from-amber-500 to-amber-700 text-white border border-amber-400/35 shadow' 
                      : 'text-amber-200/50 hover:text-amber-200'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  ৫২ ব্যাচ
                </button>
                <button
                  onClick={() => setLeaderboardTab('guest')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    leaderboardTab === 'guest' 
                      ? 'bg-gradient-to-b from-amber-500 to-amber-700 text-white border border-amber-400/35 shadow' 
                      : 'text-amber-200/50 hover:text-amber-200'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5" />
                  গেস্ট
                </button>
              </div>

              {/* Leaderboard Lists */}
              <div className="flex-1 overflow-y-auto min-h-[250px] pr-1 scrollbar-thin divide-y divide-amber-950">
                {loadingLeaderboard ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400" />
                  </div>
                ) : leaderboardData.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                    <p className="text-center font-bold">No records found yet.</p>
                    <p className="text-[10px] text-center mt-1">Be the first to play and lead the board!</p>
                  </div>
                ) : (
                  leaderboardData.map((row, index) => {
                    const isCurrentUser = profile && row.id === profile.id;
                    const rank = index + 1;
                    
                    let rankBadge = `${rank}`;
                    let badgeClass = "text-slate-400 font-black";
                    if (rank === 1) {
                      rankBadge = "🥇";
                    } else if (rank === 2) {
                      rankBadge = "🥈";
                    } else if (rank === 3) {
                      rankBadge = "🥉";
                    }

                    return (
                      <div 
                        key={row.id} 
                        className={`flex items-center justify-between py-3 px-2 transition-all ${
                          isCurrentUser ? 'bg-amber-500/10 border-l-2 border-amber-500 rounded-lg font-bold' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`w-6 text-center text-sm ${badgeClass}`}>{rankBadge}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-black tracking-wide text-amber-100 flex items-center gap-1 select-none">
                              {row.name}
                              {row.is_verified && <ShieldCheck className="w-3.5 h-3.5 text-green-400 inline" />}
                            </p>
                            {row.is_verified && (
                              <p className="text-[9px] text-amber-200/40 uppercase tracking-widest font-bold truncate">
                                {row.department}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-amber-300">{row.games_won} Wins</p>
                          <p className="text-[9px] text-slate-400 uppercase font-bold">{row.games_played} Played</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <button
                onClick={() => setShowLeaderboardModal(false)}
                className="mt-4 w-full py-3.5 bg-gradient-to-b from-amber-600 to-amber-800 text-white rounded-2xl font-bold uppercase tracking-wider border border-amber-500/30 hover:brightness-110 active:scale-98 transition-all shadow-md"
              >
                Close Leaderboard
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trick History Drawer */}
      <AnimatePresence>
        {showHistoryDrawer && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistoryDrawer(false)}
              className="absolute inset-0 z-[120] bg-black/60 pointer-events-auto"
            />
            {/* Drawer Container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 bottom-0 w-80 sm:w-96 z-[125] bg-gradient-to-b from-[#2a170b] to-[#140b05] border-l-2 border-[#8b5a2b]/30 shadow-2xl backdrop-blur-md pointer-events-auto p-5 flex flex-col text-white"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-[#8b5a2b]/30 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-normal">📜</span>
                  <h3 className="text-lg font-black tracking-wide text-amber-400 uppercase font-display">Trick History</h3>
                </div>
                <button
                  onClick={() => setShowHistoryDrawer(false)}
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-sm hover:bg-white/15 transition-all"
                >
                  ✕
                </button>
              </div>

              {/* Tricks list */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 scrollbar-thin">
                {(!state.tricksHistory || state.tricksHistory.length === 0) ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400/60 p-6">
                    <span className="text-4xl mb-2">🃏</span>
                    <p className="text-sm font-bold uppercase tracking-wider">No tricks played yet</p>
                    <p className="text-xs mt-1">Tricks will appear here in chronological order after they resolve.</p>
                  </div>
                ) : (
                  state.tricksHistory.map((trick, index) => {
                    const winnerName = state.players[trick.winner || 'bottom']?.name || 'Unknown';
                    const leadSuitSymbol = trick.leadSuit === 'hearts' ? '♥' : trick.leadSuit === 'diamonds' ? '♦' : trick.leadSuit === 'clubs' ? '♣' : trick.leadSuit === 'spades' ? '♠' : '';
                    
                    return (
                      <div 
                        key={index} 
                        className="bg-black/30 border border-[#8b5a2b]/25 rounded-xl p-3.5 flex flex-col gap-2.5 shadow-md relative overflow-hidden group text-left"
                      >
                        {/* Corner Index */}
                        <div className="absolute top-0 right-0 bg-[#8b5a2b]/25 px-2.5 py-0.5 rounded-bl-lg text-[9px] font-black font-mono text-amber-400">
                          TRICK {index + 1}
                        </div>

                        {/* Title Info */}
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider text-left">Winner</span>
                          <span className="text-sm font-black text-amber-300 uppercase truncate text-left">
                            {trick.winner === 'bottom' ? 'You' : winnerName}
                          </span>
                        </div>

                        {/* Played Cards Thumbnails */}
                        <div className="grid grid-cols-4 gap-1.5 mt-1">
                          {(['bottom', 'left', 'top', 'right'] as PlayerPosition[]).map(pos => {
                            const card = trick.cards[pos];
                            const playerLabel = pos === 'bottom' ? 'You' : (state.players[pos]?.name || pos);
                            
                            return (
                              <div 
                                key={pos} 
                                className={`flex flex-col items-center p-1 bg-black/20 rounded-md border ${trick.winner === pos ? 'border-amber-400/60 bg-amber-500/5' : 'border-white/5'}`}
                              >
                                <span className={`text-[8px] truncate font-bold text-center w-full mb-1 opacity-70 ${trick.winner === pos ? 'text-amber-400 font-extrabold' : 'text-slate-300'}`}>
                                  {shortenName(playerLabel)}
                                </span>
                                {card ? (
                                  <div className="scale-75 origin-top -mb-4">
                                    <CardUI card={card} isPlayable={false} />
                                  </div>
                                ) : (
                                  <div className="w-7 h-10 border border-dashed border-white/10 rounded flex items-center justify-center text-[10px] text-white/20">-</div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Trick Summary Footer */}
                        <div className="flex justify-between items-center border-t border-white/5 pt-2 mt-2 text-[10px] font-bold text-slate-400">
                          <span className="flex items-center gap-1">
                            Lead: <span className={`text-xs ${trick.leadSuit === 'hearts' || trick.leadSuit === 'diamonds' ? 'text-red-500' : 'text-slate-300'}`}>{leadSuitSymbol}</span>
                          </span>
                          <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            Points: {trick.points}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};
