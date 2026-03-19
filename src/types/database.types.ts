// ==========================================
// DATABASE TYPES
// All TypeScript interfaces matching Firebase structure
// ==========================================

/** Game states the system can be in */
export type GameState = "idle" | "countdown" | "active" | "finished";

/** Target zones on the football wall */
export type TargetId =
  | "top_right"
  | "top_left"
  | "bottom_left"
  | "bottom_right"
  | "center";

// ----------------------------------------
// CONTROL NODE
// ----------------------------------------

/** Controls the current state of the game display */
export interface GameControl {
  gameState: GameState;
  idleMessage: string;
}

// ----------------------------------------
// SETTINGS NODE
// ----------------------------------------

/** Configurable game settings stored in Firebase */
export interface GameSettings {
  secondsPerGame: number;
  prizeThreshold: number;
  slogans: string[];
}

// ----------------------------------------
// CURRENT GAME NODE
// ----------------------------------------

/** A single hit recorded during gameplay */
export interface Hit {
  targetId: TargetId;
  points: number;
  timeToHitMs: number;
  timestamp: number;
}

/** The currently active game session */
export interface CurrentGame {
  playerId: string;
  playerName: string;
  totalScore: number;
  startedAt: number;
  hits: Record<string, Hit>;
}

// ----------------------------------------
// PLAYERS NODE
// ----------------------------------------

/** Player profile with lifetime statistics */
export interface Player {
  displayName: string;
  lifetimeScore: number;
  gamesPlayed: number;
  lastPlayed: number;
  personalBest: number;
}

// ----------------------------------------
// LEADERBOARD NODE
// ----------------------------------------

/** A single leaderboard entry for a completed game */
export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  score: number;
  dateString: string;
  timestamp: number;
}
