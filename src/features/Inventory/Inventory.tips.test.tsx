import { act, render } from "@testing-library/react";
import Inventory from "./Inventory";
import { type GetInventoryResponse } from "./Inventory";
import type { InventoryItem } from "@/lib/inventory/schemas";
import { TIP_ITEMS_DEBOUNCE_MS } from "./constants";

const TS = "2024-01-01T10:00:00.000Z";
const item = (name: string): InventoryItem => ({
  id: name,
  name,
  type: "ingredient",
  category: "Protein",
  dateAdded: TS,
  lastUpdated: TS,
});

const inventoryOf = (...names: string[]): GetInventoryResponse => ({
  ingredientInventory: names.map(item),
  kitchenwareInventory: [],
});

// Reassigned per step to simulate the cache changing under the component; a new
// object each time, which is what the [data] memo keys on.
let currentData: GetInventoryResponse = inventoryOf("Duck", "Eggs", "Nori", "Tofu");

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

jest.mock("swr", () => ({
  __esModule: true,
  default: () => ({ data: currentData, error: undefined, isLoading: false }),
  mutate: jest.fn(),
}));

jest.mock("@/lib/swr/mutateResource", () => ({
  mutateResource: jest.fn().mockResolvedValue({ ok: true }),
}));

jest.mock("sonner", () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

// Tips ON — this file exists to exercise the tip path.
jest.mock("@/hooks/useTipsPreference", () => ({
  useTipsPreference: () => [true, jest.fn()],
}));

const mockUseStorageTips = jest.fn();
jest.mock("@/hooks/useStorageTips", () => ({
  useStorageTips: (...args: unknown[]) => {
    mockUseStorageTips(...args);
    return { tips: {}, isLoading: false };
  },
}));

/** Names in the most recent useStorageTips call. */
function lastRequestedNames(): string[] {
  const calls = mockUseStorageTips.mock.calls;
  const items = calls[calls.length - 1][0] as Array<{ name: string }>;
  return items.map((i) => i.name);
}

// Guards the wiring, not the hook: useDebouncedValue has its own unit tests, but
// nothing there catches Inventory passing `tipItems` straight through. That
// regression would restore one storage-tip LLM call per delete — the exact cost
// this debounce exists to remove — while every hook test still passed.
describe("Inventory — storage-tip list is debounced", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    currentData = inventoryOf("Duck", "Eggs", "Nori", "Tofu");
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("asks for tips on the initial list straight away", () => {
    render(<Inventory />);
    expect(lastRequestedNames()).toEqual(["Duck", "Eggs", "Nori", "Tofu"]);
  });

  it("collapses a burst of removals into the final list only", () => {
    const { rerender } = render(<Inventory />);
    expect(lastRequestedNames()).toEqual(["Duck", "Eggs", "Nori", "Tofu"]);

    // Three removals in quick succession, each well inside the debounce window.
    for (const names of [
      ["Eggs", "Nori", "Tofu"],
      ["Nori", "Tofu"],
      ["Tofu"],
    ]) {
      currentData = inventoryOf(...names);
      rerender(<Inventory />);
      act(() => {
        jest.advanceTimersByTime(TIP_ITEMS_DEBOUNCE_MS / 4);
      });
    }

    // Still the pre-burst list: no intermediate set was ever requested.
    expect(lastRequestedNames()).toEqual(["Duck", "Eggs", "Nori", "Tofu"]);

    act(() => {
      jest.advanceTimersByTime(TIP_ITEMS_DEBOUNCE_MS);
    });

    expect(lastRequestedNames()).toEqual(["Tofu"]);
    const requested = mockUseStorageTips.mock.calls.map((c) =>
      (c[0] as Array<{ name: string }>).map((i) => i.name).join(","),
    );
    expect(requested).not.toContain("Eggs,Nori,Tofu");
    expect(requested).not.toContain("Nori,Tofu");
  });
});
