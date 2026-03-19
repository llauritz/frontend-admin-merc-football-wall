import { useGameContext } from "@/context";
import { useCountdownTimer } from "@/hooks";
import { DatabaseService } from "@/services";
import {
  TargetButton,
  ScoreDisplay,
  TimerDisplay,
  PlayerInfo,
} from "@/components/game";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { TargetId } from "@/types";
import { Square } from "lucide-react";

// ==========================================
// GAME RUNNING SCREEN
// Active game with timer, scoring, and controls
// ==========================================

/**
 * Main game screen where operator records hits
 * Shows timer, score, and target buttons
 */
export function GameRunningScreen() {
  const { currentGame, settings } = useGameContext();

  const { secondsLeft, isTimeUp } = useCountdownTimer({
    totalSeconds: settings.secondsPerGame,
    startedAt: currentGame?.startedAt ?? null,
    isActive: true,
    onTimeUp: () => {
      DatabaseService.finishGame();
    },
  });

  const handleHit = async (targetId: TargetId, points: number) => {
    await DatabaseService.recordHit(targetId, points);
  };

  const handleFinishGame = async () => {
    await DatabaseService.finishGame();
  };

  const playerName = currentGame?.playerName ?? "Unknown";
  const score = currentGame?.totalScore ?? 0;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary">GAME RUNNING</h1>
      </div>

      {/* Player Info */}
      <PlayerInfo playerName={playerName} />

      {/* Timer and Score Row */}
      <div className="grid grid-cols-2 gap-4">
        <TimerDisplay seconds={secondsLeft} />
        <ScoreDisplay score={score} />
      </div>

      {/* Target Buttons Grid */}
      <Card className="p-6">
        <h3 className="mb-4 text-center text-sm font-medium text-muted-foreground">
          Record Hits
        </h3>
        <div className="flex flex-col items-center gap-4">
          {/* Top Row */}
          <div className="flex justify-center gap-8">
            <TargetButton
              targetId="top_left"
              onHit={handleHit}
              disabled={isTimeUp}
            />
            <TargetButton
              targetId="top_right"
              onHit={handleHit}
              disabled={isTimeUp}
            />
          </div>

          {/* Center */}
          <TargetButton
            targetId="center"
            onHit={handleHit}
            disabled={isTimeUp}
          />

          {/* Bottom Row */}
          <div className="flex justify-center gap-8">
            <TargetButton
              targetId="bottom_left"
              onHit={handleHit}
              disabled={isTimeUp}
            />
            <TargetButton
              targetId="bottom_right"
              onHit={handleHit}
              disabled={isTimeUp}
            />
          </div>
        </div>
      </Card>

      {/* Finish Button */}
      <Button
        size="lg"
        variant="destructive"
        onClick={handleFinishGame}
        className="gap-2"
      >
        <Square className="h-5 w-5" />
        Finish Game
      </Button>
    </div>
  );
}
