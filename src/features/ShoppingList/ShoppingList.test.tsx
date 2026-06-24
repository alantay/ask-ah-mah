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

  it("marks an item bought via PATCH when its checkbox is toggled", async () => {
    mockData = { items: [{ id: "row-1", name: "Apples", bought: false }] };

    render(<ShoppingList />);

    fireEvent.click(screen.getByRole("checkbox", { name: /apples/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/shopping-list",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ userId: "user-1", id: "row-1", bought: true }),
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
            userId: "user-1",
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
          body: JSON.stringify({ userId: "user-1", id: "row-1" }),
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
          body: JSON.stringify({ userId: "user-1", clearBought: true }),
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
});
