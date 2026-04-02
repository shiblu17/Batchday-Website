import React from 'react';
import { PlayerColor, COLOR_HEX, COLOR_DARK } from './ludoData';

const DICE_DOTS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 72], [72, 28]],
  3: [[28, 72], [50, 50], [72, 28]],
  4: [[28, 28], [28, 72], [72, 28], [72, 72]],
  5: [[28, 28], [28, 72], [50, 50], [72, 28], [72, 72]],
  6: [[28, 22], [28, 50], [28, 78], [72, 22], [72, 50], [72, 78]],
};

interface DiceProps {
  value: number;
  color: PlayerColor;
  isRolling: boolean;
  canRoll: boolean;
  onRoll: () => void;
}

const LudoDice = ({ value, color, isRolling, canRoll, onRoll }: DiceProps) => {
  return (
    <div className="flex flex-col items-center gap-1.5 animate-in fade-in zoom-in duration-300">
      {/* Dice */}
      <div
        className={`relative cursor-${canRoll ? 'pointer' : 'default'} active:scale-95 transition-transform`}
        style={{
          width: 'clamp(44px, 10vmin, 64px)',
          height: 'clamp(44px, 10vmin, 64px)',
        }}
        onClick={canRoll ? onRoll : undefined}
      >
        {/* Dice shadow */}
        <div className="absolute inset-0 rounded-2xl"
          style={{
            background: COLOR_DARK[color],
            transform: 'translateY(4px)',
            borderRadius: '16px',
            opacity: 0.8
          }}
        />
        {/* Dice body */}
        <div
          className={`absolute inset-0 rounded-2xl ${isRolling ? 'animate-dice-spin' : ''}`}
          style={{
            background: `linear-gradient(135deg, #FFFFFF 0%, #FAFAFA 100%)`,
            border: `3px solid ${COLOR_HEX[color]}`,
            borderRadius: '16px',
            boxShadow: `0 4px 12px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,1)`,
          }}
        >
          {DICE_DOTS[value]?.map(([top, left], i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 'clamp(6px, 1.8vmin, 10px)',
                height: 'clamp(6px, 1.8vmin, 10px)',
                top: `${top}%`,
                left: `${left}%`,
                transform: 'translate(-50%, -50%)',
                background: `radial-gradient(circle at 30% 30%, ${COLOR_HEX[color]}, ${COLOR_DARK[color]})`,
                boxShadow: `0 2px 4px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.3)`,
              }}
            />
          ))}
        </div>

        {/* Tap hint pulse */}
        {canRoll && !isRolling && (
          <div className="absolute -inset-1 rounded-2xl animate-dice-pulse opacity-40 pointer-events-none"
            style={{
              border: `2.5px solid ${COLOR_HEX[color]}`,
              borderRadius: '18px',
            }}
          />
        )}
      </div>


    </div>
  );
};

export default LudoDice;
