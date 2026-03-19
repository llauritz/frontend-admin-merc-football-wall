import { useGameContext } from "@/context";
import { DatabaseService } from "@/services";
import { ScoreDisplay, PlayerInfo } from "@/components/game";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw, Trophy } from "lucide-react";

// ==========================================
// RESULTS SCREEN
// Shows game results after finishing
// ==========================================

/**
 * Displays the final score and player info
 * Allows operator to return to idle state
 */
export function ResultsScreen() {
  const { currentGame, settings } = useGameContext();

  const handleBackToIdle = async () => {
    await DatabaseService.setGameState("idle", "Step right up and test your aim!");
  };

  const playerName = currentGame?.playerName ?? "Unknown";
  const score = currentGame?.totalScore ?? 0;
  const isPrizeWinner = score >= settings.prizeThreshold;

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">GAME OVER</h1>
        <p className="mt-2 text-muted-foreground">Final Results</p>
      </div>

      {/* Player Info */}
      <PlayerInfo playerName={playerName} />

      {/* Final Score */}
      <ScoreDisplay score={score} label="Final Score" />

      {/* Prize Status */}
      {isPrizeWinner && (
        <Card className="flex items-center gap-3 bg-primary/10 p-6 text-primary">
          <Trophy className="h-8 w-8" />
          <div>
            <p className="font-bold">PRIZE WINNER!</p>
            <p className="text-sm">
              Score of {score} exceeds threshold of {settings.prizeThreshold}
            </p>
          </div>
        </Card>
      )}

      {/* Actions */}
      <Button size="lg" onClick={handleBackToIdle} className="gap-2">
        <RotateCcw className="h-5 w-5" />
        Back to Idle
      </Button>
    </div>
  );
}
