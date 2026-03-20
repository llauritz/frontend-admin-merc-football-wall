import { Link } from "react-router-dom";
import { Users, Gamepad2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function HomePage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-8 p-4">
      <h1 className="text-3xl font-bold">Select Operating Mode</h1>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Link to="/host">
          <Card className="w-72 cursor-pointer transition-colors hover:bg-accent">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
                <Users className="size-8 text-primary" />
              </div>
              <CardTitle>Host Station</CardTitle>
              <CardDescription>Sign Up & Queue</CardDescription>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">
              Invite guests and manage the player queue
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin">
          <Card className="w-72 cursor-pointer transition-colors hover:bg-accent">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
                <Gamepad2 className="size-8 text-primary" />
              </div>
              <CardTitle>Scorekeeper Station</CardTitle>
              <CardDescription>Game Admin</CardDescription>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">
              Control game flow and record scores
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
