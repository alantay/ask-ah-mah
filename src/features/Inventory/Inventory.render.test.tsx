import { act, fireEvent, render, screen } from "@testing-library/react";
import Inventory from "./Inventory";
import { type GetInventoryResponse } from "./Inventory";
import type { InventoryItem } from "@/lib/inventory/schemas";

const TS = "2024-01-01T10:00:00.000Z";
const item = (name: string): InventoryItem => ({
  id: name,
  name,
  type: "ingredient",
  category: "Protein",
  dateAdded: TS,
  lastUpdated: TS,
});

const DATA: GetInventoryResponse = {
  ingredientInventory: [item("Duck"), item("Eggs"), item("Nori")],
  kitchenwareInventory: [],
};

jest.mock("@/contexts/SessionContext", () => ({
  useSessionContext: () => ({ userId: "u1" }),
}));

jest.mock("@/contexts/ConversationContext", () => ({
  useConversationContext: () => ({
    queueCookWithMessage: jest.fn(),
    startNewConversation: jest.fn(),
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const mockMutate = jest.fn();
jest.mock("swr", () => ({
  __esModule: true,
  default: () => ({ data: DATA, error: undefined, isLoading: false }),
  mutate: (...args: unknown[]) => mockMutate(...args),
}));

const mockMutateResource = jest.fn();
jest.mock("@/lib/swr/mutateResource", () => ({
  mutateResource: (...args: unknown[]) => mockMutateResource(...args),
}));

const mockToastError = jest.fn();
const mockToastSuccess = jest.fn();
jest.mock("sonner", () => ({
  toast: {
    error: (...a: unknown[]) => mockToastError(...a),
    success: (...a: unknown[]) => mockToastSuccess(...a),
  },
}));

// Tips are opt-in and default off; keep them out of this file entirely.
jest.mock("@/hooks/useStorageTips", () => ({
  useStorageTips: () => ({ tips: {}, isLoading: false }),
}));

function removeButtonFor(name: string) {
  return screen.getByRole("button", { name: `Remove ${name}` });
}

// `removeItem` is fire-and-forget from the click handler's perspective, and
// the mocked useSWR returns a fixed snapshot, so nothing in the DOM changes to
// wait on. Flush the microtask queue instead — inside act() so React applies
// any resulting state updates before we assert.
const flush = () => act(async () => {});

describe("Inventory — optimistic delete", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMutateResource.mockResolvedValue({ ok: true });
  });

  it("sends the delete with the item name", async () => {
    render(<Inventory />);
    fireEvent.click(removeButtonFor("Duck"));

    expect(mockMutateResource).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/api/inventory",
        method: "DELETE",
        body: { itemNames: ["Duck"] },
      }),
    );
  });

  it("passes a functional optimisticData that removes the item", () => {
    render(<Inventory />);
    fireEvent.click(removeButtonFor("Duck"));

    const { optimisticData } = mockMutateResource.mock.calls[0][0];
    expect(typeof optimisticData).toBe("function");
    expect(optimisticData(DATA).ingredientInventory.map((i: InventoryItem) => i.name)).toEqual([
      "Eggs",
      "Nori",
    ]);
  });

  // The regression the functional form exists to prevent: three clicks in one
  // frame all close over the same render snapshot. Applying the three updaters
  // in sequence (as SWR does against live cache state) must remove all three.
  it("composes concurrent deletes instead of clobbering", () => {
    render(<Inventory />);
    fireEvent.click(removeButtonFor("Duck"));
    fireEvent.click(removeButtonFor("Eggs"));
    fireEvent.click(removeButtonFor("Nori"));

    const updaters = mockMutateResource.mock.calls.map((c) => c[0].optimisticData);
    const final = updaters.reduce(
      (acc: GetInventoryResponse, fn: (d?: GetInventoryResponse) => GetInventoryResponse) => fn(acc),
      DATA,
    );

    expect(final.ingredientInventory).toEqual([]);
  });

  it("is silent and does not revalidate on success", async () => {
    render(<Inventory />);
    fireEvent.click(removeButtonFor("Duck"));
    await flush();

    expect(mockToastSuccess).not.toHaveBeenCalled();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("revalidates and toasts when the delete fails", async () => {
    mockMutateResource.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "boom",
    });
    render(<Inventory />);
    fireEvent.click(removeButtonFor("Duck"));
    await flush();

    expect(mockMutate).toHaveBeenCalledWith("/api/inventory?userId=u1");
    expect(mockToastError).toHaveBeenCalledWith("Aiyah, Duck won't budge. Try again?");
  });

  it("revalidates and toasts when the request throws", async () => {
    mockMutateResource.mockRejectedValue(new Error("offline"));
    render(<Inventory />);
    fireEvent.click(removeButtonFor("Duck"));
    await flush();

    expect(mockMutate).toHaveBeenCalledWith("/api/inventory?userId=u1");
    expect(mockToastError).toHaveBeenCalledWith("Aiyah, Duck won't budge. Try again?");
  });
});
