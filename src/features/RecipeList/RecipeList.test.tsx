import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
    expect(global.fetch).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog")).toHaveTextContent(/shared link/i);
    fireEvent.click(screen.getByRole("button", { name: "Delete recipe" }));

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

    fireEvent.click(screen.getByRole("button", { name: "Delete recipe" }));

    // Give the async deleteRecipe a tick to resolve (mutateResource adds one
    // more microtask hop around the fetch than the inline call it replaced)
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(jest.mocked(mutate)).toHaveBeenCalledWith("/api/recipe?userId=user-1");
  });
});

it("does not delete when the confirmation is cancelled", () => {
  global.fetch = jest.fn();
  render(<RecipeList />);
  fireEvent.click(screen.getByRole("button", { name: /Delete Test Recipe/i }));
  fireEvent.click(screen.getByRole("button", { name: "Keep recipe" }));
  expect(global.fetch).not.toHaveBeenCalled();
  expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
});

it("keeps a failed deletion open with a retry instead of losing the recipe", async () => {
  global.fetch = jest.fn().mockResolvedValueOnce({ ok: false }).mockResolvedValue({ ok: true });
  render(<RecipeList />);
  fireEvent.click(screen.getByRole("button", { name: /Delete Test Recipe/i }));
  fireEvent.click(screen.getByRole("button", { name: "Delete recipe" }));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/couldn.t confirm the deletion/i));
  fireEvent.click(screen.getByRole("button", { name: "Delete recipe" }));
  await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  expect(global.fetch).toHaveBeenCalledTimes(2);
});

describe("RecipeList — card navigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
  });

  it("offers a native link for keyboard navigation and opening in another tab", () => {
    render(<RecipeList />);

    expect(screen.getByRole("link", { name: "Test Recipe" })).toHaveAttribute("href", "/recipe/r1");
  });
});


it("returns keyboard focus to the delete control when cancelled", async () => {
  render(<RecipeList />);
  const trigger = screen.getByRole("button", { name: /Delete Test Recipe/i });
  trigger.focus();
  fireEvent.click(trigger);
  fireEvent.click(screen.getByRole("button", { name: "Keep recipe" }));
  await waitFor(() => expect(trigger).toHaveFocus());
});
