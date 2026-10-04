import { fireEvent, render, screen } from "@testing-library/react";
import Inventory from "@/features/Inventory/Inventory";
import ShoppingList from "@/features/ShoppingList/ShoppingList";
import RecipeList from "@/features/RecipeList/RecipeList";
import RecipePage from "@/app/(app)/recipe/[id]/page";

const mockRetry = jest.fn().mockResolvedValue(undefined);
let mockData: unknown;
let mockError: Error | undefined;
let mockSessionLoading = false;

jest.mock("swr", () => ({
  __esModule: true,
  default: () => ({ data: mockData, error: mockError, isLoading: false, isValidating: false, mutate: mockRetry }),
  mutate: jest.fn(),
}));
jest.mock("@/contexts/SessionContext", () => ({
  useSessionContext: () => ({ userId: mockSessionLoading ? null : "user-1", isLoading: mockSessionLoading }),
}));
jest.mock("@/contexts/ConversationContext", () => ({
  useConversationContext: () => ({ queueCookWithMessage: jest.fn(), startNewConversation: jest.fn() }),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: "r1" }),
}));
jest.mock("@/hooks/useStorageTips", () => ({ useStorageTips: () => ({ tips: {}, isLoading: false }) }));
jest.mock("@/hooks/useMarketTips", () => ({ useMarketTips: () => ({ tips: {}, isLoading: false }) }));
jest.mock("@/features/RecipeDisplay/RecipeDisplay", () => ({ __esModule: true, default: () => <div>Recipe content</div> }));
jest.mock("@/features/RecipeList/components/AddRecipeModal", () => ({ AddRecipeModal: () => null }));

beforeEach(() => {
  jest.clearAllMocks();
  mockData = undefined;
  mockError = new Error("private database detail");
  mockSessionLoading = false;
});

it.each([
  ["pantry", Inventory, /nothing in yet/i],
  ["shopping list", ShoppingList, /nothing to buy yet/i],
  ["cookbook", RecipeList, /cookbook.s empty for now/i],
] as const)("offers retry instead of a false empty %s", (_name, Component, emptyText) => {
  render(<Component />);
  expect(screen.getByRole("alert")).toBeInTheDocument();
  expect(screen.queryByText(emptyText)).not.toBeInTheDocument();
  expect(screen.queryByText(/private database detail/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(mockRetry).toHaveBeenCalledTimes(1);
});

it("keeps cached pantry items during a failed refresh", () => {
  mockData = { ingredientInventory: [{ id: "egg", name: "Eggs", type: "ingredient", category: "Protein" }], kitchenwareInventory: [] };
  render(<Inventory />);
  expect(screen.getByText("Eggs")).toBeInTheDocument();
  expect(screen.getByRole("alert")).toBeInTheDocument();
});

it("keeps cached shopping items and the draft during a failed refresh", () => {
  mockError = undefined;
  mockData = { items: [{ id: "egg", name: "Eggs", bought: false, category: "Produce" }] };
  const { rerender } = render(<ShoppingList />);
  fireEvent.change(screen.getByRole("textbox", { name: "Add shopping items" }), { target: { value: "Rice" } });
  mockError = new Error("Failed");
  rerender(<ShoppingList />);
  expect(screen.getByText("Eggs")).toBeInTheDocument();
  expect(screen.getByRole("textbox")).toHaveValue("Rice");
});

it("distinguishes a recipe fetch failure from a missing recipe", () => {
  const { rerender } = render(<RecipePage />);
  expect(screen.getByRole("alert")).toHaveTextContent(/couldn.t load this recipe/i);
  expect(screen.queryByText(/can.t find that one/i)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(mockRetry).toHaveBeenCalledTimes(1);
  mockError = undefined;
  mockData = [];
  rerender(<RecipePage />);
  expect(screen.getByText(/can.t find that one/i)).toBeInTheDocument();
});

it("waits for session resolution before declaring a recipe missing", () => {
  mockError = undefined;
  mockSessionLoading = true;
  render(<RecipePage />);
  expect(screen.getByText(/pulling out the recipe/i)).toBeInTheDocument();
  expect(screen.queryByText(/can.t find that one/i)).not.toBeInTheDocument();
});

it("keeps a cached recipe readable when refreshing fails", () => {
  mockData = [{ id: "r1" }];
  render(<RecipePage />);
  expect(screen.getByText("Recipe content")).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent(/keep reading/i);
});
