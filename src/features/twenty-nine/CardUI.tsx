import React from 'react';
import { Card as CardType } from './types';
import { motion } from 'framer-motion';

interface CardUIProps {
  card: CardType | null;
  isHidden?: boolean;
  onClick?: () => void;
  className?: string;
  isPlayable?: boolean;
}

const suitSymbols = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠'
};

const suitColors = {
  hearts: 'text-red-500',
  diamonds: 'text-red-500',
  clubs: 'text-gray-900',
  spades: 'text-gray-900'
};

export const CardUI: React.FC<CardUIProps> = ({ card, isHidden = false, onClick, className = '', isPlayable = false }) => {
  if (!card && !isHidden) {
    return <div className={`w-16 h-24 sm:w-20 sm:h-28 rounded-xl border-2 border-dashed border-gray-300 ${className}`} />;
  }

  if (isHidden) {
    return (
      <motion.div 
        whileHover={onClick ? { y: -10 } : {}}
        onClick={onClick}
        className={`w-16 h-24 sm:w-20 sm:h-28 rounded-xl bg-blue-800 shadow-lg border-2 border-white flex items-center justify-center cursor-pointer ${className}`}
      >
        <div className="w-[85%] h-[85%] border-2 border-white/40 flex items-center justify-center bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(255,255,255,0.2)_4px,rgba(255,255,255,0.2)_8px)] overflow-hidden">
           <div className="w-8 h-8 rounded-full bg-white/20 border border-white/40 flex items-center justify-center">
             <div className="w-4 h-4 bg-blue-900 rotate-45" />
           </div>
        </div>
      </motion.div>
    );
  }

  const renderPips = () => {
    const symbol = suitSymbols[card!.suit];
    const color = suitColors[card!.suit];
    const rank = card!.rank;

    if (rank === 'A') {
      return <div className={`text-4xl sm:text-5xl ${color}`}>{symbol}</div>;
    }

    if (['J', 'Q', 'K'].includes(rank)) {
      return (
        <div className={`w-[70%] h-[75%] border-2 ${color === 'text-red-500' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'} rounded flex flex-col items-center justify-center relative overflow-hidden`}>
          <div className={`text-5xl opacity-20 absolute ${color}`}>{symbol}</div>
          <div className={`text-3xl sm:text-4xl font-serif font-black ${color}`}>{rank}</div>
        </div>
      );
    }

    let pips: { x: number, y: number, r?: boolean }[] = [];
    if (rank === '7') {
      pips = [
        { x: 0, y: 0 }, { x: 100, y: 0 },
        { x: 50, y: 25 },
        { x: 0, y: 50 }, { x: 100, y: 50 },
        { x: 0, y: 100, r: true }, { x: 100, y: 100, r: true }
      ];
    } else if (rank === '8') {
      pips = [
        { x: 0, y: 0 }, { x: 100, y: 0 },
        { x: 50, y: 25 },
        { x: 0, y: 50 }, { x: 100, y: 50 },
        { x: 50, y: 75, r: true },
        { x: 0, y: 100, r: true }, { x: 100, y: 100, r: true }
      ];
    } else if (rank === '9') {
      pips = [
        { x: 0, y: 0 }, { x: 100, y: 0 },
        { x: 0, y: 33 }, { x: 100, y: 33 },
        { x: 50, y: 50 },
        { x: 0, y: 66, r: true }, { x: 100, y: 66, r: true },
        { x: 0, y: 100, r: true }, { x: 100, y: 100, r: true }
      ];
    } else if (rank === '10') {
      pips = [
        { x: 0, y: 0 }, { x: 100, y: 0 },
        { x: 50, y: 16 },
        { x: 0, y: 33 }, { x: 100, y: 33 },
        { x: 0, y: 66, r: true }, { x: 100, y: 66, r: true },
        { x: 50, y: 84, r: true },
        { x: 0, y: 100, r: true }, { x: 100, y: 100, r: true }
      ];
    }

    return (
      <div className="relative w-[50%] h-[60%] flex items-center justify-center">
        {pips.map((p, i) => (
          <div 
            key={i} 
            className={`absolute text-[10px] sm:text-xs leading-none ${color}`}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              transform: `translate(-50%, -50%) ${p.r ? 'rotate(180deg)' : ''}`
            }}
          >
            {symbol}
          </div>
        ))}
      </div>
    );
  };

  return (
    <motion.div
      whileHover={isPlayable ? { y: -15, scale: 1.05 } : {}}
      onClick={isPlayable ? onClick : undefined}
      className={`w-16 h-24 sm:w-20 sm:h-28 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col justify-between p-1.5 sm:p-2 relative overflow-hidden ${isPlayable ? 'cursor-pointer hover:shadow-xl ring-2 ring-transparent hover:ring-primary/50' : ''} ${className}`}
    >
      {/* Top Left */}
      <div className={`text-sm sm:text-base font-bold leading-none ${suitColors[card!.suit]}`}>
        {card!.rank}
        <div className="text-[10px] sm:text-xs leading-none">{suitSymbols[card!.suit]}</div>
      </div>
      
      {/* Center Layout */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {renderPips()}
      </div>

      {/* Bottom Right (Upside down) */}
      <div className={`text-sm sm:text-base font-bold leading-none rotate-180 flex flex-col items-end ${suitColors[card!.suit]}`}>
        <span>{card!.rank}</span>
        <div className="text-[10px] sm:text-xs leading-none">{suitSymbols[card!.suit]}</div>
      </div>
    </motion.div>
  );
};
