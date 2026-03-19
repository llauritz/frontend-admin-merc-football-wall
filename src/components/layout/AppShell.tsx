import type { ReactNode } from "react";
import { StatusBar } from "./StatusBar";
import { Navigation, type Screen } from "./Navigation";

// ==========================================
// APP SHELL
// Main layout wrapper with status bar and navigation
// ==========================================

interface AppShellProps {
  children: ReactNode;
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

/**
 * Main layout component that wraps all screens
 * Provides consistent header with status bar and navigation
 */
export function AppShell({ children, currentScreen, onNavigate }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Connection status indicator */}
      <StatusBar />

      {/* Tab navigation */}
      <Navigation currentScreen={currentScreen} onNavigate={onNavigate} />

      {/* Main content area */}
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  );
}
