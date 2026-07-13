import { act, fireEvent, render, screen } from "@testing-library/react";
import { AddRecipeModal } from "./AddRecipeModal";
import type { RecipeBlock } from "@/lib/recipes/schemas";

jest.mock("@/contexts/SessionContext", () => ({
  useSessionContext: () => ({ userId: "user-1" }),
}));

const toastSuccess = jest.fn();
const toastError = jest.fn();
jest.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

const mutate = jest.fn();
jest.mock("swr", () => ({
  __esModule: true,
  mutate: (...args: unknown[]) => mutate(...args),
}));

// The preview step renders the heavy RecipeDisplay tree — stub it so the test
// stays focused on the modal's own flow logic.
jest.mock("@/features/RecipeDisplay/RecipeDisplay", () => ({
  __esModule: true,
  default: ({ recipe }: { recipe: { name: string } }) => (
    <div data-testid="recipe-preview">preview:{recipe.name}</div>
  ),
}));

const BLOCK: RecipeBlock = {
  title: "Fried Rice",
  baseServings: 2,
  ingredients: [],
  steps: [],
};

function mockFetch(impl: (url: string) => Promise<unknown>) {
  global.fetch = jest.fn((url: string) => impl(url)) as never;
}

async function typeAndExtract(text = "some recipe text") {
  const textarea = screen.getByPlaceholderText(/Paste recipe text here/);
  fireEvent.change(textarea, { target: { value: text } });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: /Extract recipe/ }));
  });
}

describe("AddRecipeModal", () => {
  const originalFetch = global.fetch;

  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe("paste step", () => {
    it("disables Extract until text is entered", () => {
      render(<AddRecipeModal open onOpenChange={jest.fn()} />);
      const extract = screen.getByRole("button", { name: /Extract recipe/ });
      expect(extract).toBeDisabled();

      fireEvent.change(screen.getByPlaceholderText(/Paste recipe text here/), {
        target: { value: "chicken rice" },
      });
      expect(extract).toBeEnabled();
    });

    it("reflects the character count as the user types", () => {
      render(<AddRecipeModal open onOpenChange={jest.fn()} />);
      fireEvent.change(screen.getByPlaceholderText(/Paste recipe text here/), {
        target: { value: "abcde" },
      });
      expect(screen.getByText(/5 \/ 8,000/)).toBeInTheDocument();
    });
  });

  describe("extract → preview", () => {
    it("waits for the min-timer before transitioning even after the fetch resolves", async () => {
      mockFetch(async () => ({ ok: true, json: async () => BLOCK }));
      render(<AddRecipeModal open onOpenChange={jest.fn()} />);

      await typeAndExtract();

      // Fetch has resolved, but the 1200ms minimum hasn't elapsed — still extracting.
      expect(screen.getByText(/Ah Mah is reading your recipe/)).toBeInTheDocument();
      expect(screen.queryByTestId("recipe-preview")).not.toBeInTheDocument();

      await act(async () => {
        jest.advanceTimersByTime(1200);
      });

      expect(await screen.findByTestId("recipe-preview")).toHaveTextContent(
        "preview:Fried Rice",
      );
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/recipe/extract",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ text: "some recipe text" }),
        }),
      );
    });

    it("returns to the paste step and shows the error banner on an API error", async () => {
      mockFetch(async () => ({ ok: false, json: async () => ({ error: "nope" }) }));
      render(<AddRecipeModal open onOpenChange={jest.fn()} />);

      await typeAndExtract();

      expect(
        await screen.findByText(/couldn.t find a recipe in this/i),
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Paste recipe text here/)).toBeInTheDocument();
      expect(screen.queryByTestId("recipe-preview")).not.toBeInTheDocument();
    });

    it("returns to the paste step on a network error", async () => {
      mockFetch(async () => {
        throw new Error("network down");
      });
      render(<AddRecipeModal open onOpenChange={jest.fn()} />);

      await typeAndExtract();

      expect(
        await screen.findByText(/couldn.t find a recipe in this/i),
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Paste recipe text here/)).toBeInTheDocument();
    });
  });

  describe("save flow", () => {
    async function reachPreview() {
      mockFetch(async () => ({ ok: true, json: async () => BLOCK }));
      await typeAndExtract();
      await act(async () => {
        jest.advanceTimersByTime(1200);
      });
      await screen.findByTestId("recipe-preview");
    }

    it("saves, revalidates the cache, toasts, and closes on success", async () => {
      const onOpenChange = jest.fn();
      render(<AddRecipeModal open onOpenChange={onOpenChange} />);
      await reachPreview();

      mockFetch(async () => ({ ok: true, json: async () => ({}) }));
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /Save to cookbook/ }));
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/recipe",
        expect.objectContaining({ method: "POST" }),
      );
      expect(mutate).toHaveBeenCalledWith("/api/recipe?userId=user-1");
      expect(toastSuccess).toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("toasts an error and stays open when the save fails", async () => {
      const onOpenChange = jest.fn();
      render(<AddRecipeModal open onOpenChange={onOpenChange} />);
      await reachPreview();

      mockFetch(async () => ({ ok: false, json: async () => ({}) }));
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /Save to cookbook/ }));
      });

      expect(toastError).toHaveBeenCalled();
      expect(mutate).not.toHaveBeenCalled();
      expect(onOpenChange).not.toHaveBeenCalledWith(false);
    });
  });
});
