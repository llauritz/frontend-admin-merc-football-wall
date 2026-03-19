import { createContext, useContext, type ReactNode } from "react";
import {
  useConnectionStatus,
  useGameControl,
  useCurrentGame,
  useSettings,
} from "@/hooks";
import type { GameControl, CurrentGame, GameSettings } from "@/types";

// ==========================================
// GAME CONTEXT
// Combines all Firebase subscriptions into one provider
// ==========================================

interface GameContextValue {
  // Connection status
  isConnected: boolean;

  // Game control state
  control: GameControl | null;
  controlLoading: boolean;

  // Current game data
  currentGame: CurrentGame | null;
  gameLoading: boolean;

  // Settings
  settings: GameSettings;
  settingsLoading: boolean;
}

const GameContext = createContext<GameContextValue | null>(null);

interface GameProviderProps {
  children: ReactNode;
}

/**
 * Provider component that wraps the app and provides
 * all Firebase data subscriptions to child components
 */
export function GameProvider({ children }: GameProviderProps) {
  const isConnected = useConnectionStatus();
  const { control, loading: controlLoading } = useGameControl();
  const { currentGame, loading: gameLoading } = useCurrentGame();
  const { settings, loading: settingsLoading } = useSettings();

  const value: GameContextValue = {
    isConnected,
    control,
    controlLoading,
    currentGame,
    gameLoading,
    settings,
    settingsLoading,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

/**
 * Hook to access game context data
 * Must be used within a GameProvider
 */
export function useGameContext(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGameContext must be used within a GameProvider");
  }
  return context;
}
