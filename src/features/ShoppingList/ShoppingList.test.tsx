import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { mutate } from "swr";
import { canonicalTipKey } from "@/lib/marketTips/canonicalKey";
import { useMarketTips } from "@/hooks/useMarketTips";
import ShoppingList from "./ShoppingList";

jest.mock("@/contexts/SessionContext", () => ({
  useSessionContext: () => ({ userId: "user-1" }),
}));

jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

jest.mock("@/hooks/useMarketTips", () => ({ useMarketTips: jest.fn(() => ({})) }));
const mockedUseMarketTips = jest.mocked(useMarketTips);

let mockData: {
  items: { id: string; name: string; bought: boolean; category?: string }[];
};
jest.mock("swr", () => {
  const actual = jest.requireActual("swr");
  return {
    __esModule: true,
    ...actual,
    default: () => ({ data: mockData, isLoading: false, error: undefined }),
    mutate: jest.fn(),
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  mockData = { items: [] };
  mockedUseMarketTips.mockReturnValue({});
  global.fetch = jest
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({}) });
});

describe("ShoppingList aisles", () => {
  it("groups items under their aisle subheadings", () => {
    mockData = {
      items: [
        { id: "1", name: "Kailan", bought: false, category: "Vegetable" },
        { id: "2", name: "Pork", bought: false, category: "Protein" },
      ],
    };

    render(<ShoppingList />);

    expect(screen.getByText("Produce")).toBeInTheDocument();
    expect(screen.getByText("Meat & Seafood")).toBeInTheDocument();
    expect(screen.getByText("Kailan")).toBeInTheDocument();
    expect(screen.getByText("Pork")).toBeInTheDocument();
  });

  it("rests an uncategorised item under Other", () => {
    mockData = { items: [{ id: "1", name: "Glitter", bought: false }] };

    render(<ShoppingList />);

    expect(screen.getByText("Other")).toBeInTheDocument();
    expect(screen.getByText("Glitter")).toBeInTheDocument();
  });

  it("does not render an aisle heading that has no items", () => {
    mockData = {
      items: [{ id: "1", name: "Kailan", bought: false, category: "Vegetable" }],
    };

    render(<ShoppingList />);

    expect(screen.getByText("Produce")).toBeInTheDocument();
    expect(screen.queryByText("Meat & Seafood")).not.toBeInTheDocument();
    expect(screen.queryByText("Other")).not.toBeInTheDocument();
  });

  it("asks the API to classify pending rows after load", async () => {
    mockData = { items: [{ id: "1", name: "Glitter", bought: false }] };

    render(<ShoppingList />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/shopping-list/classify",
        expect.objectContaining({
          method: "POST",
        }),
      );
    });
  });

  it("does not call classify when every item already has an aisle", () => {
    mockData = {
      items: [{ id: "1", name: "Kailan", bought: false, category: "Produce" }],
    };

    render(<ShoppingList />);

    expect(global.fetch).not.toHaveBeenCalledWith(
      "/api/shopping-list/classify",
      expect.anything(),
    );
  });
});

describe("ShoppingList", () => {
  it("shows each item on the list", () => {
    mockData = {
      items: [
        { id: "1", name: "Apples", bought: false },
        { id: "2", name: "Oranges", bought: false },
      ],
    };

    render(<ShoppingList />);

    expect(screen.getByText("Apples")).toBeInTheDocument();
    expect(screen.getByText("Oranges")).toBeInTheDocument();
  });

  it("guides the user when the list is empty", () => {
    render(<ShoppingList />);

    expect(screen.getByText(/nothing to buy yet/i)).toBeInTheDocument();
  });

  it("adds a typed item via the shopping-list API and revalidates", async () => {
    render(<ShoppingList />);

    fireEvent.change(screen.getByPlaceholderText(/apples/i), {
      target: { value: "shallots" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/shopping-list",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            items: [{ name: "shallots" }],
          }),
        }),
      );
    });

    expect(mutate).toHaveBeenCalledWith("/api/shopping-list?userId=user-1");
  });

  it("marks an item bought via PATCH when its checkbox is toggled", async () => {
    mockData = { items: [{ id: "row-1", name: "Apples", bought: false }] };

    render(<ShoppingList />);

    fireEvent.click(screen.getByRole("checkbox", { name: /apples/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/shopping-list",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ id: "row-1", bought: true }),
        }),
      );
    });

    expect(mutate).toHaveBeenCalledWith("/api/shopping-list?userId=user-1");
  });

  it("un-marks a bought item via PATCH when toggled back", async () => {
    mockData = { items: [{ id: "row-1", name: "Apples", bought: true }] };

    render(<ShoppingList />);

    fireEvent.click(screen.getByRole("checkbox", { name: /apples/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/shopping-list",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            id: "row-1",
            bought: false,
          }),
        }),
      );
    });
  });

  it("removes an item via DELETE when its remove control is clicked", async () => {
    mockData = { items: [{ id: "row-1", name: "Apples", bought: false }] };

    render(<ShoppingList />);

    fireEvent.click(screen.getByRole("button", { name: /remove apples/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/shopping-list",
        expect.objectContaining({
          method: "DELETE",
          body: JSON.stringify({ id: "row-1" }),
        }),
      );
    });

    expect(mutate).toHaveBeenCalledWith("/api/shopping-list?userId=user-1");
  });

  it("clears bought items via DELETE when 'clear bought' is clicked", async () => {
    mockData = {
      items: [
        { id: "row-1", name: "Apples", bought: true },
        { id: "row-2", name: "Oranges", bought: false },
      ],
    };

    render(<ShoppingList />);

    fireEvent.click(screen.getByRole("button", { name: /clear bought/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/shopping-list",
        expect.objectContaining({
          method: "DELETE",
          body: JSON.stringify({ clearBought: true }),
        }),
      );
    });

    expect(mutate).toHaveBeenCalledWith("/api/shopping-list?userId=user-1");
  });

  it("does not offer 'clear bought' when nothing is bought", () => {
    mockData = { items: [{ id: "row-1", name: "Apples", bought: false }] };

    render(<ShoppingList />);

    expect(
      screen.queryByRole("button", { name: /clear bought/i }),
    ).not.toBeInTheDocument();
  });

  it("shows Ah Mah's picking tip under a pickable item", () => {
    mockData = {
      items: [{ id: "row-1", name: "Tomatoes", bought: false }],
    };
    mockedUseMarketTips.mockReturnValue({
      [canonicalTipKey("Tomatoes")]: "Pick firm, deep-red ones.",
    });

    render(<ShoppingList />);

    expect(screen.getByText(/pick firm, deep-red ones/i)).toBeInTheDocument();
  });

  it("feeds item name and category to useMarketTips", () => {
    mockData = {
      items: [{ id: "row-1", name: "Tomatoes", bought: false, category: "Vegetable" }],
    };

    render(<ShoppingList />);

    expect(mockedUseMarketTips).toHaveBeenCalledWith(
      [{ name: "Tomatoes", category: "Vegetable" }],
      true,
    );
  });

  it("shows no tip for a staple the engine returns nothing for", () => {
    mockData = { items: [{ id: "row-1", name: "Salt", bought: false }] };
    mockedUseMarketTips.mockReturnValue({});

    render(<ShoppingList />);

    expect(screen.getByText("Salt")).toBeInTheDocument();
    expect(screen.queryByText(/—/)).not.toBeInTheDocument();
  });
});
