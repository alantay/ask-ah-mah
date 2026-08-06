import { render, screen } from "@testing-library/react";
import { InventoryItemRow } from "./InventoryItemRow";
import type { InventoryItem } from "@/lib/inventory/schemas";

const TS = "2024-01-01T10:00:00.000Z";
const LONG = "Fresh firm fish (mackerel, snapper, barramundi)";

const item = (name: string): InventoryItem => ({
  id: name,
  name,
  type: "ingredient",
  dateAdded: TS,
  lastUpdated: TS,
});

describe("InventoryItemRow — long names", () => {
  it("wraps rather than clipping in the default row", () => {
    render(
      <ul>
        <InventoryItemRow item={item(LONG)} onRemove={jest.fn()} />
      </ul>,
    );

    const name = screen.getByText(LONG);
    // `truncate` sets white-space: nowrap, which on an inline box prevents
    // wrapping without clipping — the exact bug. It must be gone.
    expect(name).not.toHaveClass("truncate");
    expect(name).toHaveClass("break-words");
  });

  it("still renders the storage tip under the name", () => {
    render(
      <ul>
        <InventoryItemRow
          item={item(LONG)}
          onRemove={jest.fn()}
          storageTip="Keep it on ice."
        />
      </ul>,
    );

    expect(screen.getByText("— Keep it on ice.")).toBeInTheDocument();
  });

  it("keeps single-line truncation in selection mode", () => {
    render(
      <ul>
        <InventoryItemRow
          item={item(LONG)}
          onRemove={jest.fn()}
          selectionMode
          onToggle={jest.fn()}
        />
      </ul>,
    );

    expect(screen.getByText(LONG)).toHaveClass("truncate");
  });
});
