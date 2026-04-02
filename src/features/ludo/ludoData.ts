export type PlayerColor = 'green' | 'yellow' | 'blue' | 'red';

export interface TokenState {
  id: number;
  color: PlayerColor;
  pathIndex: number; // -1 = home base, 0-56 = on path, 57 = finished (center)
}

export const PLAYER_COLORS: PlayerColor[] = ['green', 'yellow', 'blue', 'red'];
export const TURN_ORDER_4P: PlayerColor[] = ['green', 'yellow', 'blue', 'red'];
export const TURN_ORDER_2P: PlayerColor[] = ['green', 'blue'];

export const COLOR_HEX: Record<PlayerColor, string> = {
  green: '#4CAF50', yellow: '#FFC107', blue: '#2196F3', red: '#F44336',
};
export const COLOR_LIGHT: Record<PlayerColor, string> = {
  green: '#A5D6A7', yellow: '#FFF176', blue: '#90CAF9', red: '#EF9A9A',
};
export const COLOR_DARK: Record<PlayerColor, string> = {
  green: '#2E7D32', yellow: '#F9A825', blue: '#1565C0', red: '#C62828',
};

// 52-cell common path, clockwise from Red's entry
export const COMMON_PATH: [number, number][] = [
  [13,6],[12,6],[11,6],[10,6],[9,6],
  [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
  [7,0],[6,0],
  [6,1],[6,2],[6,3],[6,4],[6,5],
  [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
  [0,7],[0,8],
  [1,8],[2,8],[3,8],[4,8],[5,8],
  [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
  [7,14],[8,14],
  [8,13],[8,12],[8,11],[8,10],[8,9],
  [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
  [14,7],[14,6],
];

export const HOME_STRETCHES: Record<PlayerColor, [number, number][]> = {
  red:    [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]],
  green:  [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]],
  yellow: [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],
  blue:   [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]],
};

const ENTRY_INDEX: Record<PlayerColor, number> = {
  red: 0, green: 13, yellow: 26, blue: 39,
};

export function getPlayerPath(color: PlayerColor): [number, number][] {
  const entry = ENTRY_INDEX[color];
  const path: [number, number][] = [];
  for (let i = 0; i < 51; i++) {
    path.push(COMMON_PATH[(entry + i) % 52]);
  }
  path.push(...HOME_STRETCHES[color]);
  path.push([7, 7]); // center = finished
  return path; // 58 cells, indices 0-57
}

export const HOME_POSITIONS: Record<PlayerColor, [number, number][]> = {
  green:  [[2,2],[2,3],[3,2],[3,3]],
  yellow: [[2,11],[2,12],[3,11],[3,12]],
  red:    [[11,2],[11,3],[12,2],[12,3]],
  blue:   [[11,11],[11,12],[12,11],[12,12]],
};

export const SAFE_ZONE_CELLS = new Set(
  [0, 8, 13, 21, 26, 34, 39, 47].map(i => `${COMMON_PATH[i][0]},${COMMON_PATH[i][1]}`)
);

export function createInitialTokens(): Record<PlayerColor, TokenState[]> {
  const result = {} as Record<PlayerColor, TokenState[]>;
  for (const color of PLAYER_COLORS) {
    result[color] = [0, 1, 2, 3].map(id => ({ id, color, pathIndex: -1 }));
  }
  return result;
}

export function getTokenGridPos(
  token: TokenState,
  paths: Record<PlayerColor, [number, number][]>
): [number, number] {
  if (token.pathIndex === -1) return HOME_POSITIONS[token.color][token.id];
  return paths[token.color][token.pathIndex];
}
