import { useEffect, useState } from "react";
import { DatabaseService } from "@/services";

// ==========================================
// COUNTDOWN SCREEN
// 3-2-1 countdown before game starts
// ==========================================

/**
 * Shows a countdown before the game begins
 * Automatically transitions to active game state
 */
export function CountdownScreen() {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count > 0) {
      const timer = setTimeout(() => {
        setCount(count - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Start the game
      DatabaseService.setGameState("active");
    }
  }, [count]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <p className="mb-4 text-xl text-muted-foreground">Game Starting In</p>
      <div className="text-9xl font-bold">{count > 0 ? count : "GO!"}</div>
    </div>
  );
}
