import { Card } from "@/components/ui/card";
import { User } from "lucide-react";

// ==========================================
// PLAYER INFO
// Shows current player name
// ==========================================

interface PlayerInfoProps {
  playerName: string;
}

/**
 * Displays the current player's name
 */
export function PlayerInfo({ playerName }: PlayerInfoProps) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <User className="h-6 w-6 text-muted-foreground" />
      <div>
        <span className="text-sm text-muted-foreground">Player</span>
        <p className="text-lg font-semibold">{playerName}</p>
      </div>
    </Card>
  );
}
