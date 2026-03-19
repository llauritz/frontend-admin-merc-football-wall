import { Button } from "@/components/ui/button";
import {
  Home,
  Play,
  Trophy,
  Bug,
  Settings,
} from "lucide-react";

// ==========================================
// NAVIGATION
// Tab bar for switching between screens
// ==========================================

export type Screen = "idle" | "game" | "results" | "debug" | "settings";

interface NavigationProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

interface NavItem {
  id: Screen;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: "idle", label: "Idle", icon: <Home className="h-4 w-4" /> },
  { id: "game", label: "Game", icon: <Play className="h-4 w-4" /> },
  { id: "results", label: "Results", icon: <Trophy className="h-4 w-4" /> },
  { id: "debug", label: "Debug", icon: <Bug className="h-4 w-4" /> },
  { id: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
];

/**
 * Tab navigation bar for switching between app screens
 */
export function Navigation({ currentScreen, onNavigate }: NavigationProps) {
  return (
    <nav className="flex gap-1 border-b bg-background px-2 py-2">
      {NAV_ITEMS.map((item) => (
        <Button
          key={item.id}
          variant={currentScreen === item.id ? "default" : "ghost"}
          size="sm"
          onClick={() => onNavigate(item.id)}
          className="flex items-center gap-2"
        >
          {item.icon}
          {item.label}
        </Button>
      ))}
    </nav>
  );
}
