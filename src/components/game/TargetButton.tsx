import { Button } from "@/components/ui/button";
import type { TargetId } from "@/types";
import { TARGETS } from "@/constants";

// ==========================================
// TARGET BUTTON
// Clickable button to record a hit on a target
// ==========================================

interface TargetButtonProps {
  targetId: TargetId;
  onHit: (targetId: TargetId, points: number) => void;
  disabled?: boolean;
}

/**
 * Button representing a scoring target zone
 * Displays label and point value, triggers onHit when clicked
 */
export function TargetButton({ targetId, onHit, disabled }: TargetButtonProps) {
  const target = TARGETS[targetId];

  return (
    <Button
      variant="outline"
      size="lg"
      disabled={disabled}
      onClick={() => onHit(targetId, target.points)}
      className="flex h-20 w-32 flex-col items-center justify-center gap-1"
    >
      <span className="text-xs text-muted-foreground">{target.label}</span>
      <span className="text-2xl font-bold">{target.points}pts</span>
    </Button>
  );
}
