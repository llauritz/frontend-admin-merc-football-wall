import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";

// ==========================================
// SLOGAN SELECTOR
// Grid of preset slogan options
// ==========================================

interface SloganSelectorProps {
  slogans: string[];
  currentSlogan: string;
  onSelect: (slogan: string) => void;
}

/**
 * Displays a grid of slogan options
 * Highlights the currently selected slogan
 */
export function SloganSelector({
  slogans,
  currentSlogan,
  onSelect,
}: SloganSelectorProps) {
  return (
    <Card className="p-4">
      <h3 className="mb-4 text-sm font-medium text-muted-foreground">
        Select Display Message
      </h3>
      <div className="grid gap-2">
        {slogans.map((slogan) => {
          const isSelected = slogan === currentSlogan;
          return (
            <Button
              key={slogan}
              variant={isSelected ? "default" : "outline"}
              className="h-auto justify-start whitespace-normal py-3 text-left"
              onClick={() => onSelect(slogan)}
            >
              {isSelected && <Check className="mr-2 h-4 w-4 flex-shrink-0" />}
              <span className={isSelected ? "" : "ml-6"}>{slogan}</span>
            </Button>
          );
        })}
      </div>
    </Card>
  );
}
