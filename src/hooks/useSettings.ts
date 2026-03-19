import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/firebase";
import type { GameSettings } from "@/types";
import { DEFAULT_SETTINGS } from "@/constants";

// ==========================================
// SETTINGS HOOK
// Subscribes to the settings node in Firebase
// ==========================================

interface UseSettingsResult {
  settings: GameSettings;
  loading: boolean;
  error: Error | null;
}

/**
 * Subscribes to game settings from Firebase
 * Returns default settings if none exist in database
 */
export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const settingsRef = ref(db, "settings");

    try {
      const unsubscribe = onValue(
        settingsRef,
        (snapshot) => {
          if (snapshot.exists()) {
            setSettings(snapshot.val() as GameSettings);
          } else {
            // Use defaults if no settings exist yet
            setSettings(DEFAULT_SETTINGS);
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

  return { settings, loading, error };
}
