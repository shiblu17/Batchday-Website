import React from 'react';
import { PlayerColor, COLOR_HEX } from './ludoData';
import LudoDice from './LudoDice';

interface PlayerPanelProps {
  color: PlayerColor;
  finished: number;
  isActive: boolean;
  diceValue: number;
  isRolling: boolean;
  canRoll: boolean;
  onRoll: () => void;
  consecutiveSixes: number;
  noMoves: boolean;
  position: 'top' | 'bottom' | 'left' | 'right';
  playerType: 'human' | 'ai';
}

const PlayerPanel = ({
  color, finished, isActive, diceValue, isRolling, canRoll,
  onRoll, consecutiveSixes, noMoves, position, playerType
}: PlayerPanelProps) => {
  const isHorizontal = position === 'top' || position === 'bottom';

  // Helper for consistent mapping in our project
  const displayNames: Record<PlayerColor, string> = {
    red: 'লাল',
    green: 'সবুজ',
    yellow: 'হলুদ',
    blue: 'নীল'
  };

  return (
    <div
      className={`flex items-center gap-3 transition-all duration-500 ${
        isHorizontal ? 'flex-row' : 'flex-col'
      } ${isActive ? 'scale-105' : 'scale-95 opacity-60'}`}
    >
      {/* Player info card - Glassmorphic design */}
      <div 
        className={`flex items-center gap-3 px-4 py-2.5 rounded-3xl backdrop-blur-md shadow-lg border border-white/40 ${
          isHorizontal ? '' : 'flex-col text-center'
        }`}
        style={{
          backgroundColor: isActive ? COLOR_HEX[color] + '25' : 'rgba(255,255,255,0.7)',
          borderColor: isActive ? COLOR_HEX[color] : 'rgba(255,255,255,0.4)',
          minWidth: isHorizontal ? '110px' : '90px',
        }}
      >
        <div 
          className="w-5 h-5 rounded-full shadow-inner ring-2 ring-white/50"
          style={{ 
            background: `radial-gradient(circle at 30% 30%, #fff 0%, ${COLOR_HEX[color]} 100%)` 
          }} 
        />
        <div className="flex flex-col">
          <span className="text-xs font-black uppercase tracking-tight text-gray-800">
            {displayNames[color]}
          </span>
          <div className="flex items-center gap-1.5 opacity-70">
            <span className="text-[10px] font-bold text-gray-500">{playerType === 'human' ? '👤' : '🤖'}</span>
            <span className="text-[10px] font-black text-gray-700">{finished}/4 DONE</span>
          </div>
        </div>
      </div>

      {/* Dice - Centered relative to the panel */}
      <div className="relative group">
        <LudoDice
          value={diceValue}
          color={color}
          isRolling={isActive && isRolling}
          canRoll={isActive && canRoll}
          onRoll={onRoll}
        />
        
        {/* Consecutive Sixes Indicator (🔥) */}
        {isActive && consecutiveSixes > 0 && (
          <div className="absolute -top-3 -right-3 flex items-center justify-center bg-white shadow-md rounded-full px-1.5 py-0.5 border border-amber-200 animate-bounce">
            <span className="text-[10px] font-black text-amber-600">🔥 {consecutiveSixes}x6</span>
          </div>
        )}
      </div>

      {/* Passive indicator for "no moves" */}
      {isActive && noMoves && (
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-gray-400 italic animate-pulse">
          PASSING...
        </span>
      )}
    </div>
  );
};

export default PlayerPanel;
