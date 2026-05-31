import React, { useMemo } from 'react';
import {
  PlayerColor, TokenState, PLAYER_COLORS, COMMON_PATH,
  HOME_STRETCHES, SAFE_ZONE_CELLS,
  COLOR_HEX, COLOR_LIGHT, COLOR_DARK, getTokenGridPos,
} from './ludoData';

interface LudoBoardProps {
  tokens: Record<PlayerColor, TokenState[]>;
  activePlayers: PlayerColor[];
  paths: Record<PlayerColor, [number, number][]>;
  validMoveTokens: number[];
  currentPlayer: PlayerColor;
  onTokenClick: (color: PlayerColor, tokenId: number) => void;
}

function getCellBg(r: number, c: number): string {
  // Logic matches the 15x15 grid of Ludo Leap
  if (r < 6 && c < 6) return COLOR_HEX.green;
  if (r < 6 && c > 8) return COLOR_HEX.yellow;
  if (r > 8 && c < 6) return COLOR_HEX.red;
  if (r > 8 && c > 8) return COLOR_HEX.blue;
  if (r >= 6 && r <= 8 && c >= 6 && c <= 8) return 'center';
  for (const color of PLAYER_COLORS) {
    if (HOME_STRETCHES[color].some(([hr, hc]) => hr === r && hc === c))
      return COLOR_LIGHT[color];
  }
  return '#FFFFFF';
}

function isInHomeBase(r: number, c: number): boolean {
  return (r >= 1 && r <= 4 && c >= 1 && c <= 4) ||
    (r >= 1 && r <= 4 && c >= 10 && c <= 13) ||
    (r >= 10 && r <= 13 && c >= 1 && c <= 4) ||
    (r >= 10 && r <= 13 && c >= 10 && c <= 13);
}

function isPathCell(r: number, c: number): boolean {
  return COMMON_PATH.some(([pr, pc]) => pr === r && pc === c);
}

const LudoBoard = ({
  tokens, activePlayers, paths, validMoveTokens, currentPlayer, onTokenClick,
}: LudoBoardProps) => {
  const cells = useMemo(() => {
    const result = [];
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        const bgType = getCellBg(r, c);
        const isSafe = SAFE_ZONE_CELLS.has(`${r},${c}`);
        const isPath = isPathCell(r, c);
        const inHomeBase = isInHomeBase(r, c);
        const isHomeStretch = PLAYER_COLORS.some(col =>
          HOME_STRETCHES[col].some(([hr, hc]) => hr === r && hc === c)
        );
        const isCenter = bgType === 'center';

        if (isCenter) {
          result.push(<div key={`${r}-${c}`} className="relative" />);
          continue;
        }

        let bg = bgType;
        let border = '1px solid rgba(0,0,0,0.05)';
        if (inHomeBase) { bg = 'transparent'; border = 'none'; }
        else if (isPath || isHomeStretch) { 
          bg = isSafe ? (bgType === '#FFFFFF' ? '#F3F4F6' : bgType) : bgType;
          border = '1px solid rgba(0,0,0,0.08)'; 
        }

        result.push(
          <div key={`${r}-${c}`} className="relative flex items-center justify-center shadow-[inset_0_0_8px_rgba(0,0,0,0.02)]"
            style={{ backgroundColor: bg, border }}>
            {isSafe && (
              <span className="absolute opacity-50 select-none drop-shadow-sm text-gray-500"
                style={{ fontSize: 'clamp(10px, 2.5vw, 22px)' }}>🌳</span>
            )}
          </div>
        );
      }
    }
    return result;
  }, []);

  const centerOverlay = useMemo(() => {
    const cellPct = 100 / 15;
    return (
      <div className="absolute overflow-hidden"
        style={{ top: `${cellPct * 6}%`, left: `${cellPct * 6}%`, width: `${cellPct * 3}%`, height: `${cellPct * 3}%`, zIndex: 3 }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          <polygon points="0,0 50,50 0,100" fill={COLOR_HEX.green} />
          <polygon points="0,0 100,0 50,50" fill={COLOR_HEX.yellow} />
          <polygon points="100,0 100,100 50,50" fill={COLOR_HEX.blue} />
          <polygon points="0,100 50,50 100,100" fill={COLOR_HEX.red} />
          <circle cx="50" cy="50" r="14" fill="white" stroke="#ddd" strokeWidth="1" />
          <text x="50" y="52" fontSize="12" dominantBaseline="middle" textAnchor="middle">🏆</text>
          <line x1="0" y1="0" x2="100" y2="100" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
          <line x1="100" y1="0" x2="0" y2="100" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        </svg>
      </div>
    );
  }, []);

  const homeBaseOverlays = useMemo(() => {
    const cellPct = 100 / 15;
    const bases: { r: number; c: number; color: PlayerColor }[] = [
      { r: 0, c: 0, color: 'green' }, { r: 0, c: 9, color: 'yellow' },
      { r: 9, c: 0, color: 'red' }, { r: 9, c: 9, color: 'blue' },
    ];
    return bases.map(({ r, c, color }) => (
      <div key={`home-${color}`} className="absolute"
        style={{
          top: `${(r + 1) * cellPct + 0.3}%`, left: `${(c + 1) * cellPct + 0.3}%`,
          width: `${4 * cellPct - 0.6}%`, height: `${4 * cellPct - 0.6}%`,
          backgroundColor: '#FFFFFF', borderRadius: 'clamp(4px, 1.5vw, 12px)',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)', zIndex: 2,
          display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr',
          gap: 'clamp(2px, 0.8vw, 8px)', padding: 'clamp(4px, 1.5vw, 16px)',
        }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="rounded-full"
            style={{
              background: `radial-gradient(circle at 35% 35%, ${COLOR_LIGHT[color]}, ${COLOR_HEX[color]})`,
              border: `2px solid ${COLOR_DARK[color]}`, opacity: 0.3,
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.15)',
            }} />
        ))}
      </div>
    ));
  }, [tokens]); // Added tokens to dependencies to ensure updates if base token state changes visually

  const tokenElements = (() => {
    const posMap = new Map<string, { token: TokenState; pos: [number, number] }[]>();
    for (const color of activePlayers) {
      for (const token of tokens[color]) {
        const pos = getTokenGridPos(token, paths);
        const key = `${pos[0]},${pos[1]}`;
        if (!posMap.has(key)) posMap.set(key, []);
        posMap.get(key)!.push({ token, pos });
      }
    }

    const elements: JSX.Element[] = [];
    const cellPct = 100 / 15;
    const offsets4 = [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]];

    posMap.forEach((group) => {
      group.forEach(({ token, pos }, idx) => {
        const [r, c] = pos;
        const isMovable = token.color === currentPlayer &&
          validMoveTokens.includes(token.id) && token.pathIndex < 56;
        const sz = group.length > 2 ? 0.45 : group.length > 1 ? 0.55 : 0.7;
        let offR = 0, offC = 0;
        if (group.length > 1) {
          const off = offsets4[idx % 4];
          offR = off[0] * cellPct; offC = off[1] * cellPct;
        }

        elements.push(
          <div key={`t-${token.color}-${token.id}-${token.pathIndex}`}
            className={`absolute rounded-full transition-all duration-300 ease-in-out ${isMovable ? 'cursor-pointer pointer-events-auto' : 'cursor-default pointer-events-none'}`}
            style={{
              top: `${r * cellPct + (1 - sz) * cellPct / 2 + offR}%`,
              left: `${c * cellPct + (1 - sz) * cellPct / 2 + offC}%`,
              width: `${sz * cellPct}%`, height: `${sz * cellPct}%`,
              background: `radial-gradient(circle at 30% 30%, ${COLOR_LIGHT[token.color]} 0%, ${COLOR_HEX[token.color]} 50%, ${COLOR_DARK[token.color]} 100%)`,
              boxShadow: isMovable
                ? `0 0 12px 4px ${COLOR_HEX[token.color]}66, 0 8px 12px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.6)`
                : `0 4px 6px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.6)`,
              border: `1.5px solid ${COLOR_DARK[token.color]}`,
              zIndex: token.pathIndex >= 56 ? 4 : (isMovable ? 20 : 10),
              transform: isMovable ? 'scale(1.15) translateY(-2px)' : 'scale(1)',

            }}
            onClick={() => isMovable && onTokenClick(token.color, token.id)}
          >
            <div className="absolute rounded-full"
              style={{
                top: '15%', left: '15%', width: '35%', height: '35%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 100%)',
              }} />
          </div>
        );
      });
    });
    return elements;
  })();

  return (
    <div className="relative w-full shadow-2xl rounded-[32px] bg-white/40 backdrop-blur-xl p-3 border border-white/60" style={{ aspectRatio: '1' }}>
      <div className="absolute inset-3 shadow-inner"
        style={{
          display: 'grid', gridTemplateColumns: 'repeat(15, 1fr)', gridTemplateRows: 'repeat(15, 1fr)',
          border: '3px solid rgba(0,0,0,0.08)',
          background: 'rgba(255,255,255,0.85)', borderRadius: '24px', overflow: 'hidden'
        }}>
        {cells}
      </div>
      <div className="absolute inset-3 pointer-events-none">
        {homeBaseOverlays}
        {centerOverlay}
      </div>
      <div className="absolute inset-3 pointer-events-none">
        {tokenElements}
      </div>
    </div>
  );
};

export default LudoBoard;
