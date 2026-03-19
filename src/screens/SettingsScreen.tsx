import { useState } from "react";
import { useGameContext } from "@/context";
import { DatabaseService } from "@/services";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";

// ==========================================
// SETTINGS SCREEN
// Configure game parameters
// ==========================================

/**
 * Settings screen for configuring game parameters
 * Changes are saved to Firebase
 */
export function SettingsScreen() {
  const { settings } = useGameContext();

  const [secondsPerGame, setSecondsPerGame] = useState(
    settings.secondsPerGame.toString()
  );
  const [prizeThreshold, setPrizeThreshold] = useState(
    settings.prizeThreshold.toString()
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await DatabaseService.updateSettings({
        secondsPerGame: parseInt(secondsPerGame, 10) || 30,
        prizeThreshold: parseInt(prizeThreshold, 10) || 500,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Game Settings</h1>
        <p className="text-muted-foreground">
          Configure game parameters
        </p>
      </div>

      <Card className="flex flex-col gap-6 p-6">
        {/* Seconds Per Game */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="secondsPerGame">Seconds Per Game</Label>
          <Input
            id="secondsPerGame"
            type="number"
            min="10"
            max="300"
            value={secondsPerGame}
            onChange={(e) => setSecondsPerGame(e.target.value)}
            placeholder="30"
          />
          <p className="text-sm text-muted-foreground">
            How long each game lasts (10-300 seconds)
          </p>
        </div>

        {/* Prize Threshold */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="prizeThreshold">Prize Threshold</Label>
          <Input
            id="prizeThreshold"
            type="number"
            min="0"
            value={prizeThreshold}
            onChange={(e) => setPrizeThreshold(e.target.value)}
            placeholder="500"
          />
          <p className="text-sm text-muted-foreground">
            Minimum score to win a prize
          </p>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="gap-2 self-start"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : saveSuccess ? "Saved!" : "Save Settings"}
        </Button>
      </Card>

      {/* Current Values */}
      <Card className="p-6">
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">
          Current Database Values
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Seconds Per Game</p>
            <p className="font-mono text-lg">{settings.secondsPerGame}s</p>
          </div>
          <div>
            <p className="text-muted-foreground">Prize Threshold</p>
            <p className="font-mono text-lg">{settings.prizeThreshold} pts</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
