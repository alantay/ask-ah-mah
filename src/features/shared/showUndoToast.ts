import { toast } from "sonner";

/** Keep the removed items available for another attempt if restoration fails. */
export function showUndoToast(message: string, restore: () => Promise<void>) {
  let restoring = false;
  let restored = false;
  const undo = async () => {
    if (restoring || restored) return;
    restoring = true;
    try {
      await restore();
      restored = true;
      toast.success("Back where it belongs.");
    } catch {
      toast.error("Aiyah, couldn’t put that back. Try again?", {
        duration: 10000,
        action: { label: "Try again", onClick: () => void undo() },
      });
    } finally {
      restoring = false;
    }
  };
  toast.success(message, {
    duration: 10000,
    action: { label: "Undo", onClick: () => void undo() },
  });
}
