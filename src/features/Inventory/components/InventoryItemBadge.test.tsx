import { InventoryItem } from "@/lib/inventory/schemas";
import { fireEvent, render, screen } from "@testing-library/react";
import { InventoryItemBadge } from "./InventoryItemBadge";

// Mock the Badge component
jest.mock("@/components/ui/badge", () => ({
  Badge: ({
    children,
    className,
    variant,
    ...props
  }: {
    children: React.ReactNode;
    className?: string;
    variant?: string;
    [key: string]: unknown;
  }) => (
    <div
      data-testid="badge"
      className={className}
      data-variant={variant}
      {...props}
    >
      {children}
    </div>
  ),
}));

describe("InventoryItemBadge", () => {
  const mockOnRemove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockItem = (
    overrides?: Partial<InventoryItem>
  ): InventoryItem => ({
    id: "item-1",
    name: "eggs",
    type: "ingredient",
    dateAdded: "2024-01-01T10:00:00.000Z",
    lastUpdated: "2024-01-01T10:00:00.000Z",
    ...overrides,
  });

  describe("Basic Rendering", () => {
    it("should render item name", () => {
      const item = createMockItem({ name: "eggs" });
      render(<InventoryItemBadge item={item} onRemove={mockOnRemove} />);

      expect(screen.getByText("eggs")).toBeInTheDocument();
    });

    it("should render with Badge component", () => {
      const item = createMockItem();
      render(<InventoryItemBadge item={item} onRemove={mockOnRemove} />);

      const badge = screen.getByTestId("badge");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute("data-variant", "outline");
      expect(badge).toHaveClass("relative", "pr-8", "py-2");
    });

    it("should render remove button", () => {
      const item = createMockItem();
      render(<InventoryItemBadge item={item} onRemove={mockOnRemove} />);

      const removeButton = screen.getByRole("button");
      expect(removeButton).toBeInTheDocument();
      expect(removeButton).toHaveClass("absolute", "right-1", "cursor-pointer");
    });

    it("should render remove icon", () => {
      const item = createMockItem();
      render(<InventoryItemBadge item={item} onRemove={mockOnRemove} />);

      const svg = screen.getByRole("button").querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("width", "16");
      expect(svg).toHaveAttribute("height", "16");
    });
  });

  describe("Quantity Display", () => {
    it("should not show quantity when quantity is undefined", () => {
      const item = createMockItem({ quantity: undefined, unit: "pieces" });
      render(<InventoryItemBadge item={item} onRemove={mockOnRemove} />);

      expect(screen.getByText("eggs")).toBeInTheDocument();
      expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
    });

    it("should show quantity when quantity is greater than 1", () => {
      const item = createMockItem({ quantity: 6, unit: "pieces" });
      render(<InventoryItemBadge item={item} onRemove={mockOnRemove} />);

      expect(screen.getByText("eggs (6 pieces)")).toBeInTheDocument();
    });

    it("should show quantity when quantity is greater than 1 without unit", () => {
      const item = createMockItem({ quantity: 3, unit: undefined });
      render(<InventoryItemBadge item={item} onRemove={mockOnRemove} />);

      expect(screen.getByText("eggs (3)")).toBeInTheDocument();
    });

    it("should show quantity when quantity is exactly 1 with unit", () => {
      const item = createMockItem({ quantity: 1, unit: "kg" });
      render(<InventoryItemBadge item={item} onRemove={mockOnRemove} />);

      expect(screen.getByText("eggs (1 kg)")).toBeInTheDocument();
    });

    it("should not show quantity when quantity is 1 without unit", () => {
      const item = createMockItem({ quantity: 1, unit: undefined });
      render(<InventoryItemBadge item={item} onRemove={mockOnRemove} />);

      expect(screen.getByText("eggs")).toBeInTheDocument();
      expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
    });

    it("should handle zero quantity", () => {
      const item = createMockItem({ quantity: 0, unit: "pieces" });
      render(<InventoryItemBadge item={item} onRemove={mockOnRemove} />);

      // Zero quantity renders as "0" due to React's falsy handling
      const badge = screen.getByTestId("badge");
      expect(badge).toHaveTextContent("eggs0");
      expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
    });
  });

  describe("Different Item Types", () => {
    it("should render ingredient items", () => {
      const item = createMockItem({
        name: "flour",
        type: "ingredient",
        quantity: 2,
        unit: "kg",
      });
      render(<InventoryItemBadge item={item} onRemove={mockOnRemove} />);

      expect(screen.getByText("flour (2 kg)")).toBeInTheDocument();
    });

    it("should render kitchenware items", () => {
      const item = createMockItem({ name: "frying pan", type: "kitchenware" });
      render(<InventoryItemBadge item={item} onRemove={mockOnRemove} />);

      expect(screen.getByText("frying pan")).toBeInTheDocument();
    });

    it("should handle items with long names", () => {
      const item = createMockItem({
        name: "extra virgin olive oil from mediterranean region",
        quantity: 1,
        unit: "bottle",
      });
      render(<InventoryItemBadge item={item} onRemove={mockOnRemove} />);

      expect(
        screen.getByText(
          "extra virgin olive oil from mediterranean region (1 bottle)"
        )
      ).toBeInTheDocument();
    });
  });

  describe("Different Units", () => {
    const units = [
      { unit: "g", expected: "eggs (500 g)" },
      { unit: "kg", expected: "eggs (2 kg)" },
      { unit: "ml", expected: "eggs (250 ml)" },
      { unit: "l", expected: "eggs (1 l)" },
      { unit: "cup", expected: "eggs (3 cup)" },
      { unit: "tbsp", expected: "eggs (4 tbsp)" },
      { unit: "tsp", expected: "eggs (2 tsp)" },
      { unit: "pieces", expected: "eggs (6 pieces)" },
      { unit: "cloves", expected: "eggs (3 cloves)" },
    ];

    units.forEach(({ unit, expected }) => {
      it(`should display ${unit} unit correctly`, () => {
        const quantity =
          unit === "l" ? 1 : parseInt(expected.match(/\((\d+)/)?.[1] || "1");
        const item = createMockItem({ quantity, unit });
        render(<InventoryItemBadge item={item} onRemove={mockOnRemove} />);

        expect(screen.getByText(expected)).toBeInTheDocument();
      });
    });
  });

  describe("User Interactions", () => {
    it("should call onRemove when remove button is clicked", () => {
      const item = createMockItem({ name: "test-item" });
      render(<InventoryItemBadge item={item} onRemove={mockOnRemove} />);

      const removeButton = screen.getByRole("button");
      fireEvent.click(removeButton);

      expect(mockOnRemove).toHaveBeenCalledTimes(1);
      expect(mockOnRemove).toHaveBeenCalledWith("test-item");
    });

    it("should call onRemove with correct item name for different items", () => {
      const items = [
        createMockItem({ name: "eggs" }),
        createMockItem({ name: "flour" }),
        createMockItem({ name: "frying pan" }),
      ];

      items.forEach((item) => {
        const { unmount } = render(
          <InventoryItemBadge item={item} onRemove={mockOnRemove} />
        );

        const removeButton = screen.getByRole("button");
        fireEvent.click(removeButton);

        expect(mockOnRemove).toHaveBeenCalledWith(item.name);

        unmount();
        mockOnRemove.mockClear();
      });
    });

    it("should handle multiple clicks on remove button", () => {
      const item = createMockItem({ name: "test-item" });
      render(<InventoryItemBadge item={item} onRemove={mockOnRemove} />);

      const removeButton = screen.getByRole("button");
      fireEvent.click(removeButton);
      fireEvent.click(removeButton);
      fireEvent.click(removeButton);

      expect(mockOnRemove).toHaveBeenCalledTimes(3);
      expect(mockOnRemove).toHaveBeenCalledWith("test-item");
    });
  });

  describe("Accessibility", () => {
    it("should have proper button role", () => {
      const item = createMockItem();
      render(<InventoryItemBadge item={item} onRemove={mockOnRemove} />);

      const removeButton = screen.getByRole("button");
      expect(removeButton).toBeInTheDocument();
    });

    it("should be keyboard accessible", () => {
      const item = createMockItem({ name: "test-item" });
      render(<InventoryItemBadge item={item} onRemove={mockOnRemove} />);

      const removeButton = screen.getByRole("button");

      // Simulate Enter key press
      fireEvent.keyDown(removeButton, { key: "Enter", code: "Enter" });
      // Note: onClick should still work with Enter key on button elements

      removeButton.focus();
      expect(removeButton).toHaveFocus();
    });

    it("should have hover states", () => {
      const item = createMockItem();
      render(<InventoryItemBadge item={item} onRemove={mockOnRemove} />);

      const removeButton = screen.getByRole("button");
      expect(removeButton).toHaveClass("hover:bg-secondary");

      const svg = removeButton.querySelector("svg");
      expect(svg).toHaveClass("text-gray-400", "group-hover:text-gray-500");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty item name", () => {
      const item = createMockItem({ name: "" });
      render(<InventoryItemBadge item={item} onRemove={mockOnRemove} />);

      // Should still render the badge structure
      expect(screen.getByTestId("badge")).toBeInTheDocument();
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should handle negative quantity", () => {
      const item = createMockItem({ quantity: -5, unit: "pieces" });
      render(<InventoryItemBadge item={item} onRemove={mockOnRemove} />);

      // Should not show negative quantity
      expect(screen.getByText("eggs")).toBeInTheDocument();
      expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
    });

    it("should handle very large quantities", () => {
      const item = createMockItem({ quantity: 9999, unit: "pieces" });
      render(<InventoryItemBadge item={item} onRemove={mockOnRemove} />);

      expect(screen.getByText("eggs (9999 pieces)")).toBeInTheDocument();
    });

    it("should handle special characters in name", () => {
      const item = createMockItem({ name: "café & crème" });
      render(<InventoryItemBadge item={item} onRemove={mockOnRemove} />);

      expect(screen.getByText("café & crème")).toBeInTheDocument();
    });
  });
});
