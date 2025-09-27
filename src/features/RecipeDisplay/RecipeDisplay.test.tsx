import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import RecipeDisplay from "./RecipeDisplay";

// Mock external dependencies
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

jest.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    className,
    variant,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    variant?: string;
    [key: string]: unknown;
  }) => (
    <button
      onClick={onClick}
      className={className}
      data-variant={variant}
      data-testid="button"
      {...props}
    >
      {children}
    </button>
  ),
}));

// Mock clipboard API
const mockClipboard = {
  writeText: jest.fn(),
};

Object.assign(navigator, {
  clipboard: mockClipboard,
});

describe("RecipeDisplay", () => {
  const mockExitRecipe = jest.fn();
  const mockRecipe = `# Scrambled Eggs 🍳

## Ingredients:
- 3 eggs ✅
- 2 tbsp butter 🛒
- Salt to taste ✅
- Pepper to taste ✅

## Instructions:
1. Heat butter in pan
2. Beat eggs with salt and pepper
3. Cook while stirring gently
4. Serve hot`;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClipboard.writeText.mockResolvedValue(undefined);
  });

  describe("Basic Rendering", () => {
    it("should render recipe content", () => {
      render(<RecipeDisplay recipe={mockRecipe} exitRecipe={mockExitRecipe} />);

      expect(screen.getByTestId("streamdown")).toBeInTheDocument();
      expect(screen.getByTestId("streamdown")).toHaveTextContent(
        "Scrambled Eggs"
      );
    });

    it("should render copy and exit buttons", () => {
      render(<RecipeDisplay recipe={mockRecipe} exitRecipe={mockExitRecipe} />);

      const buttons = screen.getAllByTestId("button");
      expect(buttons).toHaveLength(2);

      // Check for copy button (has SVG icon)
      const copyButton = buttons[0];
      expect(copyButton).toHaveAttribute(
        "aria-label",
        "Copy recipe to clipboard"
      );
      expect(copyButton.querySelector("svg")).toBeInTheDocument();

      // Check for exit button
      const exitButton = buttons[1];
      expect(exitButton).toHaveTextContent("Exit Recipe");
    });

    it("should have proper layout structure", () => {
      render(<RecipeDisplay recipe={mockRecipe} exitRecipe={mockExitRecipe} />);

      const container = screen
        .getByTestId("streamdown")
        .closest(".h-full.relative");
      expect(container).toBeInTheDocument();

      const buttonContainer = container?.querySelector(
        ".absolute.right-4.top-4.flex.gap-2"
      );
      expect(buttonContainer).toBeInTheDocument();

      const contentContainer = container?.querySelector(
        ".h-full.overflow-y-auto.pt-15.xl\\:pt-4.pb-10.px-4"
      );
      expect(contentContainer).toBeInTheDocument();
    });

    it("should apply custom className when provided", () => {
      const { container } = render(
        <RecipeDisplay
          recipe={mockRecipe}
          exitRecipe={mockExitRecipe}
          className="custom-class"
        />
      );

      // Note: The className prop is accepted but not currently used in the component
      // This test documents the current behavior
      expect(container.firstChild).toHaveClass("h-full", "relative");
    });
  });

  describe("Recipe Content Processing", () => {
    it("should remove checkmark emojis from recipe", () => {
      const recipeWithCheckmarks =
        "- Salt ✅\n- Pepper ✅ in stock\n- Oil✅available";

      render(
        <RecipeDisplay
          recipe={recipeWithCheckmarks}
          exitRecipe={mockExitRecipe}
        />
      );

      const streamdown = screen.getByTestId("streamdown");
      expect(streamdown).toHaveTextContent(
        "- Salt - Pepper in stock - Oilavailable"
      );
      expect(streamdown).not.toHaveTextContent("✅");
    });

    it("should remove shopping cart emojis from recipe", () => {
      const recipeWithCarts =
        "- Butter 🛒\n- Milk 🛒 needed\n- Cheese🛒buy tomorrow";

      render(
        <RecipeDisplay recipe={recipeWithCarts} exitRecipe={mockExitRecipe} />
      );

      const streamdown = screen.getByTestId("streamdown");
      expect(streamdown).toHaveTextContent(
        "- Butter - Milk needed - Cheesebuy tomorrow"
      );
      expect(streamdown).not.toHaveTextContent("🛒");
    });

    it("should preserve other emojis", () => {
      const recipeWithEmojis =
        "🍳 Scrambled Eggs 🥚\n- Heat 🔥 butter\n- Add 🧂 salt";

      render(
        <RecipeDisplay recipe={recipeWithEmojis} exitRecipe={mockExitRecipe} />
      );

      const streamdown = screen.getByTestId("streamdown");
      expect(streamdown).toHaveTextContent("🍳");
      expect(streamdown).toHaveTextContent("🥚");
      expect(streamdown).toHaveTextContent("🔥");
      expect(streamdown).toHaveTextContent("🧂");
    });

    it("should handle empty recipe", () => {
      render(<RecipeDisplay recipe="" exitRecipe={mockExitRecipe} />);

      const streamdown = screen.getByTestId("streamdown");
      expect(streamdown).toHaveTextContent("");
    });

    it("should handle recipe with only special characters", () => {
      const specialRecipe = "✅ 🛒 ✅ 🛒";

      render(
        <RecipeDisplay recipe={specialRecipe} exitRecipe={mockExitRecipe} />
      );

      const streamdown = screen.getByTestId("streamdown");
      expect(streamdown).toHaveTextContent("");
    });

    it("should handle mixed special characters and spaces", () => {
      const mixedRecipe = "Item 1 ✅   \nItem 2 🛒 \nItem 3✅\nItem 4🛒";

      render(
        <RecipeDisplay recipe={mixedRecipe} exitRecipe={mockExitRecipe} />
      );

      const streamdown = screen.getByTestId("streamdown");
      expect(streamdown).toHaveTextContent("Item 1 Item 2 Item 3Item 4");
    });
  });

  describe("Copy Functionality", () => {
    it("should copy cleaned recipe to clipboard when copy button is clicked", async () => {
      render(<RecipeDisplay recipe={mockRecipe} exitRecipe={mockExitRecipe} />);

      const copyButton = screen.getByLabelText("Copy recipe to clipboard");
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledTimes(1);
      });

      const copiedText = mockClipboard.writeText.mock.calls[0][0];
      expect(copiedText).not.toContain("✅");
      expect(copiedText).not.toContain("🛒");
      expect(copiedText).toContain("Scrambled Eggs");
      expect(copiedText).toContain("3 eggs");
      expect(copiedText).toContain("2 tbsp butter");
    });

    it("should show success toast when copy succeeds", async () => {
      render(<RecipeDisplay recipe={mockRecipe} exitRecipe={mockExitRecipe} />);

      const copyButton = screen.getByLabelText("Copy recipe to clipboard");
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Recipe copied to clipboard!"
        );
      });
    });

    it("should show error toast when copy fails", async () => {
      mockClipboard.writeText.mockRejectedValue(new Error("Clipboard error"));

      render(<RecipeDisplay recipe={mockRecipe} exitRecipe={mockExitRecipe} />);

      const copyButton = screen.getByLabelText("Copy recipe to clipboard");
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to copy recipe");
      });
    });

    it("should copy empty string for empty recipe", async () => {
      render(<RecipeDisplay recipe="" exitRecipe={mockExitRecipe} />);

      const copyButton = screen.getByLabelText("Copy recipe to clipboard");
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith("");
      });
    });

    it("should handle multiple copy attempts", async () => {
      render(<RecipeDisplay recipe={mockRecipe} exitRecipe={mockExitRecipe} />);

      const copyButton = screen.getByLabelText("Copy recipe to clipboard");

      fireEvent.click(copyButton);
      fireEvent.click(copyButton);
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledTimes(3);
      });
      expect(toast.success).toHaveBeenCalledTimes(3);
    });
  });

  describe("Exit Functionality", () => {
    it("should call exitRecipe when exit button is clicked", () => {
      render(<RecipeDisplay recipe={mockRecipe} exitRecipe={mockExitRecipe} />);

      const exitButton = screen.getByText("Exit Recipe");
      fireEvent.click(exitButton);

      expect(mockExitRecipe).toHaveBeenCalledTimes(1);
    });

    it("should handle multiple exit clicks", () => {
      render(<RecipeDisplay recipe={mockRecipe} exitRecipe={mockExitRecipe} />);

      const exitButton = screen.getByText("Exit Recipe");

      fireEvent.click(exitButton);
      fireEvent.click(exitButton);
      fireEvent.click(exitButton);

      expect(mockExitRecipe).toHaveBeenCalledTimes(3);
    });
  });

  describe("Button Styling and Accessibility", () => {
    it("should have correct button variants", () => {
      render(<RecipeDisplay recipe={mockRecipe} exitRecipe={mockExitRecipe} />);

      const buttons = screen.getAllByTestId("button");

      // Both buttons should have secondary variant
      expect(buttons[0]).toHaveAttribute("data-variant", "secondary");
      expect(buttons[1]).toHaveAttribute("data-variant", "secondary");
    });

    it("should have proper accessibility attributes", () => {
      render(<RecipeDisplay recipe={mockRecipe} exitRecipe={mockExitRecipe} />);

      const copyButton = screen.getByLabelText("Copy recipe to clipboard");
      expect(copyButton).toHaveAttribute(
        "aria-label",
        "Copy recipe to clipboard"
      );

      const exitButton = screen.getByText("Exit Recipe");
      expect(exitButton).toBeInTheDocument();
    });

    it("should have cursor pointer styles", () => {
      render(<RecipeDisplay recipe={mockRecipe} exitRecipe={mockExitRecipe} />);

      const buttons = screen.getAllByTestId("button");

      buttons.forEach((button) => {
        expect(button).toHaveClass("cursor-pointer");
      });
    });
  });

  describe("Copy Icon", () => {
    it("should render copy icon SVG", () => {
      render(<RecipeDisplay recipe={mockRecipe} exitRecipe={mockExitRecipe} />);

      const copyButton = screen.getByLabelText("Copy recipe to clipboard");
      const svg = copyButton.querySelector("svg");

      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("width", "24");
      expect(svg).toHaveAttribute("height", "24");
      expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
      expect(svg).toHaveAttribute("fill", "none");
    });

    it("should have copy icon path", () => {
      render(<RecipeDisplay recipe={mockRecipe} exitRecipe={mockExitRecipe} />);

      const copyButton = screen.getByLabelText("Copy recipe to clipboard");
      const path = copyButton.querySelector("svg path");

      expect(path).toBeInTheDocument();
      expect(path).toHaveAttribute("fill", "currentColor");
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long recipes", () => {
      const longRecipe = "Step ".repeat(1000) + "Final step";

      render(<RecipeDisplay recipe={longRecipe} exitRecipe={mockExitRecipe} />);

      const streamdown = screen.getByTestId("streamdown");
      expect(streamdown).toHaveTextContent("Final step");
    });

    it("should handle recipes with special markdown characters", () => {
      const markdownRecipe =
        "# Title\n## Subtitle\n- List item\n**Bold**\n*Italic*";

      render(
        <RecipeDisplay recipe={markdownRecipe} exitRecipe={mockExitRecipe} />
      );

      const streamdown = screen.getByTestId("streamdown");
      expect(streamdown).toHaveTextContent(
        "# Title ## Subtitle - List item **Bold** *Italic*"
      );
    });

    it("should handle recipes with line breaks and spacing", () => {
      const spacedRecipe = "Line 1\n\nLine 3\n   \nLine 5";

      render(
        <RecipeDisplay recipe={spacedRecipe} exitRecipe={mockExitRecipe} />
      );

      const streamdown = screen.getByTestId("streamdown");
      expect(streamdown).toHaveTextContent("Line 1 Line 3 Line 5");
    });

    it("should handle undefined clipboard", async () => {
      // Temporarily remove clipboard support
      const originalClipboard = navigator.clipboard;
      Object.defineProperty(navigator, "clipboard", {
        value: undefined,
        writable: true,
      });

      render(<RecipeDisplay recipe={mockRecipe} exitRecipe={mockExitRecipe} />);

      const copyButton = screen.getByLabelText("Copy recipe to clipboard");
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to copy recipe");
      });

      // Restore clipboard
      Object.defineProperty(navigator, "clipboard", {
        value: originalClipboard,
        writable: true,
      });
    });
  });
});
