// ==========================================
// GAME STATE TYPES
// ==========================================

export type GameState = "idle" | "preparing" | "countdown" | "game" | "finished";

export type TargetId = "left_50" | "left_30" | "left_10" | "center_100" | "right_50" | "right_30" | "right_10";

// ==========================================
// DATABASE SCHEMA TYPES
// ==========================================

export interface CurrentPlayer {
  id: string;
  name: string;
}

export interface Hit {
  points: number;
  timestamp: number;
  targetId?: TargetId;
  timeToHitMs?: number;
}

export interface GameStateData {
  status: GameState;
  activeLedMessage: string;
  idleMessage: string;
  currentPlayer: CurrentPlayer | null;
  currentQueueKey: string | null;
  currentScore: number;
  startedAt: number | null;
  lastActionTrigger: ActionTrigger | null;
  hits: Record<string, Hit>;
}

export interface ActionTrigger {
  action: string;
  timestamp: number;
}

export interface QueueEntry {
  id: string;
  name: string;
  timestamp: number;
}

export interface LeaderboardEntry {
  id?: string;
  playerId: string;
  playerName: string;
  score: number;
  dateString: string;
  timestamp: number;
}

export interface Player {
  displayName: string;
  lifetimeScore: number;
  gamesPlayed: number;
  lastPlayed: number;
  personalBest: number;
}

export interface GameSettings {
  timeLimit: number;
  instantWinThreshold: number;
}

// ==========================================
// LEGACY TYPES (for compatibility)
// ==========================================

export interface GameControl {
  gameState: GameState;
  idleMessage: string;
}

export interface CurrentGame {
  playerId: string;
  playerName: string;
  totalScore: number;
  startedAt?: number;
  hits: Record<string, Hit>;
}

// ==========================================
// COMPONENT TYPES
// ==========================================

export interface TargetConfig {
  id: TargetId;
  points: number;
  label: string;
}
