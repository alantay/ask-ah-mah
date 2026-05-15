import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import RecipeDisplay from "./RecipeDisplay";

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("streamdown", () => ({
  Streamdown: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="streamdown">{children}</div>
  ),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    className,
    variant,
    disabled,
    "aria-label": ariaLabel,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    variant?: string;
    disabled?: boolean;
    "aria-label"?: string;
  }) => (
    <button
      onClick={onClick}
      className={className}
      data-variant={variant}
      data-testid="button"
      aria-label={ariaLabel}
      disabled={disabled}
    >
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="badge">{children}</span>
  ),
}));

const mockSelectedRecipe = jest.fn();

jest.mock("@/contexts/RecipeContext", () => ({
  useRecipeContext: () => ({
    selectedRecipe: mockSelectedRecipe(),
    setSelectedRecipe: jest.fn(),
    exitRecipe: jest.fn(),
  }),
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

const mockClipboard = { writeText: jest.fn() };
Object.assign(navigator, { clipboard: mockClipboard });

describe("RecipeDisplay", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockClipboard.writeText.mockResolvedValue(undefined);
    mockSelectedRecipe.mockReturnValue(baseRecipe);
  });

  describe("Basic Rendering", () => {
    it("returns nothing when no recipe is selected", () => {
      mockSelectedRecipe.mockReturnValue(null);
      const { container } = render(<RecipeDisplay />);
      expect(container.firstChild).toBeNull();
    });

    it("renders recipe instructions via Streamdown for legacy recipes", () => {
      render(<RecipeDisplay />);
      const method = screen.getByTestId("streamdown");
      expect(method).toHaveTextContent("Heat butter");
      expect(method).not.toHaveTextContent("Scrambled Eggs");
      expect(method).not.toHaveTextContent("Ingredients");
      expect(method).not.toHaveTextContent("-----");
    });

    it("renders tags", () => {
      render(<RecipeDisplay />);
      expect(screen.getByText("breakfast")).toBeInTheDocument();
      expect(screen.getByText("easy")).toBeInTheDocument();
    });

    it("renders structured ingredients", () => {
      render(<RecipeDisplay />);
      expect(screen.getAllByText(/3 piece/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/2 tbsp/).length).toBeGreaterThan(0);
    });

    it("renders the copy button", () => {
      render(<RecipeDisplay />);
      expect(screen.getByText("Copy")).toBeInTheDocument();
    });

    it("renders no pantry badges or inventory-based UI", () => {
      render(<RecipeDisplay />);
      expect(screen.queryByText(/in pantry/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/\bNEED\b/)).not.toBeInTheDocument();
      expect(screen.queryByText(/\bHAVE\b/)).not.toBeInTheDocument();
      expect(screen.queryByText(/short/i)).not.toBeInTheDocument();
    });

    it("renders the ingredients section as 'What to gather'", () => {
      render(<RecipeDisplay />);
      expect(screen.getByText("What to gather")).toBeInTheDocument();
    });
  });

  describe("Structured steps", () => {
    it("renders step title and body when steps are present", () => {
      mockSelectedRecipe.mockReturnValue({
        ...baseRecipe,
        steps: [
          { title: "Heat the pan", body: "Put butter in a pan on medium heat.", tip: "Don't let it brown." },
          { title: "Add eggs", body: "Beat and pour in eggs." },
        ],
      });
      render(<RecipeDisplay />);
      expect(screen.getByText("Heat the pan")).toBeInTheDocument();
      expect(screen.getByText("Put butter in a pan on medium heat.")).toBeInTheDocument();
      expect(screen.getByText("Don't let it brown.")).toBeInTheDocument();
      expect(screen.getByText("Add eggs")).toBeInTheDocument();
      expect(screen.queryByTestId("streamdown")).not.toBeInTheDocument();
    });

    it("falls back to Streamdown when steps array is empty", () => {
      mockSelectedRecipe.mockReturnValue({ ...baseRecipe, steps: [] });
      render(<RecipeDisplay />);
      expect(screen.getByTestId("streamdown")).toBeInTheDocument();
    });
  });

  describe("Servings stepper", () => {
    it("starts at the recipe's baseServings", () => {
      render(<RecipeDisplay />);
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("scales ingredient amounts when servings increase", () => {
      render(<RecipeDisplay />);
      fireEvent.click(screen.getByLabelText("Increase servings"));
      expect(screen.getByText(/4\.5 piece/)).toBeInTheDocument();
    });

    it("scales ingredient amounts when servings decrease", () => {
      render(<RecipeDisplay />);
      fireEvent.click(screen.getByLabelText("Decrease servings"));
      expect(screen.getByText(/1\.5 piece/)).toBeInTheDocument();
    });

    it("does not go below 1 serving", () => {
      render(<RecipeDisplay />);
      const dec = screen.getByLabelText("Decrease servings");
      fireEvent.click(dec);
      fireEvent.click(dec);
      expect(dec).toBeDisabled();
    });
  });

  describe("Copy button", () => {
    it("writes the recipe instructions to the clipboard", async () => {
      render(<RecipeDisplay />);
      fireEvent.click(screen.getByText("Copy"));
      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith(baseRecipe.instructions);
      });
    });

    it("shows a success toast on copy", async () => {
      render(<RecipeDisplay />);
      fireEvent.click(screen.getByText("Copy"));
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Recipe copied to clipboard!");
      });
    });

    it("shows an error toast when clipboard fails", async () => {
      mockClipboard.writeText.mockRejectedValueOnce(new Error("denied"));
      render(<RecipeDisplay />);
      fireEvent.click(screen.getByText("Copy"));
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to copy recipe");
      });
    });
  });
});
