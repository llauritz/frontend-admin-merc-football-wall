import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/firebase";
import type { CurrentGame } from "@/types";

// ==========================================
// CURRENT GAME HOOK
// Subscribes to the currentGame node in Firebase
// ==========================================

interface UseCurrentGameResult {
  currentGame: CurrentGame | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Subscribes to the current game session from Firebase
 * Returns live score, player info, and hits data
 */
export function useCurrentGame(): UseCurrentGameResult {
  const [currentGame, setCurrentGame] = useState<CurrentGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const gameRef = ref(db, "currentGame");

    try {
      const unsubscribe = onValue(
        gameRef,
        (snapshot) => {
          if (snapshot.exists()) {
            setCurrentGame(snapshot.val() as CurrentGame);
          } else {
            setCurrentGame(null);
          }
          setLoading(false);
        },
        (err) => {
          setError(err);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
      setLoading(false);
    }
  }, []);

  return { currentGame, loading, error };
}
