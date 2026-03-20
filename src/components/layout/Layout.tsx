import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { CloudOff, Cloud, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useConnectionStatus } from "@/hooks/useFirebase";

interface LayoutProps {
  title: string;
}

export function Layout({ title }: LayoutProps) {
  const isConnected = useConnectionStatus();
  const location = useLocation();
  const navigate = useNavigate();
  const isSettingsPage = location.pathname === "/settings";

  useEffect(() => {
    if (!isSettingsPage) {
      sessionStorage.setItem("lastNonSettingsPath", `${location.pathname}${location.search}${location.hash}`);
    }
  }, [isSettingsPage, location.hash, location.pathname, location.search]);

  const handleSettingsClick = () => {
    if (isSettingsPage) {
      const fromState = (location.state as { from?: string } | null)?.from;
      const targetPath = fromState || sessionStorage.getItem("lastNonSettingsPath") || "/admin";
      navigate(targetPath, { replace: true });
      return;
    }

    navigate("/settings", {
      state: { from: `${location.pathname}${location.search}${location.hash}` },
    });
  };

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

          <Button variant="ghost" size="icon" onClick={handleSettingsClick} aria-label="Settings">
            <Settings className="size-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
