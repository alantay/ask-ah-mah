import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
} from "ask-ah-mah";

// The dialog shown open — content is portaled and centered over a dimmed
// overlay. `defaultOpen` renders the open state for the catalog card.
export const Open = () => (
  <Dialog defaultOpen>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Clear your pantry?</DialogTitle>
        <DialogDescription>
          This removes every ingredient you&rsquo;ve added. You can&rsquo;t undo
          it.
        </DialogDescription>
      </DialogHeader>
      <div className="flex justify-end gap-2">
        <Button variant="ghost">Keep them</Button>
        <Button variant="ctaDeep">Clear all</Button>
      </div>
    </DialogContent>
  </Dialog>
);
