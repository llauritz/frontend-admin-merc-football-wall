import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/firebase";
import type { GameControl } from "@/types";

// ==========================================
// GAME CONTROL HOOK
// Subscribes to the control node in Firebase
// ==========================================

interface UseGameControlResult {
  control: GameControl | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Subscribes to game control state changes from Firebase
 * Returns the current game state, loading status, and any errors
 */
export function useGameControl(): UseGameControlResult {
  const [control, setControl] = useState<GameControl | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controlRef = ref(db, "control");

    try {
      const unsubscribe = onValue(
        controlRef,
        (snapshot) => {
          if (snapshot.exists()) {
            setControl(snapshot.val() as GameControl);
          } else {
            setControl(null);
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

  return { control, loading, error };
}
