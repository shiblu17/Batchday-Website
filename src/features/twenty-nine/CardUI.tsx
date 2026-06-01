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
        className={`w-16 h-24 sm:w-20 sm:h-28 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-800 shadow-lg border-2 border-white/20 flex items-center justify-center cursor-pointer ${className}`}
      >
        <div className="w-12 h-20 sm:w-16 sm:h-24 rounded-lg border border-white/30 opacity-50 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.1)_10px,rgba(255,255,255,0.1)_20px)]" />
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={isPlayable ? { y: -15, scale: 1.05 } : {}}
      onClick={isPlayable ? onClick : undefined}
      className={`w-16 h-24 sm:w-20 sm:h-28 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col justify-between p-2 relative overflow-hidden ${isPlayable ? 'cursor-pointer hover:shadow-xl ring-2 ring-transparent hover:ring-primary/50' : ''} ${className}`}
    >
      {/* Top Left */}
      <div className={`text-lg sm:text-xl font-bold leading-none ${suitColors[card!.suit]}`}>
        {card!.rank}
        <div className="text-sm sm:text-base leading-none">{suitSymbols[card!.suit]}</div>
      </div>
      
      {/* Center Big Symbol */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl sm:text-5xl opacity-20 ${suitColors[card!.suit]}`}>
        {suitSymbols[card!.suit]}
      </div>

      {/* Bottom Right (Upside down) */}
      <div className={`text-lg sm:text-xl font-bold leading-none rotate-180 ${suitColors[card!.suit]}`}>
        {card!.rank}
        <div className="text-sm sm:text-base leading-none">{suitSymbols[card!.suit]}</div>
      </div>
    </motion.div>
  );
};
