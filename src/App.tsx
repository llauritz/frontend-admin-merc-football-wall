import { useState, useEffect } from "react";
import { useGameContext } from "@/context";
import { AppShell, type Screen } from "@/components/layout";
import {
  IdleScreen,
  CountdownScreen,
  GameRunningScreen,
  ResultsScreen,
  SettingsScreen,
  DebugScreen,
} from "@/screens";

// ==========================================
// APP
// Main application with screen routing
// ==========================================

/**
 * Main app component that handles screen navigation
 * Auto-switches based on game state from Firebase
 */
export function App() {
  const { control, controlLoading } = useGameContext();
  const [currentScreen, setCurrentScreen] = useState<Screen>("idle");

  // Auto-switch screens based on game state
  useEffect(() => {
    if (!control) return;

    switch (control.gameState) {
      case "idle":
        setCurrentScreen("idle");
        break;
      case "countdown":
        setCurrentScreen("game");
        break;
      case "active":
        setCurrentScreen("game");
        break;
      case "finished":
        setCurrentScreen("results");
        break;
    }
  }, [control?.gameState]);

  // Show loading state
  if (controlLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Render the appropriate screen based on navigation and game state
  const renderScreen = () => {
    // For game tab, show the appropriate game-related screen
    if (currentScreen === "game") {
      switch (control?.gameState) {
        case "countdown":
          return <CountdownScreen />;
        case "active":
          return <GameRunningScreen />;
        default:
          return <IdleScreen />;
      }
    }

    // Show results if finished or navigated to results
    if (currentScreen === "results") {
      return <ResultsScreen />;
    }

    // Other screens based on navigation
    switch (currentScreen) {
      case "idle":
        return <IdleScreen />;
      case "debug":
        return <DebugScreen />;
      case "settings":
        return <SettingsScreen />;
      default:
        return <IdleScreen />;
    }
  };

  return (
    <AppShell currentScreen={currentScreen} onNavigate={setCurrentScreen}>
      {renderScreen()}
    </AppShell>
  );
}

export default App;
