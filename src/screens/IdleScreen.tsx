import { useGameContext } from "@/context";
import { DatabaseService } from "@/services";
import { SloganSelector } from "@/components/game";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

// ==========================================
// IDLE SCREEN
// Displays current slogan and allows selection
// ==========================================

/**
 * Screen shown when game is in idle state
 * Operator can select a slogan and start a new game
 */
export function IdleScreen() {
  const { control, settings, currentGame } = useGameContext();

  const handleSelectSlogan = async (slogan: string) => {
    await DatabaseService.setIdleMessage(slogan);
  };

  const handleStartGame = async () => {
    // Transition to countdown, then game will start
    await DatabaseService.setGameState("countdown");
  };

  const playerName = currentGame?.playerName ?? "No player assigned";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {/* Current Display Message */}
      <Card className="p-6">
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">
          Current Display Message
        </h2>
        <p className="text-2xl font-semibold">
          {control?.idleMessage ?? "No message set"}
        </p>
      </Card>

      {/* Player Ready */}
      <Card className="flex items-center justify-between p-6">
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">
            Next Player
          </h2>
          <p className="text-lg font-semibold">{playerName}</p>
        </div>
        <Button
          size="lg"
          onClick={handleStartGame}
          disabled={!currentGame?.playerName}
          className="gap-2"
        >
          <Play className="h-5 w-5" />
          Start Game
        </Button>
      </Card>

      {/* Slogan Selector */}
      <SloganSelector
        slogans={settings.slogans}
        currentSlogan={control?.idleMessage ?? ""}
        onSelect={handleSelectSlogan}
      />
    </div>
  );
}
