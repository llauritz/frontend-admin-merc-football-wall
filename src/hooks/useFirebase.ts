import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/firebase";
import type {
  GameStateData,
  QueueEntry,
  GameSettings,
  LeaderboardEntry,
} from "@/types";
import { DEFAULT_SETTINGS, DEFAULT_GAME_STATE, DEFAULT_IDLE_MESSAGES } from "@/constants";

// ==========================================
// CONNECTION STATUS HOOK
// ==========================================

export function useConnectionStatus(): boolean {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const connectedRef = ref(db, ".info/connected");
    const unsubscribe = onValue(connectedRef, (snapshot) => {
      setIsConnected(snapshot.val() === true);
    });

    return () => unsubscribe();
  }, []);

  return isConnected;
}

// ==========================================
// DATA READY HOOK
// ==========================================

export function useFirebasePathsReady(paths: string[]): boolean {
  const [isReady, setIsReady] = useState(false);
  const uniquePaths = Array.from(new Set(paths));
  const pathsKey = uniquePaths.sort().join("|");

  useEffect(() => {
    if (uniquePaths.length === 0) {
      setIsReady(true);
      return;
    }

    setIsReady(false);

    const loadedPaths = new Set<string>();
    const unsubscribers = uniquePaths.map((path) =>
      onValue(ref(db, path), () => {
        loadedPaths.add(path);
        if (loadedPaths.size === uniquePaths.length) {
          setIsReady(true);
        }
      })
    );

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [pathsKey]);

  return isReady;
}

// ==========================================
// GAME STATE HOOK
// ==========================================

export function useGameState(): GameStateData {
  const [gameState, setGameState] = useState<GameStateData>(DEFAULT_GAME_STATE);

  useEffect(() => {
    const gameStateRef = ref(db, "gameState");
    const unsubscribe = onValue(gameStateRef, (snapshot) => {
      if (snapshot.exists()) {
        setGameState({ ...DEFAULT_GAME_STATE, ...snapshot.val() });
      } else {
        setGameState(DEFAULT_GAME_STATE);
      }
    });

    return () => unsubscribe();
  }, []);

  return gameState;
}

// ==========================================
// TIME REMAINING HOOK (calculated from startedAt)
// ==========================================

export function useTimeRemaining(startedAt: number | null, timeLimit: number): number {
  const [timeRemaining, setTimeRemaining] = useState<number>(timeLimit);

  useEffect(() => {
    // If no startedAt, return full time limit
    if (!startedAt) {
      setTimeRemaining(timeLimit);
      return;
    }

    // Calculate remaining time
    const calculateRemaining = () => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const remaining = Math.max(0, timeLimit - elapsed);
      setTimeRemaining(Math.ceil(remaining));
      return remaining;
    };

    // Initial calculation
    const remaining = calculateRemaining();

    // If already finished, no need for interval
    if (remaining <= 0) return;

    // Update every 100ms for smooth countdown
    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [startedAt, timeLimit]);

  return timeRemaining;
}

// ==========================================
// QUEUE HOOKS
// ==========================================

export function useQueue(): QueueEntry[] {
  const [queue, setQueue] = useState<QueueEntry[]>([]);

  useEffect(() => {
    const queueRef = ref(db, "queue");
    const unsubscribe = onValue(queueRef, (snapshot) => {
      if (snapshot.exists()) {
        const entries: QueueEntry[] = [];
        snapshot.forEach((child) => {
          entries.push({ ...child.val(), id: child.key! });
        });
        // Sort by timestamp (oldest first)
        entries.sort((a, b) => a.timestamp - b.timestamp);
        setQueue(entries);
      } else {
        setQueue([]);
      }
    });

    return () => unsubscribe();
  }, []);

  return queue;
}

export function useNextInQueue(): QueueEntry | null {
  const [nextPlayer, setNextPlayer] = useState<QueueEntry | null>(null);

  useEffect(() => {
    const queueRef = ref(db, "queue");
    const unsubscribe = onValue(queueRef, (snapshot) => {
      if (snapshot.exists()) {
        const entries: QueueEntry[] = [];
        snapshot.forEach((child) => {
          entries.push({ ...child.val(), id: child.key! });
        });
        // Sort by timestamp and get the first one
        entries.sort((a, b) => a.timestamp - b.timestamp);
        setNextPlayer(entries[0] || null);
      } else {
        setNextPlayer(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return nextPlayer;
}

// ==========================================
// SETTINGS HOOK
// ==========================================

export function useSettings(): GameSettings {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const settingsRef = ref(db, "settings");
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        setSettings({ ...DEFAULT_SETTINGS, ...snapshot.val() });
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    });

    return () => unsubscribe();
  }, []);

  return settings;
}

// ==========================================
// IDLE LED MESSAGE POOL HOOK
// ==========================================

function normalizeIdleMessages(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }

  if (value && typeof value === "object") {
    return Object.values(value)
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }

  return [];
}

export function useIdleMessages(): string[] {
  const [idleMessages, setIdleMessages] = useState<string[]>([...DEFAULT_IDLE_MESSAGES]);

  useEffect(() => {
    const idleMessagesRef = ref(db, "idleMessages");
    const unsubscribe = onValue(idleMessagesRef, (snapshot) => {
      if (!snapshot.exists()) {
        setIdleMessages([...DEFAULT_IDLE_MESSAGES]);
        return;
      }

      const normalized = normalizeIdleMessages(snapshot.val());
      setIdleMessages(normalized.length > 0 ? normalized : [...DEFAULT_IDLE_MESSAGES]);
    });

    return () => unsubscribe();
  }, []);

  return idleMessages;
}

// ==========================================
// DATABASE SNAPSHOT HOOK (for debug)
// ==========================================

export function useDatabaseSnapshot(): unknown {
  const [snapshot, setSnapshot] = useState<unknown>(null);

  useEffect(() => {
    const rootRef = ref(db, "/");
    const unsubscribe = onValue(rootRef, (snap) => {
      setSnapshot(snap.val());
    });

    return () => unsubscribe();
  }, []);

  return snapshot;
}

// ==========================================
// LEADERBOARD HOOK
// ==========================================

export function useLeaderboard(limit: number = 10): LeaderboardEntry[] {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const leaderboardRef = ref(db, "leaderboard");
    const unsubscribe = onValue(leaderboardRef, (snapshot) => {
      if (snapshot.exists()) {
        const entries: LeaderboardEntry[] = [];
        snapshot.forEach((child) => {
          entries.push({ id: child.key!, ...child.val() });
        });
        // Sort by score descending and limit
        entries.sort((a, b) => b.score - a.score);
        setLeaderboard(entries.slice(0, limit));
      } else {
        setLeaderboard([]);
      }
    });

    return () => unsubscribe();
  }, [limit]);

  return leaderboard;
}
