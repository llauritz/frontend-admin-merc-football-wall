import { ref, get, set, update, push, onValue, off, increment } from "firebase/database";
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

  /** Updates game settings */
  /* async updateSettings(settings: Partial<GameSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      await set(ref(db, "settings"), { ...currentSettings, ...settings });
    } catch (error) {
      console.error("Error updating settings:", error);
      throw error;
    }
  }, */

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

  /** Records a hit and updates the total score */
  /* async recordHit(targetId: TargetId, points: number, timeToHitMs: number = 0): Promise<void> {
    try {
      // Add the hit
      const hitsRef = ref(db, "currentGame/hits");
      const newHitRef = push(hitsRef);
      await set(newHitRef, {
        targetId,
        points,
        timeToHitMs,
        timestamp: Date.now(),
      } as Hit);

      // Update total score
      const scoreRef = ref(db, "currentGame/totalScore");
      const snapshot = await get(scoreRef);
      const currentScore = snapshot.exists() ? snapshot.val() : 0;
      await set(scoreRef, currentScore + points);
    } catch (error) {
      console.error("Error recording hit:", error);
      throw error;
    }
  }, */

  async recordHit(targetId: TargetId, points: number, timeToHitMs: number = 0): Promise<void> {
    // 1. Record the hit
    const newHitRef = push(ref(db, "currentGame/hits"));
    await set(newHitRef, {
      targetId,
      points,
      timeToHitMs,
      timestamp: Date.now(),
    });

    // 2. Atomically increment the total score (1 network trip, race-condition safe)
    await set(ref(db, "currentGame/totalScore"), increment(points));
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

  /** Fetches a player by UID */
  async getPlayer(uid: string): Promise<Player | null> {
    try {
      const snapshot = await get(ref(db, `players/${uid}`));
      return snapshot.exists() ? (snapshot.val() as Player) : null;
    } catch (error) {
      console.error("Error fetching player:", error);
      return null;
    }
  },

  /** Updates player statistics after a game */
  async updatePlayerStats(uid: string, displayName: string, scoreToAdd: number): Promise<void> {
    try {
      const playerRef = ref(db, `players/${uid}`);
      const snapshot = await get(playerRef);
      const now = Date.now();

      if (snapshot.exists()) {
        const player = snapshot.val() as Player;
        await update(playerRef, {
          lifetimeScore: player.lifetimeScore + scoreToAdd,
          gamesPlayed: player.gamesPlayed + 1,
          lastPlayed: now,
          personalBest: Math.max(player.personalBest, scoreToAdd),
        });
      } else {
        await set(playerRef, {
          displayName,
          lifetimeScore: scoreToAdd,
          gamesPlayed: 1,
          lastPlayed: now,
          personalBest: scoreToAdd,
        } as Player);
      }
    } catch (error) {
      console.error("Error updating player stats:", error);
      throw error;
    }
  },

  // ----------------------------------------
  // LEADERBOARD OPERATIONS
  // ----------------------------------------

  /** Submits a game result to the leaderboard */
  async submitToLeaderboard(
    playerId: string,
    playerName: string,
    finalScore: number
  ): Promise<void> {
    try {
      const now = new Date();
      const dateString = now.toISOString().split("T")[0];

      const leaderboardRef = ref(db, "leaderboard");
      const newEntryRef = push(leaderboardRef);

      await set(newEntryRef, {
        playerId,
        playerName,
        score: finalScore,
        dateString,
        timestamp: now.getTime(),
      } as LeaderboardEntry);

      // Update player stats
      await this.updatePlayerStats(playerId, playerName, finalScore);
    } catch (error) {
      console.error("Error submitting to leaderboard:", error);
      throw error;
    }
  },

  /** Finishes the current game and submits results */
  async finishGame(): Promise<void> {
    try {
      const currentGame = await this.getCurrentGame();
      if (currentGame) {
        await this.submitToLeaderboard(
          currentGame.playerId,
          currentGame.playerName,
          currentGame.totalScore
        );
      }
      await this.setGameState("finished");
    } catch (error) {
      console.error("Error finishing game:", error);
      throw error;
    }
  },
};
