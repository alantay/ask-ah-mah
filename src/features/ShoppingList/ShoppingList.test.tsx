import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { mutate } from "swr";
import ShoppingList from "./ShoppingList";

jest.mock("@/contexts/SessionContext", () => ({
  useSessionContext: () => ({ userId: "user-1" }),
}));

jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

let mockData: { items: { id: string; name: string; bought: boolean }[] };
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
  global.fetch = jest
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({}) });
});

describe("ShoppingList (Need tab)", () => {
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
            userId: "user-1",
            items: [{ name: "shallots" }],
          }),
        }),
      );
    });

    expect(mutate).toHaveBeenCalledWith("/api/shopping-list?userId=user-1");
  });
});
