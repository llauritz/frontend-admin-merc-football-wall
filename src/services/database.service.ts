import { ref, get, set, update, push, increment, runTransaction, query, orderByChild, limitToLast, remove } from "firebase/database";
import { db } from "@/firebase";
import type {
  GameSettings,
  LeaderboardEntry,
  GameState,
  TargetId,
  QueueEntry,
  CurrentPlayer,
  GameStateData,
} from "@/types";
import { DEFAULT_SETTINGS, DEFAULT_GAME_STATE, DEFAULT_IDLE_MESSAGES } from "@/constants";

// ==========================================
// DATABASE SERVICE
// All Firebase database operations (New Schema Only)
// ==========================================

export const DatabaseService = {
  // ----------------------------------------
  // SETTINGS OPERATIONS
  // ----------------------------------------

  /** Fetches current settings */
  async getSettings(): Promise<GameSettings> {
    try {
      const snapshot = await get(ref(db, "settings"));
      if (snapshot.exists()) {
        return snapshot.val() as GameSettings;
      }
      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error("Error fetching settings:", error);
      return DEFAULT_SETTINGS;
    }
  },

  /** Updates only the provided settings keys */
  async updateSettings(settings: Partial<GameSettings>): Promise<void> {
    await update(ref(db, "settings"), settings);
  },

  // ----------------------------------------
  // PLAYER OPERATIONS
  // ----------------------------------------

  /** Updates player statistics after a game safely via Transaction */
  async updatePlayerStats(uid: string, displayName: string, scoreToAdd: number): Promise<void> {
    try {
      const playerRef = ref(db, `players/${uid}`);
      const now = Date.now();

      await runTransaction(playerRef, (player) => {
        if (player) {
          player.lifetimeScore = (player.lifetimeScore || 0) + scoreToAdd;
          player.gamesPlayed = (player.gamesPlayed || 0) + 1;
          player.lastPlayed = now;
          player.personalBest = Math.max(player.personalBest || 0, scoreToAdd);
        } else {
          return {
            displayName,
            lifetimeScore: scoreToAdd,
            gamesPlayed: 1,
            lastPlayed: now,
            personalBest: scoreToAdd,
          };
        }
        return player;
      });
    } catch (error) {
      console.error("Error updating player stats:", error);
      throw error;
    }
  },

  // ----------------------------------------
  // LEADERBOARD OPERATIONS
  // ----------------------------------------

  /** Fetches leaderboard entries sorted by score (descending) */
  async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      const leaderboardRef = ref(db, "leaderboard");
      const leaderboardQuery = query(leaderboardRef, orderByChild("score"), limitToLast(limit));
      const snapshot = await get(leaderboardQuery);

      if (!snapshot.exists()) {
        return [];
      }

      const entries: LeaderboardEntry[] = [];
      snapshot.forEach((child) => {
        entries.push({ id: child.key!, ...child.val() });
      });

      return entries.reverse();
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      return [];
    }
  },

  // ----------------------------------------
  // QUEUE OPERATIONS
  // ----------------------------------------

  /** Adds a player to the queue */
  async addToQueue(name: string): Promise<string> {
    try {
      const queueRef = ref(db, "queue");
      const newEntryRef = push(queueRef);
      const id = newEntryRef.key!;

      await set(newEntryRef, {
        id,
        name,
        timestamp: Date.now(),
      });

      return id;
    } catch (error) {
      console.error("Error adding to queue:", error);
      throw error;
    }
  },

  /** Removes a player from the queue */
  async removeFromQueue(queueKey: string): Promise<void> {
    try {
      await remove(ref(db, `queue/${queueKey}`));
    } catch (error) {
      console.error("Error removing from queue:", error);
      throw error;
    }
  },

  /** Updates a player's name in the queue */
  async updateQueueEntry(queueKey: string, name: string): Promise<void> {
    try {
      await update(ref(db, `queue/${queueKey}`), { name });
    } catch (error) {
      console.error("Error updating queue entry:", error);
      throw error;
    }
  },

  /** Clears the entire queue */
  async clearQueue(): Promise<void> {
    try {
      await remove(ref(db, "queue"));
    } catch (error) {
      console.error("Error clearing queue:", error);
      throw error;
    }
  },

  // ----------------------------------------
  // GAME STATE OPERATIONS
  // ----------------------------------------

  /** Updates the game status */
  async updateGameStatus(status: GameState): Promise<void> {
    try {
      await update(ref(db, "gameState"), { status });
    } catch (error) {
      console.error("Error updating game status:", error);
      throw error;
    }
  },

  /** Sets the active LED message */
  async setActiveLedMessage(message: string): Promise<void> {
    try {
      await update(ref(db, "gameState"), { activeLedMessage: message });
    } catch (error) {
      console.error("Error setting LED message:", error);
      throw error;
    }
  },

  /** Ensures the idle message pool exists in Firebase */
  async ensureIdleMessagesPool(): Promise<void> {
    try {
      const idleMessagesRef = ref(db, "idleMessages");
      const snapshot = await get(idleMessagesRef);

      if (!snapshot.exists()) {
        await set(idleMessagesRef, [...DEFAULT_IDLE_MESSAGES]);
        return;
      }

      const currentValue = snapshot.val();
      if (!Array.isArray(currentValue) || currentValue.length === 0) {
        await set(idleMessagesRef, [...DEFAULT_IDLE_MESSAGES]);
      }
    } catch (error) {
      console.error("Error ensuring idle messages pool:", error);
      throw error;
    }
  },

  /** Adds a message to the idle LED pool stored in Firebase */
  async addIdleMessage(message: string): Promise<void> {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    try {
      await runTransaction(ref(db, "idleMessages"), (currentValue) => {
        const currentMessages = Array.isArray(currentValue)
          ? currentValue
          : [...DEFAULT_IDLE_MESSAGES];

        if (currentMessages.includes(trimmedMessage)) {
          return currentMessages;
        }

        return [...currentMessages, trimmedMessage];
      });
    } catch (error) {
      console.error("Error adding idle message:", error);
      throw error;
    }
  },

  /** Removes a message from the idle LED pool stored in Firebase */
  async removeIdleMessage(message: string): Promise<void> {
    try {
      await runTransaction(ref(db, "idleMessages"), (currentValue) => {
        const currentMessages = Array.isArray(currentValue)
          ? currentValue
          : [...DEFAULT_IDLE_MESSAGES];

        const nextMessages = currentMessages.filter((item) => item !== message);
        return nextMessages.length > 0 ? nextMessages : [DEFAULT_IDLE_MESSAGES[0]];
      });
    } catch (error) {
      console.error("Error removing idle message:", error);
      throw error;
    }
  },

  /** Prepares a game for the next player */
  async prepareGame(player: CurrentPlayer, queueKey: string): Promise<void> {
    try {
      const updates: Record<string, unknown> = {};
      updates["gameState/status"] = "preparing";
      updates["gameState/currentPlayer"] = player;
      updates["gameState/currentQueueKey"] = queueKey;
      updates["gameState/currentScore"] = 0;
      updates["gameState/hits"] = null;

      await update(ref(db), updates);
    } catch (error) {
      console.error("Error preparing game:", error);
      throw error;
    }
  },

  /** Skips the current player and prepares the next one in queue */
  async skipPlayer(): Promise<boolean> {
    try {
      const gameStateRef = ref(db, "gameState");
      const queueRef = ref(db, "queue");

      const [gameSnapshot, queueSnapshot] = await Promise.all([
        get(gameStateRef),
        get(queueRef),
      ]);

      if (!gameSnapshot.exists()) return false;

      const gameState = gameSnapshot.val() as GameStateData;
      const currentQueueKey = gameState.currentQueueKey;

      const queueEntries: Array<{ key: string; data: QueueEntry }> = [];
      if (queueSnapshot.exists()) {
        queueSnapshot.forEach((child) => {
          queueEntries.push({ key: child.key!, data: child.val() });
        });
        queueEntries.sort((a, b) => a.data.timestamp - b.data.timestamp);
      }

      const updates: Record<string, unknown> = {};

      if (currentQueueKey) {
        updates[`queue/${currentQueueKey}`] = null;
      }

      const nextEntry = queueEntries.find((e) => e.key !== currentQueueKey);

      if (nextEntry) {
        updates["gameState/status"] = "preparing";
        updates["gameState/currentPlayer"] = {
          id: nextEntry.data.id,
          name: nextEntry.data.name,
        };
        updates["gameState/currentQueueKey"] = nextEntry.key;
        updates["gameState/currentScore"] = 0;
        updates["gameState/hits"] = null;
      } else {
        updates["gameState/status"] = "idle";
        updates["gameState/currentPlayer"] = null;
        updates["gameState/currentQueueKey"] = null;
        updates["gameState/currentScore"] = 0;
        updates["gameState/hits"] = null;
      }

      await update(ref(db), updates);
      return !!nextEntry;
    } catch (error) {
      console.error("Error skipping player:", error);
      throw error;
    }
  },

  /** Starts countdown phase */
  async startCountdown(): Promise<void> {
    try {
      await update(ref(db, "gameState"), { status: "countdown" });
    } catch (error) {
      console.error("Error starting countdown:", error);
      throw error;
    }
  },

  /** Starts the actual game and removes player from queue */
  async startGame(): Promise<void> {
    try {
      const gameStateSnapshot = await get(ref(db, "gameState"));
      const queueKey = gameStateSnapshot.exists()
        ? gameStateSnapshot.val().currentQueueKey
        : null;

      const updates: Record<string, unknown> = {};
      updates["gameState/status"] = "game";
      updates["gameState/startedAt"] = Date.now();
      updates["gameState/currentScore"] = 0;
      updates["gameState/hits"] = null;
      updates["gameState/currentQueueKey"] = null;

      if (queueKey) {
        updates[`queue/${queueKey}`] = null;
      }

      await update(ref(db), updates);
    } catch (error) {
      console.error("Error starting game:", error);
      throw error;
    }
  },

  /** Records a score hit during game */
  async recordGameHit(points: number, targetId?: TargetId): Promise<void> {
    try {
      const newHitKey = push(ref(db, "gameState/hits")).key;
      const updates: Record<string, unknown> = {};

      updates[`gameState/hits/${newHitKey}`] = {
        points,
        targetId,
        timestamp: Date.now(),
      };
      updates["gameState/currentScore"] = increment(points);
      updates["gameState/lastActionTrigger"] = {
        action: `score_${points}`,
        timestamp: Date.now(),
      };

      await update(ref(db), updates);
    } catch (error) {
      console.error("Error recording hit:", error);
      throw error;
    }
  },

  /** Undoes the last hit */
  async undoLastHit(): Promise<void> {
    try {
      const gameStateRef = ref(db, "gameState");
      const snapshot = await get(gameStateRef);

      if (!snapshot.exists()) return;

      const gameState = snapshot.val() as GameStateData;
      if (!gameState.hits) return;

      const hitKeys = Object.keys(gameState.hits);
      if (hitKeys.length === 0) return;

      const lastHitKey = hitKeys[hitKeys.length - 1];
      const lastHit = gameState.hits[lastHitKey];

      const updates: Record<string, unknown> = {};
      updates[`gameState/hits/${lastHitKey}`] = null;
      updates["gameState/currentScore"] = increment(-lastHit.points);
      updates["gameState/lastActionTrigger"] = {
        action: "undo",
        timestamp: Date.now(),
      };

      await update(ref(db), updates);
    } catch (error) {
      console.error("Error undoing hit:", error);
      throw error;
    }
  },

  /** Finishes the game and archives the score */
  async finishGame(): Promise<{ score: number; isWinner: boolean } | null> {
    try {
      const gameStateRef = ref(db, "gameState");
      const settingsRef = ref(db, "settings");

      const [gameSnapshot, settingsSnapshot] = await Promise.all([
        get(gameStateRef),
        get(settingsRef),
      ]);

      if (!gameSnapshot.exists()) return null;

      const gameState = gameSnapshot.val() as GameStateData;
      const settings = settingsSnapshot.exists()
        ? (settingsSnapshot.val() as GameSettings)
        : DEFAULT_SETTINGS;

      if (!gameState.currentPlayer) return null;

      const now = new Date();
      const dateString = now.toISOString().split("T")[0];
      const score = gameState.currentScore || 0;
      const isWinner = score >= settings.instantWinThreshold;

      const newLeaderboardKey = push(ref(db, "leaderboard")).key;

      const updates: Record<string, unknown> = {};

      updates[`leaderboard/${newLeaderboardKey}`] = {
        playerId: gameState.currentPlayer.id,
        playerName: gameState.currentPlayer.name,
        score,
        dateString,
        timestamp: now.getTime(),
      };

      updates["gameState/status"] = "finished";

      await Promise.all([
        update(ref(db), updates),
        this.updatePlayerStats(
          gameState.currentPlayer.id,
          gameState.currentPlayer.name,
          score
        ),
      ]);

      return { score, isWinner };
    } catch (error) {
      console.error("Error finishing game:", error);
      throw error;
    }
  },

  /** Returns to idle state, clearing current player */
  async returnToIdle(): Promise<void> {
    try {
      await update(ref(db, "gameState"), {
        status: "idle",
        currentPlayer: null,
        currentQueueKey: null,
        currentScore: 0,
        startedAt: null,
        hits: null,
        lastActionTrigger: null,
      });
    } catch (error) {
      console.error("Error returning to idle:", error);
      throw error;
    }
  },

  /** Force reset game state (for debug) */
  async forceResetState(): Promise<void> {
    try {
      await set(ref(db, "gameState"), DEFAULT_GAME_STATE);
    } catch (error) {
      console.error("Error force resetting state:", error);
      throw error;
    }
  },
};