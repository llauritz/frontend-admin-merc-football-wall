export function LoadingScreen() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4">
      <div className="h-9 w-full animate-pulse rounded-md bg-muted" />

      <div className="space-y-4">
        <div className="h-24 w-full animate-pulse rounded-xl bg-muted" />
        <div className="h-44 w-full animate-pulse rounded-xl bg-muted" />
        <div className="h-56 w-full animate-pulse rounded-xl bg-muted" />
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div className="size-2 animate-pulse rounded-full bg-muted-foreground/50" />
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">loading</p>
      </div>
    </div>
  );
}