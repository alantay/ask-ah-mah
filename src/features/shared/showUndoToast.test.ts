import { toast } from "sonner";
import { showUndoToast } from "./showUndoToast";

jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

it("keeps Undo retryable after a failed restore and does not repeat a successful restore", async () => {
  const restore = jest.fn().mockRejectedValueOnce(new Error("Offline")).mockResolvedValue(undefined);
  showUndoToast("Removed", restore);
  const options = jest.mocked(toast.success).mock.calls[0][1] as unknown as { action: { onClick: () => void } };
  options.action.onClick();
  await Promise.resolve();
  await Promise.resolve();
  const retry = jest.mocked(toast.error).mock.calls[0][1] as unknown as { action: { onClick: () => void } };
  retry.action.onClick();
  await Promise.resolve();
  await Promise.resolve();
  retry.action.onClick();
  expect(restore).toHaveBeenCalledTimes(2);
});
