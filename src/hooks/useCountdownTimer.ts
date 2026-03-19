import { useState, useEffect, useCallback } from "react";

// ==========================================
// COUNTDOWN TIMER HOOK
// Manages game countdown timer logic
// ==========================================

interface UseCountdownTimerProps {
  /** Total seconds for the game */
  totalSeconds: number;
  /** Unix timestamp when game started */
  startedAt: number | null;
  /** Whether the timer should be running */
  isActive: boolean;
  /** Callback when timer reaches zero */
  onTimeUp?: () => void;
}

interface UseCountdownTimerResult {
  /** Seconds remaining */
  secondsLeft: number;
  /** Whether time has run out */
  isTimeUp: boolean;
}

/**
 * Calculates remaining time based on start timestamp and total duration
 * Calls onTimeUp callback when timer reaches zero
 */
export function useCountdownTimer({
  totalSeconds,
  startedAt,
  isActive,
  onTimeUp,
}: UseCountdownTimerProps): UseCountdownTimerResult {
  const calculateSecondsLeft = useCallback(() => {
    if (!startedAt || !isActive) {
      return totalSeconds;
    }
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    return Math.max(0, totalSeconds - elapsed);
  }, [totalSeconds, startedAt, isActive]);

  const [secondsLeft, setSecondsLeft] = useState(calculateSecondsLeft);
  const [isTimeUp, setIsTimeUp] = useState(false);

  useEffect(() => {
    if (!isActive || !startedAt) {
      setSecondsLeft(totalSeconds);
      setIsTimeUp(false);
      return;
    }

    // Update immediately
    setSecondsLeft(calculateSecondsLeft());

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateSecondsLeft();
      setSecondsLeft(remaining);

      if (remaining <= 0 && !isTimeUp) {
        setIsTimeUp(true);
        onTimeUp?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [totalSeconds, startedAt, isActive, calculateSecondsLeft, onTimeUp, isTimeUp]);

  return { secondsLeft, isTimeUp };
}
