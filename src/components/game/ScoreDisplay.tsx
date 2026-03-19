import { Card } from "@/components/ui/card";

// ==========================================
// SCORE DISPLAY
// Shows current or final score
// ==========================================

interface ScoreDisplayProps {
  score: number;
  label?: string;
}

/**
 * Displays a score value with an optional label
 */
export function ScoreDisplay({ score, label = "Current Score" }: ScoreDisplayProps) {
  return (
    <Card className="flex flex-col items-center justify-center p-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-4xl font-bold">{score}</span>
    </Card>
  );
}
