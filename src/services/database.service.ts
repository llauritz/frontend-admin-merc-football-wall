import { ref, get, set, update, push, increment, runTransaction, query, orderByChild, limitToLast, remove } from "firebase/database";
import { db } from "@/firebase";
import type {
  GameControl,
  GameSettings,
  CurrentGame,
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
// All Firebase database operations
// ==========================================

export const DatabaseService = {
  // ----------------------------------------
  // GAME CONTROL OPERATIONS
  // ----------------------------------------

  /** Updates the game state */
  async setGameState(gameState: GameState, idleMessage?: string): Promise<void> {
    try {
      const updates: Partial<GameControl> = { gameState };
      if (idleMessage !== undefined) {
        updates.idleMessage = idleMessage;
      }
      await update(ref(db, "control"), updates);
    } catch (error) {
      console.error("Error setting game state:", error);
      throw error;
    }
  },

  /** Sets the idle display message */
  async setIdleMessage(message: string): Promise<void> {
    try {
      await update(ref(db, "control"), { idleMessage: message });
    } catch (error) {
      console.error("Error setting idle message:", error);
      throw error;
    }
  },

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

  // THE EFFICIENT WAY:
  async updateSettings(settings: Partial<GameSettings>): Promise<void> {
    // This updates only the provided keys and leaves the rest alone
    await update(ref(db, "settings"), settings);
  },

  // ----------------------------------------
  // CURRENT GAME OPERATIONS
  // ----------------------------------------

  /** Initializes a new game session */
  async startNewGame(playerId: string, playerName: string): Promise<void> {
    try {
      await set(ref(db, "currentGame"), {
        playerId,
        playerName,
        totalScore: 0,
        startedAt: Date.now(),
        hits: {},
      });
    } catch (error) {
      console.error("Error starting game:", error);
      throw error;
    }
  },

  async recordHit(targetId: TargetId, points: number, timeToHitMs: number = 0): Promise<void> {
    try {
      // 1. Generate a unique key for the new hit locally (NO network trip yet)
      const newHitKey = push(ref(db, "currentGame/hits")).key;

      // 2. Build our payload of simultaneous updates
      const updates: { [key: string]: any } = {};

      // Path A: The new hit data
      updates[`currentGame/hits/${newHitKey}`] = {
        targetId,
        points,
        timeToHitMs,
        timestamp: Date.now(),
      };

      // Path B: The score increment
      updates[`currentGame/totalScore`] = increment(points);

      // 3. Fire them both to Firebase in ONE single network trip
      // Note: We call update() on the root reference `ref(db)`
      await update(ref(db), updates);

    } catch (error) {
      console.error("Error recording hit:", error);
      throw error;
    }
  },

  /** Gets the current game data */
  async getCurrentGame(): Promise<CurrentGame | null> {
    try {
      const snapshot = await get(ref(db, "currentGame"));
      return snapshot.exists() ? (snapshot.val() as CurrentGame) : null;
    } catch (error) {
      console.error("Error fetching current game:", error);
      return null;
    }
  },

  // ----------------------------------------
  // PLAYER OPERATIONS
  // ----------------------------------------

  /** Updates player statistics after a game safely via Transaction */
  async updatePlayerStats(uid: string, displayName: string, scoreToAdd: number): Promise<void> {
    try {
      const playerRef = ref(db, `players/${uid}`);
      const now = Date.now();

      // runTransaction safely handles the read and write on Google's servers
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
  // LEADERBOARD & END GAME OPERATIONS
  // ----------------------------------------

  // Note: submitToLeaderboard logic has been absorbed into finishGame for efficiency

  /** Finishes the current game, submits results, clears game data, and updates state */
  async finishGame(): Promise<void> {
    try {
      const currentGame = await this.getCurrentGame();

      // If there's no game data, just cleanly end the game state
      if (!currentGame) {
        await this.setGameState("finished");
        return;
      }

      const now = new Date();
      const dateString = now.toISOString().split("T")[0];

      // 1. Generate a new leaderboard key locally
      const newLeaderboardKey = push(ref(db, "leaderboard")).key;

      // 2. Build our payload for simultaneous updates
      const updates: { [key: string]: any } = {};

      // Add result to leaderboard (query with orderByChild('score') to get sorted results)
      updates[`leaderboard/${newLeaderboardKey}`] = {
        playerId: currentGame.playerId,
        playerName: currentGame.playerName,
        score: currentGame.totalScore,
        dateString,
        timestamp: now.getTime(),
      };

      // Clear the current game data
      updates[`currentGame`] = null;

      // Update game state to finished
      updates[`control/gameState`] = "finished";

      // 3. Execute the Fan-Out AND the Transaction at the exact same time
      await Promise.all([
        update(ref(db), updates), // Writes Leaderboard, clears currentGame & updates GameState
        this.updatePlayerStats(currentGame.playerId, currentGame.playerName, currentGame.totalScore)
      ]);

    } catch (error) {
      console.error("Error finishing game:", error);
      throw error;
    }
  },

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

      // Firebase limitToLast returns ascending order, reverse for descending (highest first)
      return entries.reverse();
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      return [];
    }
  },

  // ----------------------------------------
  // QUEUE OPERATIONS (NEW SCHEMA)
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
  // GAME STATE OPERATIONS (NEW SCHEMA)
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

        // Keep at least one value so UI controls never become empty.
        return nextMessages.length > 0 ? nextMessages : [DEFAULT_IDLE_MESSAGES[0]];
      });
    } catch (error) {
      console.error("Error removing idle message:", error);
      throw error;
    }
  },

  /** Prepares a game for the next player (keeps player in queue until game starts) */
  async prepareGame(player: CurrentPlayer, queueKey: string): Promise<void> {
    try {
      const updates: Record<string, unknown> = {};

      // Set current player and status, store queueKey for later removal
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

      // Get all queue entries sorted by timestamp
      const queueEntries: Array<{ key: string; data: QueueEntry }> = [];
      if (queueSnapshot.exists()) {
        queueSnapshot.forEach((child) => {
          queueEntries.push({ key: child.key!, data: child.val() });
        });
        queueEntries.sort((a, b) => a.data.timestamp - b.data.timestamp);
      }

      const updates: Record<string, unknown> = {};

      // Remove current player from queue
      if (currentQueueKey) {
        updates[`queue/${currentQueueKey}`] = null;
      }

      // Find next player (excluding the one we're removing)
      const nextEntry = queueEntries.find((e) => e.key !== currentQueueKey);

      if (nextEntry) {
        // Prepare the next player
        updates["gameState/status"] = "preparing";
        updates["gameState/currentPlayer"] = {
          id: nextEntry.data.id,
          name: nextEntry.data.name,
        };
        updates["gameState/currentQueueKey"] = nextEntry.key;
        updates["gameState/currentScore"] = 0;
        updates["gameState/hits"] = null;
      } else {
        // No more players, return to idle
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
      // First get the current queue key to remove
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

      // Remove player from queue now that game is starting
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

      // Get last hit
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
  async finishGameNew(): Promise<{ score: number; isWinner: boolean } | null> {
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

      // Generate leaderboard key
      const newLeaderboardKey = push(ref(db, "leaderboard")).key;

      const updates: Record<string, unknown> = {};

      // Add to leaderboard
      updates[`leaderboard/${newLeaderboardKey}`] = {
        playerId: gameState.currentPlayer.id,
        playerName: gameState.currentPlayer.name,
        score,
        dateString,
        timestamp: now.getTime(),
      };

      // Update game state to finished
      updates["gameState/status"] = "finished";

      // Execute updates and player stats in parallel
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
}
