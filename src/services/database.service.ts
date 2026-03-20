import { ref, get, set, update, push, onValue, off, increment, runTransaction, query, orderByChild, limitToLast } from "firebase/database";
import { db } from "@/firebase";
import type {
  Player,
  GameControl,
  GameSettings,
  CurrentGame,
  Hit,
  LeaderboardEntry,
  GameState,
  TargetId,
} from "@/types";
import { DEFAULT_SETTINGS } from "@/constants";

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
  }
}
