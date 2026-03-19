import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/firebase";

// ==========================================
// CONNECTION STATUS HOOK
// Monitors Firebase realtime connection state
// ==========================================

/**
 * Tracks whether the app is connected to Firebase
 * Uses Firebase's special ".info/connected" path
 */
export function useConnectionStatus() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const connectedRef = ref(db, ".info/connected");

    const unsubscribe = onValue(connectedRef, (snapshot) => {
      setIsConnected(snapshot.val() === true);
    });

    return () => unsubscribe();
  }, []);

  return isConnected;
}
