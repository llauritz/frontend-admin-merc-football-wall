import { Card } from "@/components/ui/card";

// ==========================================
// TIMER DISPLAY
// Shows countdown seconds remaining
// ==========================================

interface TimerDisplayProps {
  seconds: number;
}

/**
 * Displays remaining time in seconds
 * Shows in red when 10 or fewer seconds remain
 */
export function TimerDisplay({ seconds }: TimerDisplayProps) {
  const isUrgent = seconds <= 10;

  return (
    <Card className="flex flex-col items-center justify-center p-4">
      <span className="text-sm text-muted-foreground">Seconds Left</span>
      <span
        className={`text-4xl font-bold ${isUrgent ? "text-destructive" : ""}`}
      >
        {seconds}
      </span>
    </Card>
  );
}
