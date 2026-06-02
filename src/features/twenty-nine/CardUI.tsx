import React from 'react';
import { Card as CardType } from './types';
import { motion } from 'framer-motion';

interface CardUIProps {
  card: CardType | null;
  isHidden?: boolean;
  onClick?: () => void;
  className?: string;
  isPlayable?: boolean;
  scale?: number;
}

export const CardUI: React.FC<CardUIProps> = ({ 
  card, 
  isHidden = false, 
  onClick, 
  className = '', 
  isPlayable = false,
  scale = 1
}) => {
  const scaleStyle = scale !== 1 ? { transform: `scale(${scale})`, transformOrigin: 'center' } : {};

  // Empty slot (when card is null and not hidden)
  if (!card && !isHidden) {
    return (
      <div 
        style={scaleStyle}
        className={`w-16 h-24 sm:w-20 sm:h-28 rounded-xl border-2 border-dashed border-gray-400 bg-black/10 flex items-center justify-center ${className}`}
      />
    );
  }

  // Face-down card
  if (isHidden) {
    return (
      <motion.div 
        whileHover={isPlayable && onClick ? { y: -10, scale: 1.05 } : (onClick ? { y: -10 } : {})}
        onClick={onClick}
        style={scaleStyle}
        className={`w-16 h-24 sm:w-20 sm:h-28 rounded-xl bg-white shadow-lg border border-gray-300 overflow-hidden cursor-pointer flex items-center justify-center relative ${className}`}
      >
        <img 
          src="/cards/back.png" 
          alt="Card Back" 
          className="w-full h-full object-fill select-none pointer-events-none rounded-xl" 
        />
      </motion.div>
    );
  }

  // Real card face image path
  const filename = `${card!.rank}_of_${card!.suit}.png`.toLowerCase();
  const imagePath = `/cards/${filename}`;

  return (
    <motion.div
      whileHover={isPlayable ? { y: -15, scale: 1.05 } : {}}
      onClick={isPlayable ? onClick : undefined}
      style={scaleStyle}
      className={`w-16 h-24 sm:w-20 sm:h-28 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex items-center justify-center select-none ${isPlayable ? 'cursor-pointer hover:shadow-xl ring-2 ring-amber-500/50' : ''} ${className}`}
    >
      <img 
        src={imagePath} 
        alt={`${card!.rank} of ${card!.suit}`} 
        className="w-full h-full object-fill pointer-events-none rounded-xl"
      />
    </motion.div>
  );
};

