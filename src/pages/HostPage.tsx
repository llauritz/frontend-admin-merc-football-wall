import { useState } from "react";
import { QrCode, UserPlus, Trash2, Pencil, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { LoadingScreen } from "@/components/loading-screen";
import { useQueue, useFirebasePathsReady } from "@/hooks/useFirebase";
import { DatabaseService } from "@/services/database.service";
import { GAME_RULES } from "@/constants";
import type { QueueEntry } from "@/types";

export function HostPage() {
  const isDataReady = useFirebasePathsReady(["queue"]);
  const [playerName, setPlayerName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const queue = useQueue();

  if (!isDataReady) {
    return <LoadingScreen />;
  }

  const nextPlayer = queue[0] || null;
  const remainingQueue = queue.slice(1);

  const handleSubmit = async () => {
    if (!playerName.trim()) return;

    setIsSubmitting(true);
    try {
      await DatabaseService.addToQueue(playerName.trim());
      setPlayerName("");
    } catch (error) {
      console.error("Failed to add player:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const handleDelete = async (queueKey: string) => {
    try {
      await DatabaseService.removeFromQueue(queueKey);
    } catch (error) {
      console.error("Failed to remove player:", error);
    }
  };

  const handleStartEdit = (entry: QueueEntry) => {
    setEditingId(entry.id);
    setEditingName(entry.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editingName.trim()) return;

    try {
      await DatabaseService.updateQueueEntry(editingId, editingName.trim());
      setEditingId(null);
      setEditingName("");
    } catch (error) {
      console.error("Failed to update player:", error);
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 p-4">
      <Accordion className="w-full">
        <AccordionItem>
          <AccordionTrigger>Game Rules</AccordionTrigger>
          <AccordionContent>
            <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
              {GAME_RULES.map((rule, index) => (
                <li key={index}>{rule}</li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-normal text-muted-foreground">
            Upcoming player
          </CardTitle>
        </CardHeader>
        <CardContent>
          {nextPlayer ? (
            <div className="flex items-center justify-between">
              {editingId === nextPlayer.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    className="flex-1"
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" onClick={handleSaveEdit}>
                    <Check className="size-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={handleCancelEdit}>
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold">{nextPlayer.name}</p>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleStartEdit(nextPlayer)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(nextPlayer.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <p className="text-2xl font-bold text-muted-foreground">
              No players in queue
            </p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <label className="text-sm font-medium">New player</label>
        <div className="flex gap-2">
          <Input
            placeholder="Enter player name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button variant="outline" size="icon" disabled>
            <QrCode className="size-4" />
          </Button>
        </div>

        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={!playerName.trim() || isSubmitting}
        >
          <UserPlus className="mr-2 size-4" />
          Continue
        </Button>
      </div>

      {remainingQueue.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Queue ({remainingQueue.length} waiting)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {remainingQueue.map((entry, index) => (
              <div key={entry.id}>
                {index > 0 && <Separator className="my-2" />}
                <div className="flex items-center justify-between">
                  {editingId === entry.id ? (
                    <div className="flex flex-1 items-center gap-2">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={handleEditKeyDown}
                        className="flex-1"
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" onClick={handleSaveEdit}>
                        <Check className="size-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={handleCancelEdit}>
                        <X className="size-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          {index + 2}.
                        </span>
                        <span className="font-medium">{entry.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => handleStartEdit(entry)}
                        >
                          <Pencil className="size-3" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => handleDelete(entry.id)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
