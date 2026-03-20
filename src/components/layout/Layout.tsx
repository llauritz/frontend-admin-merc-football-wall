import { Outlet, Link } from "react-router-dom";
import { CloudOff, Cloud, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useConnectionStatus } from "@/hooks/useFirebase";

interface LayoutProps {
  title: string;
}

export function Layout({ title }: LayoutProps) {
  const isConnected = useConnectionStatus();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col border-x bg-background">
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background px-4">
        <h1 className="text-lg font-semibold">{title}</h1>

        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? "outline" : "destructive"}>
            {isConnected ? (
              <>
                <Cloud className="mr-1 size-3" />
                Connected
              </>
            ) : (
              <>
                <CloudOff className="mr-1 size-3" />
                Disconnected
              </>
            )}
          </Badge>

          <Link to="/settings">
            <Button variant="ghost" size="icon">
              <Settings className="size-4" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
