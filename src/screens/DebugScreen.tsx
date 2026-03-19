import { useGameContext } from "@/context";
import { DatabaseService } from "@/services";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";

// ==========================================
// DEBUG SCREEN
// Testing and diagnostic tools
// ==========================================

/**
 * Debug screen showing raw database state
 * Provides test controls for development
 */
export function DebugScreen() {
  const { isConnected, control, currentGame, settings } = useGameContext();

  const handleSetIdle = () => DatabaseService.setGameState("idle");
  const handleSetCountdown = () => DatabaseService.setGameState("countdown");
  const handleSetActive = () => DatabaseService.setGameState("active");
  const handleSetFinished = () => DatabaseService.setGameState("finished");

  const handleCreateTestGame = async () => {
    await DatabaseService.startNewGame("test_player_001", "Test Player");
    await DatabaseService.setGameState("idle");
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Debug Tools</h1>
        <p className="text-muted-foreground">
          Testing and diagnostic controls
        </p>
      </div>

      {/* Connection Status */}
      <Card className="p-6">
        <h2 className="mb-4 text-sm font-medium">Connection Status</h2>
        <Badge variant={isConnected ? "default" : "destructive"}>
          {isConnected ? "Connected" : "Disconnected"}
        </Badge>
      </Card>

      {/* State Controls */}
      <Card className="p-6">
        <h2 className="mb-4 text-sm font-medium">Game State Controls</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleSetIdle}>
            Set Idle
          </Button>
          <Button variant="outline" size="sm" onClick={handleSetCountdown}>
            Set Countdown
          </Button>
          <Button variant="outline" size="sm" onClick={handleSetActive}>
            Set Active
          </Button>
          <Button variant="outline" size="sm" onClick={handleSetFinished}>
            Set Finished
          </Button>
        </div>
      </Card>

      {/* Test Data */}
      <Card className="p-6">
        <h2 className="mb-4 text-sm font-medium">Test Data</h2>
        <Button variant="outline" size="sm" onClick={handleCreateTestGame} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Create Test Game
        </Button>
      </Card>

      {/* Raw Data Display */}
      <Card className="p-6">
        <h2 className="mb-4 text-sm font-medium">Raw Database State</h2>
        <div className="grid gap-4">
          <div>
            <h3 className="text-xs font-medium text-muted-foreground">control</h3>
            <pre className="mt-1 overflow-auto rounded bg-muted p-2 text-xs">
              {JSON.stringify(control, null, 2)}
            </pre>
          </div>
          <div>
            <h3 className="text-xs font-medium text-muted-foreground">currentGame</h3>
            <pre className="mt-1 overflow-auto rounded bg-muted p-2 text-xs">
              {JSON.stringify(currentGame, null, 2)}
            </pre>
          </div>
          <div>
            <h3 className="text-xs font-medium text-muted-foreground">settings</h3>
            <pre className="mt-1 overflow-auto rounded bg-muted p-2 text-xs">
              {JSON.stringify(settings, null, 2)}
            </pre>
          </div>
        </div>
      </Card>
    </div>
  );
}
