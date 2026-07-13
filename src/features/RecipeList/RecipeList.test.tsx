import { fireEvent, render, screen } from "@testing-library/react";
import { mutate } from "swr";
import RecipeList from "./RecipeList";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));

jest.mock("streamdown", () => ({
  Streamdown: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="streamdown">{children}</div>
  ),
}));

jest.mock("@/contexts/SessionContext", () => ({
  useSessionContext: () => ({ userId: "user-1" }),
}));

const mockRecipes = [
  {
    id: "r1",
    userId: "user-1",
    name: "Test Recipe",
    instructions: "",
    tags: ["easy"],
    recipeId: "msg-1",
    baseServings: 2,
    ingredients: [{ name: "egg", amount: 2, unit: "piece" }],
    steps: [
      { title: "Step one", body: "Do the first thing." },
      { title: "Step two", body: "Do the second thing." },
    ],
  },
];

jest.mock("swr", () => {
  const actual = jest.requireActual("swr");
  return {
    __esModule: true,
    ...actual,
    default: () => ({ data: mockRecipes, isLoading: false }),
    mutate: jest.fn(),
  };
});

describe("RecipeList — delete recipe", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
  });

  it("sends only the recipeId in the DELETE body (identity comes from the session)", async () => {
    render(<RecipeList />);

    const deleteButton = screen.getByRole("button", { name: /Delete Test Recipe/i });
    fireEvent.click(deleteButton);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/recipe",
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({ recipeId: "r1" }),
      }),
    );
  });

  it("shows success toast and revalidates on successful delete", async () => {
    render(<RecipeList />);
    fireEvent.click(screen.getByRole("button", { name: /Delete Test Recipe/i }));

    // Give the async deleteRecipe a tick to resolve (mutateResource adds one
    // more microtask hop around the fetch than the inline call it replaced)
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(jest.mocked(mutate)).toHaveBeenCalledWith("/api/recipe?userId=user-1");
  });
});

describe("RecipeList — card navigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
  });

  it("navigates to recipe page when card is clicked", () => {
    render(<RecipeList />);

    fireEvent.click(screen.getByText("Test Recipe"));

    expect(mockPush).toHaveBeenCalledWith("/recipe/r1");
  });
});
