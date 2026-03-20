// functions/src/index.ts
import { onValueWritten } from "firebase-functions/v2/database";
import { onTaskDispatched } from "firebase-functions/v2/tasks";
import { getFunctions } from "firebase-admin/functions";
import * as admin from "firebase-admin";

admin.initializeApp();

// 1. Trigger when the game starts
export const onGameStart = onValueWritten("/control/gameState", async (event) => {
    const beforeState = event.data.before.val();
    const afterState = event.data.after.val();

    // IMPROVEMENT: Ensure it actually CHANGED to "playing" to avoid infinite loops or redundant runs
    if (beforeState === "playing" || afterState !== "playing") return;

    // IMPROVEMENT: Fetch data in parallel to speed up the function
    const [settingsSnap, gameSnap] = await Promise.all([
        admin.database().ref("/settings/gameDuration").get(),
        admin.database().ref("/currentGame/startedAt").get()
    ]);

    const durationMs = (settingsSnap.val() || 30) * 1000;
    const startedAt = gameSnap.val();

    if (!startedAt) return;

    const remainingMs = (startedAt + durationMs) - Date.now();
    if (remainingMs <= 0) return; // Edge case: Time already passed

    // THE BEST WAY: Enqueue a task for the future
    const queue = getFunctions().taskQueue("endGameTask");

    await queue.enqueue(
        { triggerTime: Date.now() }, // Payload you want to send to the task
        { scheduleDelaySeconds: remainingMs / 1000 } // When it should run
    );

    console.log(`Scheduled game to end in ${remainingMs / 1000} seconds.`);
});


// 2. The Task Queue Function that runs when the time is up
export const endGameTask = onTaskDispatched(
    {
        retryConfig: { maxAttempts: 3 },
    },
    async (request) => {
        // Check if still playing (game could have been manually ended)
        const currentState = await admin.database().ref("/control/gameState").get();

        if (currentState.val() === "playing") {
            await admin.database().ref("/control/gameState").set("finished");
            console.log("Game successfully finished by Cloud Task.");
        }
    }
);