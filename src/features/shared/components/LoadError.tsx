import { Button } from "@/components/ui/button";

export function LoadError({
  message,
  retrying,
  onRetry,
}: {
  message: string;
  retrying?: boolean;
  onRetry: () => Promise<unknown>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
      <p role="alert" className="min-w-0 flex-1 font-display text-base text-foreground">
        {message}
      </p>
      <Button
        type="button"
        variant="outline"
        disabled={retrying}
        onClick={() => void onRetry().catch(() => {})}
      >
        {retrying ? "Trying again…" : "Try again"}
      </Button>
    </div>
  );
}
