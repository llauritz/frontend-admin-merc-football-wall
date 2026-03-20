import type { GameSettings, TargetConfig, GameStateData } from "@/types";

// ==========================================
// DEFAULT VALUES
// ==========================================

export const DEFAULT_SETTINGS: GameSettings = {
  timeLimit: 30,
  instantWinThreshold: 200,
};

export const DEFAULT_GAME_STATE: GameStateData = {
  status: "idle",
  activeLedMessage: "POLE POSITION SHOOTOUT",
  idleMessage: "Step right up and test your aim!",
  currentPlayer: null,
  currentQueueKey: null,
  currentScore: 0,
  startedAt: null,
  lastActionTrigger: null,
  hits: {},
};

// ==========================================
// TARGET CONFIGURATIONS
// ==========================================

export const TARGET_CONFIGS: TargetConfig[] = [
  { id: "left_50", points: 50, label: "50" },
  { id: "left_30", points: 30, label: "30" },
  { id: "left_10", points: 10, label: "10" },
  { id: "center_100", points: 100, label: "100" },
  { id: "right_10", points: 10, label: "10" },
  { id: "right_30", points: 30, label: "30" },
  { id: "right_50", points: 50, label: "50" },
];

// ==========================================
// LED MESSAGES
// ==========================================

export const DEFAULT_IDLE_MESSAGES = [
  "POLE POSITION SHOOTOUT",
  "STEP UP AND PLAY!",
  "TEST YOUR AIM",
  "WIN BIG PRIZES!",
  "FOOTBALL CHALLENGE",
] as const;

// Backward-compatible alias while the app transitions to server-stored messages.
export const LED_MESSAGES = DEFAULT_IDLE_MESSAGES;

// ==========================================
// GAME RULES
// ==========================================

export const GAME_RULES = [
  "Each player gets 30 seconds to score as many points as possible",
  "Hit the targets to earn points: 10, 30, 50, or 100 points",
  "The center target is worth 100 points",
  "Score over 200 points to win an instant prize!",
];
