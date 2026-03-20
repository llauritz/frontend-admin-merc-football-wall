// functions/src/index.ts
import { onValueWritten } from "firebase-functions/v2/database";
import { onTaskDispatched } from "firebase-functions/v2/tasks";
import { getFunctions } from "firebase-admin/functions";
import * as admin from "firebase-admin";

admin.initializeApp();

// 1. Trigger when the game status changes to "game"
export const onGameStart = onValueWritten("/gameState/status", async (event) => {
    const beforeState = event.data.before.val();
    const afterState = event.data.after.val();

    // Only trigger when status changes TO "game" (not from "game")
    if (beforeState === "game" || afterState !== "game") return;

    // Fetch settings and startedAt in parallel
    const [settingsSnap, gameSnap] = await Promise.all([
        admin.database().ref("/settings/timeLimit").get(),
        admin.database().ref("/gameState/startedAt").get()
    ]);

    const durationMs = (settingsSnap.val() || 30) * 1000;
    const startedAt = gameSnap.val();

    if (!startedAt) return;

    const remainingMs = (startedAt + durationMs) - Date.now();
    if (remainingMs <= 0) return; // Edge case: Time already passed

    // Enqueue a task to end the game when time is up
    const queue = getFunctions().taskQueue("endGameTask");

    await queue.enqueue(
        { startedAt, durationMs },
        { scheduleDelaySeconds: Math.max(1, remainingMs / 1000) }
    );

    console.log(`Scheduled game to end in ${remainingMs / 1000} seconds.`);
});


// 2. The Task Queue Function that runs when the time is up
export const endGameTask = onTaskDispatched(
    {
        retryConfig: { maxAttempts: 3 },
    },
    async (request) => {
        // Check if still in "game" status (game could have been manually ended)
        const currentState = await admin.database().ref("/gameState/status").get();

        if (currentState.val() === "game") {
            await admin.database().ref("/gameState/status").set("finished");
            console.log("Game successfully finished by Cloud Task.");
        }
    }
);