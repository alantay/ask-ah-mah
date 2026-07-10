import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { SessionProvider } from "@/contexts/SessionContext";
import RecipeDisplay from "./RecipeDisplay";

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("streamdown", () => ({
  Streamdown: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="streamdown">{children}</div>
  ),
}));

// mockSessionState is mutable so individual tests can flip isAuthenticated
// (e.g. to exercise the guest-only sign-in nudge) — the "mock" prefix is
// required for Jest's module-factory hoisting to allow the closure.
const mockSessionState = { isAuthenticated: true };
jest.mock("@/hooks/useSession", () => () => ({
  userId: "user-123",
  isLoading: false,
  isAuthenticated: mockSessionState.isAuthenticated,
  user: { id: "user-123", name: "Test User", email: "test@example.com", image: null },
}));

const baseRecipe = {
  id: "recipe-1",
  userId: "user-123",
  name: "Scrambled Eggs",
  instructions:
    "## Scrambled Eggs\n\n**Ingredients:**\n- 3 eggs\n- 2 tbsp butter\n\n**Instructions:**\n1. Heat butter\n2. Beat eggs\n3. Cook stirring",
  tags: ["breakfast", "easy"],
  recipeId: "msg-1",
  baseServings: 2,
  ingredients: [
    { name: "eggs", amount: 3, unit: "piece" },
    { name: "butter", amount: 2, unit: "tbsp" },
  ],
};

const renderRecipe = (overrides: Partial<typeof baseRecipe> = {}) =>
  render(
    <SessionProvider>
      <RecipeDisplay recipe={{ ...baseRecipe, ...overrides } as never} onBack={jest.fn()} />
    </SessionProvider>,
  );

describe("RecipeDisplay", () => {
  describe("Basic Rendering", () => {
    it("renders recipe instructions via Streamdown for legacy recipes", () => {
      renderRecipe();
      const method = screen.getByTestId("streamdown");
      expect(method).toHaveTextContent("Heat butter");
      expect(method).not.toHaveTextContent("Ingredients");
      expect(method).not.toHaveTextContent("-----");
    });

    it("renders tags", () => {
      renderRecipe();
      expect(screen.getByText("breakfast")).toBeInTheDocument();
      expect(screen.getByText("easy")).toBeInTheDocument();
    });

    it("renders structured ingredients", () => {
      renderRecipe();
      expect(screen.getAllByText(/3 piece/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/2 tbsp/).length).toBeGreaterThan(0);
    });

    it("does not render a Copy button", () => {
      renderRecipe();
      expect(screen.queryByText("Copy")).not.toBeInTheDocument();
    });

    it("renders the ingredients section as 'What to gather'", () => {
      renderRecipe();
      expect(screen.getByText("What to gather")).toBeInTheDocument();
    });
  });

  describe("Structured steps", () => {
    it("renders step title and body when steps are present", () => {
      renderRecipe({
        steps: [
          { title: "Heat the pan", body: "Put butter in a pan on medium heat.", tip: "Don't let it brown." },
          { title: "Add eggs", body: "Beat and pour in eggs." },
        ],
      } as never);
      expect(screen.getByText("Heat the pan")).toBeInTheDocument();
      expect(screen.getByText("Put butter in a pan on medium heat.")).toBeInTheDocument();
      expect(screen.getByText(/Don't let it brown\./)).toBeInTheDocument();
      expect(screen.getByText("Add eggs")).toBeInTheDocument();
      expect(screen.queryByTestId("streamdown")).not.toBeInTheDocument();
    });

    it("falls back to Streamdown when steps array is empty", () => {
      renderRecipe({ steps: [] } as never);
      expect(screen.getByTestId("streamdown")).toBeInTheDocument();
    });

    it("renders a Step Uses hint in the Method section, scaled to the current servings", async () => {
      renderRecipe({
        steps: [
          {
            title: "Thicken",
            body: "Stir in the slurry.",
            uses: [{ name: "slurry", amount: "3", unit: "tbsp" }],
          },
        ],
      } as never);
      const hint = screen.getByText("slurry");
      expect(hint.tagName).toBe("BUTTON");
      await userEvent.hover(hint);
      expect(await screen.findByText("3 tbsp")).toBeInTheDocument();

      // baseServings is 2 — bump to 4 via the stepper (increments by 1 per
      // click) and confirm the hint rescales.
      fireEvent.click(screen.getByLabelText(/increase servings/i));
      fireEvent.click(screen.getByLabelText(/increase servings/i));
      await userEvent.hover(hint);
      expect(await screen.findByText("6 tbsp")).toBeInTheDocument();
    });
  });

  describe("Servings stepper", () => {
    it("starts at the recipe's baseServings", () => {
      renderRecipe();
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("scales ingredient amounts when servings increase", () => {
      renderRecipe();
      fireEvent.click(screen.getByLabelText("Increase servings"));
      expect(screen.getByText(/4\.5 piece/)).toBeInTheDocument();
    });

    it("scales ingredient amounts when servings decrease", () => {
      renderRecipe();
      fireEvent.click(screen.getByLabelText("Decrease servings"));
      expect(screen.getByText(/1\.5 piece/)).toBeInTheDocument();
    });

    it("does not go below 1 serving", () => {
      renderRecipe();
      const dec = screen.getByLabelText("Decrease servings");
      fireEvent.click(dec);
      fireEvent.click(dec);
      expect(dec).toBeDisabled();
    });
  });

  describe("Start cooking", () => {
    const recipeWithSteps = {
      ...baseRecipe,
      steps: [
        { title: "Heat the pan", body: "Put butter in a pan on medium heat." },
        { title: "Add eggs", body: "Beat and pour in eggs." },
      ],
    } as never;

    it("calls onStartCooking when provided and does not render CookingMode internally", () => {
      const onStartCooking = jest.fn();
      render(
        <SessionProvider>
          <RecipeDisplay
            recipe={recipeWithSteps}
            onBack={jest.fn()}
            onStartCooking={onStartCooking}
          />
        </SessionProvider>,
      );
      fireEvent.click(screen.getByLabelText(/Start cooking/));
      expect(onStartCooking).toHaveBeenCalledTimes(1);
      // CookingMode header (e.g. "Exit cooking mode") should NOT appear
      expect(screen.queryByText(/Exit cooking mode/i)).not.toBeInTheDocument();
    });

    it("falls back to internal cooking mode when onStartCooking is not provided", () => {
      render(
        <SessionProvider>
          <RecipeDisplay recipe={recipeWithSteps} onBack={jest.fn()} />
        </SessionProvider>,
      );
      fireEvent.click(screen.getByLabelText(/Start cooking/));
      expect(screen.getByText(/Exit cooking mode/i)).toBeInTheDocument();
    });
  });

  describe("Cooked marker (ADR-0020)", () => {
    const originalFetch = global.fetch;
    let fetchMock: jest.Mock;

    beforeEach(() => {
      fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
      global.fetch = fetchMock as never;
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it("renders the 'I made this' checkbox for the owner", () => {
      renderRecipe();
      expect(screen.getByRole("checkbox", { name: "I made this" })).not.toBeChecked();
    });

    it("reflects an already-cooked recipe as checked", () => {
      renderRecipe({ cooked: true } as never);
      expect(screen.getByRole("checkbox", { name: "I made this" })).toBeChecked();
    });

    it("ticking flips the checkbox optimistically and PATCHes cooked: true", async () => {
      renderRecipe();
      const checkbox = screen.getByRole("checkbox", { name: "I made this" });

      fireEvent.click(checkbox);

      expect(checkbox).toBeChecked();
      await waitFor(() => expect(fetchMock).toHaveBeenCalled());
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe("/api/recipe/recipe-1");
      expect(init.method).toBe("PATCH");
      expect(JSON.parse(init.body).recipe.cooked).toBe(true);
    });

    it("reverts the checkbox when the PATCH fails", async () => {
      fetchMock.mockResolvedValue({ ok: false });
      renderRecipe();
      const checkbox = screen.getByRole("checkbox", { name: "I made this" });

      fireEvent.click(checkbox);

      await waitFor(() => expect(checkbox).not.toBeChecked());
    });

    it("shows a one-time sign-in nudge when a guest marks a recipe made", async () => {
      window.localStorage.clear();
      mockSessionState.isAuthenticated = false;
      renderRecipe();
      const checkbox = screen.getByRole("checkbox", { name: "I made this" });

      fireEvent.click(checkbox);

      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith(
          expect.stringContaining("Sign in and your kitchen follows you"),
          expect.objectContaining({ action: expect.objectContaining({ label: "Sign in" }) }),
        ),
      );
      mockSessionState.isAuthenticated = true;
    });

    it("does not show the sign-in nudge for a signed-in user", async () => {
      window.localStorage.clear();
      renderRecipe();
      const checkbox = screen.getByRole("checkbox", { name: "I made this" });

      fireEvent.click(checkbox);

      await waitFor(() => expect(fetchMock).toHaveBeenCalled());
      expect(toast.success).toHaveBeenCalledWith("Marked as made — nice one.");
    });

    it("hides the checkbox on the read-only public share view", () => {
      render(
        <SessionProvider>
          <RecipeDisplay recipe={baseRecipe as never} onBack={jest.fn()} readOnly />
        </SessionProvider>,
      );
      expect(screen.queryByRole("checkbox", { name: "I made this" })).not.toBeInTheDocument();
    });
  });

  describe("Before you start (mise en place)", () => {
    it("renders prep items when present", () => {
      renderRecipe({ prep: ["Dice the onion", "Mince the garlic"] } as never);
      expect(screen.getByText("Before you start")).toBeInTheDocument();
      expect(screen.getByText("Dice the onion")).toBeInTheDocument();
      expect(screen.getByText("Mince the garlic")).toBeInTheDocument();
    });

    it("omits the section when prep is empty", () => {
      renderRecipe();
      expect(screen.queryByText("Before you start")).not.toBeInTheDocument();
    });
  });
});
