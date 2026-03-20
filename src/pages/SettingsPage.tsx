import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, RotateCcw, Trash2, Users, Gamepad2, Sun, Moon, Monitor } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { LoadingScreen } from "@/components/loading-screen";
import { useSettings, useDatabaseSnapshot, useFirebasePathsReady } from "@/hooks/useFirebase";
import { DatabaseService } from "@/services/database.service";
import { useTheme } from "@/components/theme-provider";

export function SettingsPage() {
  const isDataReady = useFirebasePathsReady(["settings"]);
  const settings = useSettings();
  const dbSnapshot = useDatabaseSnapshot();
  const { theme, setTheme } = useTheme();

  const [timeLimit, setTimeLimit] = useState(settings.timeLimit.toString());
  const [winThreshold, setWinThreshold] = useState(settings.instantWinThreshold.toString());

  // Sync local state with Firebase settings
  useEffect(() => {
    setTimeLimit(settings.timeLimit.toString());
    setWinThreshold(settings.instantWinThreshold.toString());
  }, [settings]);

  if (!isDataReady) {
    return <LoadingScreen />;
  }

  const handleTimeLimitChange = (value: string) => {
    setTimeLimit(value);
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 0) {
      DatabaseService.updateSettings({ timeLimit: num });
    }
  };

  const handleWinThresholdChange = (value: string) => {
    setWinThreshold(value);
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 0) {
      DatabaseService.updateSettings({ instantWinThreshold: num });
    }
  };

  const handleForceReset = async () => {
    if (confirm("Are you sure you want to force reset the game state?")) {
      await DatabaseService.forceResetState();
    }
  };

  const handleClearQueue = async () => {
    if (confirm("Are you sure you want to clear the entire queue?")) {
      await DatabaseService.clearQueue();
    }
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-4">
      {/* Navigation Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/host">
          <Button size="lg" className="h-24 w-full flex-col gap-2 whitespace-normal text-base">
            <Users className="size-8" />
            Host Station
          </Button>
        </Link>
        <Link to="/admin">
          <Button size="lg" className="h-24 w-full flex-col gap-2 whitespace-normal text-base">
            <Gamepad2 className="size-8" />
            Scorekeeper Station
          </Button>
        </Link>
      </div>

      <Separator />

      <div className="grid gap-6 lg:grid-cols-2">
      {/* Game Configurations */}
      <Card>
        <CardHeader>
          <CardTitle>Game Configurations</CardTitle>
          <CardDescription>Adjust game settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Time Limit (seconds)</label>
            <Input
              type="number"
              value={timeLimit}
              onChange={(e) => handleTimeLimitChange(e.target.value)}
              min={1}
              max={300}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Instant Win Threshold (points)</label>
            <Input
              type="number"
              value={winThreshold}
              onChange={(e) => handleWinThresholdChange(e.target.value)}
              min={1}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <label className="text-sm font-medium">Theme</label>
            <div className="flex gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("light")}
                className="flex-1"
              >
                <Sun className="mr-2 size-4" />
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("dark")}
                className="flex-1"
              >
                <Moon className="mr-2 size-4" />
                Dark
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("system")}
                className="flex-1"
              >
                <Monitor className="mr-2 size-4" />
                System
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>These actions cannot be undone</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleForceReset}
            variant="destructive"
            className="w-full justify-start"
          >
            <RotateCcw className="mr-2 size-4" />
            Force Reset State
          </Button>

          <Button
            onClick={handleClearQueue}
            variant="destructive"
            className="w-full justify-start"
          >
            <Trash2 className="mr-2 size-4" />
            Clear Queue
          </Button>
        </CardContent>
      </Card>

      {/* Live Database Debugger */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Live Database Debugger</CardTitle>
          <CardDescription>
            Real-time view of the entire Firebase database (God View)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96 rounded-md border">
            <pre className="bg-slate-950 p-4 font-mono text-xs text-green-400">
              {dbSnapshot ? JSON.stringify(dbSnapshot, null, 2) : "Loading..."}
            </pre>
          </ScrollArea>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
