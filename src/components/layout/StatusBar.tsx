import { useGameContext } from "@/context";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff } from "lucide-react";

// ==========================================
// STATUS BAR
// Shows connection status at top of screen
// ==========================================

/**
 * Displays Firebase connection status indicator
 * Always visible at the top of the app
 */
export function StatusBar() {
  const { isConnected } = useGameContext();

  return (
    <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-2">
      <span className="text-sm font-medium text-muted-foreground">
        Football Wall Admin
      </span>
      <Badge
        variant={isConnected ? "default" : "destructive"}
        className="flex items-center gap-1.5"
      >
        {isConnected ? (
          <>
            <Wifi className="h-3 w-3" />
            Connected
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            Disconnected
          </>
        )}
      </Badge>
    </div>
  );
}
