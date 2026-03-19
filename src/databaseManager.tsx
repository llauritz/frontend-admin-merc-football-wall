// src/databaseManager.tsx
import { ref, get, set, update, push, onValue, off, child } from "firebase/database";
import { db } from "./firebase";

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface Player {
    displayName: string;
    lifetimeScore: number;
    gamesPlayed: number;
    lastPlayed: number;
    personalBest: number;
}

export interface GameControl {
    gameState: "idle" | "active" | "finished";
    idleMessage: string;
}

export interface Hit {
    targetId: string;
    points: number;
    timeToHitMs: number;
    timestamp: number;
}

export interface LeaderboardEntry {
    playerId: string;
    playerName: string;
    score: number;
    dateString: string;
    timestamp: number;
}

// ==========================================
// DATABASE MANAGER
// ==========================================

export const DatabaseManager = {

    // ----------------------------------------
    // PLAYERS LOGIC
    // ----------------------------------------

    /** Fetches a player's data by UID */
    async getPlayer(uid: string): Promise<Player | null> {
        try {
            const snapshot = await get(child(ref(db), `players/${uid}`));
            return snapshot.exists() ? (snapshot.val() as Player) : null;
        } catch (error) {
            console.error("Error fetching player:", error);
            return null;
        }
    },

    /** Updates an existing player or creates a new one */
    async updatePlayerStats(uid: string, scoreToAdd: number): Promise<void> {
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
                    personalBest: Math.max(player.personalBest, scoreToAdd)
                });
            } else {
                // Create new player if they don't exist
                await set(playerRef, {
                    displayName: "New Player", // Ideally passed in
                    lifetimeScore: scoreToAdd,
                    gamesPlayed: 1,
                    lastPlayed: now,
                    personalBest: scoreToAdd
                });
            }
        } catch (error) {
            console.error("Error updating player stats:", error);
        }
    },

    // ----------------------------------------
    // GAME CONTROL LOGIC (State Machine)
    // ----------------------------------------

    /** Updates the global game state */
    async setGameState(gameState: GameControl["gameState"], idleMessage: string = ""): Promise<void> {
        try {
            await update(ref(db, 'control'), { gameState, idleMessage });
        } catch (error) {
            console.error("Error setting game state:", error);
        }
    },

    /** Subscribes to game state changes. Returns an unsubscribe function. */
    listenToGameState(callback: (state: GameControl) => void): () => void {
        const controlRef = ref(db, 'control');
        const listener = onValue(controlRef, (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.val() as GameControl);
            }
        });
        // Return a cleanup function so components can unmount cleanly
        return () => off(controlRef, "value", listener);
    },

    // ----------------------------------------
    // CURRENT GAME LOGIC
    // ----------------------------------------

    /** Initializes a new game session */
    async startNewGame(playerId: string, playerName: string): Promise<void> {
        try {
            await set(ref(db, 'currentGame'), {
                playerId,
                playerName,
                totalScore: 0,
                hits: {} // Clear previous hits
            });
            await this.setGameState("active", "Game is running!");
        } catch (error) {
            console.error("Error starting game:", error);
        }
    },

    /** Records a hit and updates the current game's total score */
    async recordHit(targetId: string, points: number, timeToHitMs: number): Promise<void> {
        try {
            // 1. Add the hit
            const hitsRef = ref(db, 'currentGame/hits');
            const newHitRef = push(hitsRef);
            await set(newHitRef, {
                targetId,
                points,
                timeToHitMs,
                timestamp: Date.now()
            });

            // 2. Fetch current score and add the new points
            const scoreRef = ref(db, 'currentGame/totalScore');
            const snapshot = await get(scoreRef);
            const currentScore = snapshot.exists() ? snapshot.val() : 0;

            await set(scoreRef, currentScore + points);
        } catch (error) {
            console.error("Error recording hit:", error);
        }
    },

    /** Subscribes to live game updates (score and hits) */
    listenToCurrentGame(callback: (data: any) => void): () => void {
        const gameRef = ref(db, 'currentGame');
        const listener = onValue(gameRef, (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.val());
            }
        });
        return () => off(gameRef, "value", listener);
    },

    // ----------------------------------------
    // LEADERBOARD LOGIC
    // ----------------------------------------

    /** Adds a finished game to the leaderboard */
    async submitToLeaderboard(playerId: string, playerName: string, finalScore: number): Promise<void> {
        try {
            const now = new Date();
            // Format as YYYY-MM-DD
            const dateString = now.toISOString().split('T')[0];

            const leaderboardRef = ref(db, 'leaderboard');
            const newEntryRef = push(leaderboardRef); // Generates session_XYZ

            await set(newEntryRef, {
                playerId,
                playerName,
                score: finalScore,
                dateString,
                timestamp: now.getTime()
            });

            // Update the player's lifetime stats as well
            await this.updatePlayerStats(playerId, finalScore);

            // Reset game state
            await this.setGameState("idle", "Step right up and test your aim!");

        } catch (error) {
            console.error("Error submitting to leaderboard:", error);
        }
    }
};