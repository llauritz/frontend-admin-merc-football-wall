import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Trophy, Undo2, StopCircle, Play, SkipForward, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useGameState, useIdleMessages, useQueue, useSettings, useTimeRemaining } from "@/hooks/useFirebase";
import { DatabaseService } from "@/services/database.service";
import { TARGET_CONFIGS } from "@/constants";
import type { GameState, TargetConfig, QueueEntry } from "@/types";

const GAME_STATES: GameState[] = ["idle", "preparing", "game", "finished"];
const TAB_LABELS: Record<string, string> = {
  idle: "idle",
  preparing: "prepare",
  game: "game",
  finished: "finished",
};

export function AdminPage() {
  const gameState = useGameState();
  const queue = useQueue();
  const settings = useSettings();
  const idleMessages = useIdleMessages();

  const nextPlayer = queue[0] || null;

  useEffect(() => {
    DatabaseService.ensureIdleMessagesPool().catch((error) => {
      console.error("Failed to initialize idle message pool:", error);
    });
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* State Indicator Tabs */}
      <Tabs value={gameState.status === "countdown" ? "preparing" : gameState.status} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {GAME_STATES.map((state) => (
            <TabsTrigger
              key={state}
              value={state}
              disabled
              className="capitalize data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {TAB_LABELS[state]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Conditional State Rendering */}
      {gameState.status === "idle" && (
        <IdleState
          nextPlayer={nextPlayer}
          queue={queue.slice(1)}
          ledMessage={gameState.activeLedMessage}
          idleMessages={idleMessages}
        />
      )}
      {gameState.status === "preparing" && (
        <PreparingState playerName={gameState.currentPlayer?.name || ""} />
      )}
      {gameState.status === "countdown" && (
        <CountdownState playerName={gameState.currentPlayer?.name || ""} />
      )}
      {gameState.status === "game" && (
        <GameStateView
          playerName={gameState.currentPlayer?.name || ""}
          score={gameState.currentScore}
          startedAt={gameState.startedAt}
          timeLimit={settings.timeLimit}
        />
      )}
      {gameState.status === "finished" && (
        <FinishedState
          playerName={gameState.currentPlayer?.name || ""}
          score={gameState.currentScore}
          instantWinThreshold={settings.instantWinThreshold}
        />
      )}
    </div>
  );
}

// ==========================================
// IDLE STATE
// ==========================================

function IdleState({
  nextPlayer,
  queue,
  ledMessage,
  idleMessages,
}: {
  nextPlayer: QueueEntry | null;
  queue: QueueEntry[];
  ledMessage: string;
  idleMessages: string[];
}) {
  const [newMessage, setNewMessage] = useState("");

  const handlePrepareGame = async () => {
    if (!nextPlayer) return;
    await DatabaseService.prepareGame(
      { id: nextPlayer.id, name: nextPlayer.name },
      nextPlayer.id
    );
  };

  const handleLedMessage = async (message: string) => {
    await DatabaseService.setActiveLedMessage(message);
  };

  const handleAddMessage = async () => {
    const trimmedMessage = newMessage.trim();
    if (!trimmedMessage) return;

    await DatabaseService.addIdleMessage(trimmedMessage);
    setNewMessage("");
  };

  const handleDeleteMessage = async (message: string) => {
    await DatabaseService.removeIdleMessage(message);
  };

  const handleAddMessageKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      await handleAddMessage();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-normal text-muted-foreground">
            Next Player
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-2xl font-bold">
            {nextPlayer ? nextPlayer.name : "No players in queue"}
          </p>
          <Button onClick={handlePrepareGame} disabled={!nextPlayer} size="lg">
            Prepare game
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-normal text-muted-foreground">
            LED Content Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p className="mb-2 text-sm">
            Current: <span className="font-semibold">{ledMessage}</span>
          </p>
          <div className="mb-3 flex gap-2">
            <Input
              value={newMessage}
              onChange={(event) => setNewMessage(event.target.value)}
              onKeyDown={handleAddMessageKeyDown}
              placeholder="Type a new idle message"
              className="flex-1"
            />
            <Button onClick={handleAddMessage} size="sm" disabled={!newMessage.trim()}>
              <Plus className="mr-1 size-4" />
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {idleMessages.map((message) => (
              <div key={message} className="flex items-center gap-1">
                <Button
                  variant={ledMessage === message ? "default" : "secondary"}
                  size="sm"
                  onClick={() => handleLedMessage(message)}
                >
                  {message}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDeleteMessage(message)}
                  aria-label={`Delete message ${message}`}
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {queue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Upcoming Players ({queue.length} waiting)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {queue.map((entry, index) => (
                <div key={entry.id} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{index + 2}.</span>
                  <span className="font-medium">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ==========================================
// PREPARING STATE
// ==========================================

function PreparingState({ playerName }: { playerName: string }) {
  const handleStartGame = async () => {
    await DatabaseService.startCountdown();
  };

  const handleBack = async () => {
    await DatabaseService.returnToIdle();
  };

  const handleSkip = async () => {
    await DatabaseService.skipPlayer();
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 py-16">
      <div className="text-center">
        <p className="text-lg text-muted-foreground">Player</p>
        <p className="text-4xl font-bold">{playerName}</p>
      </div>

      <p className="text-3xl font-semibold">Get ready!</p>

      <div className="flex flex-col gap-4">
        <Button onClick={handleStartGame} size="lg" className="min-w-48">
          <Play className="mr-2 size-5" />
          Start game
        </Button>
        <div className="flex gap-2">
          <Button onClick={handleBack} variant="ghost">
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Button>
          <Button onClick={handleSkip} variant="outline">
            <SkipForward className="mr-2 size-4" />
            Skip
          </Button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// COUNTDOWN STATE
// ==========================================

function CountdownState({ playerName }: { playerName: string }) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count > 0) {
      const timer = setTimeout(() => setCount(count - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Start the game when countdown reaches 0
      DatabaseService.startGame();
    }
  }, [count]);

  const handleCancel = async () => {
    await DatabaseService.returnToIdle();
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 py-16">
      <p className="text-2xl font-medium">{playerName}</p>

      <p className="text-[12rem] font-bold leading-none">{count > 0 ? count : "GO!"}</p>

      <Button onClick={handleCancel} variant="outline">
        Cancel
      </Button>
    </div>
  );
}

// ==========================================
// GAME STATE
// ==========================================

function GameStateView({
  playerName,
  score,
  startedAt,
  timeLimit,
}: {
  playerName: string;
  score: number;
  startedAt: number | null;
  timeLimit: number;
}) {
  const timeRemaining = useTimeRemaining(startedAt, timeLimit);
  const hasFinishedRef = useRef(false);

  // End game when time runs out (backup to server function)
  useEffect(() => {
    if (timeRemaining <= 0 && !hasFinishedRef.current) {
      hasFinishedRef.current = true;
      DatabaseService.finishGame();
    }
  }, [timeRemaining]);

  const handleScore = async (target: TargetConfig) => {
    await DatabaseService.recordGameHit(target.points, target.id);
  };

  const handleUndo = async () => {
    await DatabaseService.undoLastHit();
  };

  const handleStop = async () => {
    await DatabaseService.finishGame();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* HUD */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-sm text-muted-foreground">Player</p>
          <p className="text-xl font-bold">{playerName}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Time</p>
          <p className="text-4xl font-bold tabular-nums">{timeRemaining}s</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Score</p>
          <p className="text-4xl font-bold tabular-nums">{score}</p>
        </div>
      </div>

      <Separator />

      {/* Score Input Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Left Column */}
        <div className="flex flex-col gap-3">
          {TARGET_CONFIGS.filter((t) => t.id.startsWith("left")).map((target) => (
            <ScoreButton key={target.id} target={target} onScore={handleScore} />
          ))}
        </div>

        {/* Center Column */}
        <div className="flex items-center justify-center">
          <ScoreButton
            target={TARGET_CONFIGS.find((t) => t.id === "center_100")!}
            onScore={handleScore}
            large
          />
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-3">
          {TARGET_CONFIGS.filter((t) => t.id.startsWith("right")).map((target) => (
            <ScoreButton key={target.id} target={target} onScore={handleScore} />
          ))}
        </div>
      </div>

      <Separator />

      {/* Controls */}
      <div className="flex gap-4">
        <Button onClick={handleUndo} variant="outline" className="flex-1">
          <Undo2 className="mr-2 size-4" />
          Undo
        </Button>
        <Button onClick={handleStop} variant="destructive" className="flex-1">
          <StopCircle className="mr-2 size-4" />
          Stop game
        </Button>
      </div>
    </div>
  );
}

function ScoreButton({
  target,
  onScore,
  large = false,
}: {
  target: TargetConfig;
  onScore: (target: TargetConfig) => void;
  large?: boolean;
}) {
  return (
    <Button
      onClick={() => onScore(target)}
      variant="outline"
      className={`rounded-full font-bold ${large ? "size-32 text-3xl" : "size-20 text-xl"
        }`}
    >
      {target.label}
    </Button>
  );
}

// ==========================================
// FINISHED STATE
// ==========================================

function FinishedState({
  playerName,
  score,
  instantWinThreshold,
}: {
  playerName: string;
  score: number;
  instantWinThreshold: number;
}) {
  const isWinner = score >= instantWinThreshold;

  const handleReturn = async () => {
    await DatabaseService.returnToIdle();
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 py-16">
      <div className="text-center">
        <p className="text-lg text-muted-foreground">Player</p>
        <p className="text-3xl font-bold">{playerName}</p>
      </div>

      <div className="text-center">
        <p className="text-lg text-muted-foreground">Final Score</p>
        <p className="text-6xl font-bold">{score}</p>
      </div>

      {isWinner && (
        <div className="flex flex-col items-center gap-2 text-center">
          <Trophy className="size-16 text-yellow-500" />
          <p className="text-6xl font-bold text-yellow-500">Prize winner!</p>
        </div>
      )}

      <Button onClick={handleReturn} variant="outline" size="lg">
        Return to idle
      </Button>
    </div>
  );
}
