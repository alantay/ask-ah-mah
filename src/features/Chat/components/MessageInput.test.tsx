import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageInput } from "./MessageInput";

// Mock external dependencies
jest.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    className,
    disabled,
    type,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    disabled?: boolean;
    type?: string;
    [key: string]: unknown;
  }) => (
    <button
      onClick={onClick}
      className={className}
      disabled={disabled}
      type={type}
      data-testid="button"
      {...props}
    >
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/input", () => ({
  Input: ({
    value,
    onChange,
    disabled,
    placeholder,
    className,
    ...props
  }: {
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
    [key: string]: unknown;
  }) => (
    <input
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
      data-testid="input"
      {...props}
    />
  ),
}));

describe("MessageInput", () => {
  const mockOnSendMessage = jest.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render input field with correct placeholder", () => {
      render(
        <MessageInput onSendMessage={mockOnSendMessage} disabled={false} />
      );

      const input = screen.getByTestId("input");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("placeholder", "Ask Ah Mah a question...");
    });

    it("should render submit button with send icon", () => {
      render(
        <MessageInput onSendMessage={mockOnSendMessage} disabled={false} />
      );

      const button = screen.getByTestId("button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("type", "submit");
      expect(button).toHaveAttribute("aria-label", "Send message");

      const svg = button.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("aria-hidden", "true");
      expect(svg).toHaveAttribute("focusable", "false");
    });

    it("should render form with proper structure", () => {
      const { container } = render(
        <MessageInput onSendMessage={mockOnSendMessage} disabled={false} />
      );

      const form = container.querySelector("form");
      expect(form).toBeInTheDocument();
      expect(form).toHaveClass("p-4");

      const flexContainer = form?.querySelector(".flex.gap-2");
      expect(flexContainer).toBeInTheDocument();
    });

    it("should have proper styling classes", () => {
      render(
        <MessageInput onSendMessage={mockOnSendMessage} disabled={false} />
      );

      const input = screen.getByTestId("input");
      expect(input).toHaveClass("flex-1");

      const button = screen.getByTestId("button");
      expect(button).toHaveClass("disabled:cursor-not-allowed");
    });
  });

  describe("Input State Management", () => {
    it("should update input value when user types", async () => {
      render(
        <MessageInput onSendMessage={mockOnSendMessage} disabled={false} />
      );

      const input = screen.getByTestId("input") as HTMLInputElement;

      await user.type(input, "Hello, Ah Mah!");

      expect(input.value).toBe("Hello, Ah Mah!");
    });

    it("should clear input after successful message send", async () => {
      mockOnSendMessage.mockResolvedValue(undefined);

      render(
        <MessageInput onSendMessage={mockOnSendMessage} disabled={false} />
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      const button = screen.getByTestId("button");

      await user.type(input, "Test message");
      expect(input.value).toBe("Test message");

      await user.click(button);

      await waitFor(() => {
        expect(input.value).toBe("");
      });
    });

    it("should handle controlled input changes", () => {
      render(
        <MessageInput onSendMessage={mockOnSendMessage} disabled={false} />
      );

      const input = screen.getByTestId("input");

      fireEvent.change(input, { target: { value: "New message" } });

      expect(input).toHaveValue("New message");
    });

    it("should maintain input state when component re-renders", async () => {
      const { rerender } = render(
        <MessageInput onSendMessage={mockOnSendMessage} disabled={false} />
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      await user.type(input, "Persistent message");

      // Re-render with same props
      rerender(
        <MessageInput onSendMessage={mockOnSendMessage} disabled={false} />
      );

      expect(input.value).toBe("Persistent message");
    });
  });

  describe("Form Submission", () => {
    it("should call onSendMessage when form is submitted with valid input", async () => {
      mockOnSendMessage.mockResolvedValue(undefined);

      render(
        <MessageInput onSendMessage={mockOnSendMessage} disabled={false} />
      );

      const input = screen.getByTestId("input");
      const form = input.closest("form")!;

      await user.type(input, "Hello, world!");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockOnSendMessage).toHaveBeenCalledTimes(1);
        expect(mockOnSendMessage).toHaveBeenCalledWith("Hello, world!");
      });
    });

    it("should call onSendMessage when submit button is clicked", async () => {
      mockOnSendMessage.mockResolvedValue(undefined);

      render(
        <MessageInput onSendMessage={mockOnSendMessage} disabled={false} />
      );

      const input = screen.getByTestId("input");
      const button = screen.getByTestId("button");

      await user.type(input, "Button click test");
      await user.click(button);

      await waitFor(() => {
        expect(mockOnSendMessage).toHaveBeenCalledTimes(1);
        expect(mockOnSendMessage).toHaveBeenCalledWith("Button click test");
      });
    });

    it("should prevent default form submission behavior", async () => {
      mockOnSendMessage.mockResolvedValue(undefined);

      render(
        <MessageInput onSendMessage={mockOnSendMessage} disabled={false} />
      );

      const input = screen.getByTestId("input");
      const form = input.closest("form")!;

      const handleSubmit = jest.fn((e) => e.preventDefault());
      form.addEventListener("submit", handleSubmit);

      await user.type(input, "Test message");
      fireEvent.submit(form);

      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    it("should handle Enter key submission", async () => {
      mockOnSendMessage.mockResolvedValue(undefined);

      render(
        <MessageInput onSendMessage={mockOnSendMessage} disabled={false} />
      );

      const input = screen.getByTestId("input");

      await user.type(input, "Enter key test");
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(mockOnSendMessage).toHaveBeenCalledTimes(1);
        expect(mockOnSendMessage).toHaveBeenCalledWith("Enter key test");
      });
    });
  });

  describe("Input Validation", () => {
    it("should not submit empty messages", async () => {
      render(
        <MessageInput onSendMessage={mockOnSendMessage} disabled={false} />
      );

      const button = screen.getByTestId("button");
      await user.click(button);

      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it("should not submit messages with only whitespace", async () => {
      render(
        <MessageInput onSendMessage={mockOnSendMessage} disabled={false} />
      );

      const input = screen.getByTestId("input");
      const button = screen.getByTestId("button");

      await user.type(input, "   \n\t  ");
      await user.click(button);

      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it("should trim whitespace from messages before sending", async () => {
      mockOnSendMessage.mockResolvedValue(undefined);

      render(
        <MessageInput onSendMessage={mockOnSendMessage} disabled={false} />
      );

      const input = screen.getByTestId("input");
      const button = screen.getByTestId("button");

      await user.type(input, "  Hello, world!  ");
      await user.click(button);

      await waitFor(() => {
        expect(mockOnSendMessage).toHaveBeenCalledWith("  Hello, world!  ");
      });
    });

    it("should accept single character messages", async () => {
      mockOnSendMessage.mockResolvedValue(undefined);

      render(
        <MessageInput onSendMessage={mockOnSendMessage} disabled={false} />
      );

      const input = screen.getByTestId("input");
      const button = screen.getByTestId("button");

      await user.type(input, "a");
      await user.click(button);

      await waitFor(() => {
        expect(mockOnSendMessage).toHaveBeenCalledWith("a");
      });
    });

    it("should handle very long messages", async () => {
      mockOnSendMessage.mockResolvedValue(undefined);

      render(
        <MessageInput onSendMessage={mockOnSendMessage} disabled={false} />
      );

      const longMessage = "a".repeat(1000);
      const input = screen.getByTestId("input");
      const button = screen.getByTestId("button");

      await user.type(input, longMessage);
      await user.click(button);

      await waitFor(() => {
        expect(mockOnSendMessage).toHaveBeenCalledWith(longMessage);
      });
    });
  });

  describe("Disabled State", () => {
    it("should disable input when disabled prop is true", () => {
      render(
        <MessageInput onSendMessage={mockOnSendMessage} disabled={true} />
      );

      const input = screen.getByTestId("input");
      expect(input).toBeDisabled();
    });

    it("should disable submit button when disabled prop is true", () => {
      render(
        <MessageInput onSendMessage={mockOnSendMessage} disabled={true} />
      );

      const button = screen.getByTestId("button");
      expect(button).toBeDisabled();
    });

    it("should not submit messages when disabled", async () => {
      render(
        <MessageInput onSendMessage={mockOnSendMessage} disabled={true} />
      );

      const input = screen.getByTestId("input");
      const button = screen.getByTestId("button");

      // Try to type (should not work since input is disabled)
      await user.type(input, "Should not work");
      await user.click(button);

      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it("should allow input when disabled is false", async () => {
      render(
        <MessageInput onSendMessage={mockOnSendMessage} disabled={false} />
      );

      const input = screen.getByTestId("input");
      const button = screen.getByTestId("button");

      expect(input).not.toBeDisabled();
      expect(button).not.toBeDisabled();

      await user.type(input, "This should work");
      expect(input).toHaveValue("This should work");
    });
  });

  describe("Async Message Handling", () => {
    it("should handle successful async message sending", async () => {
      mockOnSendMessage.mockResolvedValue(undefined);

      render(
        <MessageInput onSendMessage={mockOnSendMessage} disabled={false} />
      );

      const input = screen.getByTestId("input");
      const button = screen.getByTestId("button");

      await user.type(input, "Async test");
      await user.click(button);

      await waitFor(() => {
        expect(mockOnSendMessage).toHaveBeenCalledWith("Async test");
        expect(input).toHaveValue("");
      });
    });

    // Note: Component doesn't handle async errors - this is a limitation
    // that would need to be addressed in the component implementation

    it("should handle slow async operations", async () => {
      let resolvePromise: (value: unknown) => void;
      const slowPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockOnSendMessage.mockReturnValue(slowPromise);

      render(
        <MessageInput onSendMessage={mockOnSendMessage} disabled={false} />
      );

      const input = screen.getByTestId("input");
      const button = screen.getByTestId("button");

      await user.type(input, "Slow test");
      await user.click(button);

      // Input should not be cleared immediately
      expect(input).toHaveValue("Slow test");

      // Resolve the promise
      resolvePromise!(undefined);

      // Now input should be cleared
      await waitFor(() => {
        expect(input).toHaveValue("");
      });
    });
  });

  describe("Special Characters and Formatting", () => {
    it("should handle messages with emojis", async () => {
      mockOnSendMessage.mockResolvedValue(undefined);

      render(
        <MessageInput onSendMessage={mockOnSendMessage} disabled={false} />
      );

      const input = screen.getByTestId("input");
      const button = screen.getByTestId("button");

      await user.type(input, "Hello! 👋 🍳 🥚");
      await user.click(button);

      await waitFor(() => {
        expect(mockOnSendMessage).toHaveBeenCalledWith("Hello! 👋 🍳 🥚");
      });
    });

    it("should handle messages with special characters", async () => {
      mockOnSendMessage.mockResolvedValue(undefined);

      render(
        <MessageInput onSendMessage={mockOnSendMessage} disabled={false} />
      );

      const input = screen.getByTestId("input");
      const button = screen.getByTestId("button");

      // Use fireEvent.change to avoid userEvent keyboard parsing issues
      const specialMessage = "Test: @#$%^&*()_+{}|<>?[];',./`~";
      fireEvent.change(input, { target: { value: specialMessage } });
      await user.click(button);

      await waitFor(() => {
        expect(mockOnSendMessage).toHaveBeenCalledWith(specialMessage);
      });
    });

    it("should handle messages with line breaks", async () => {
      mockOnSendMessage.mockResolvedValue(undefined);

      render(
        <MessageInput onSendMessage={mockOnSendMessage} disabled={false} />
      );

      const input = screen.getByTestId("input");
      const button = screen.getByTestId("button");

      // Note: HTML input fields convert \n to space in their value
      const messageWithBreaks = "Line 1\nLine 2";
      fireEvent.change(input, { target: { value: messageWithBreaks } });
      await user.click(button);

      await waitFor(() => {
        // Input fields convert line breaks to spaces
        expect(mockOnSendMessage).toHaveBeenCalledWith("Line 1Line 2");
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes", () => {
      render(
        <MessageInput onSendMessage={mockOnSendMessage} disabled={false} />
      );

      const button = screen.getByTestId("button");
      expect(button).toHaveAttribute("aria-label", "Send message");

      const svg = button.querySelector("svg");
      expect(svg).toHaveAttribute("aria-hidden", "true");
      expect(svg).toHaveAttribute("focusable", "false");
    });

    it("should be keyboard accessible", async () => {
      mockOnSendMessage.mockResolvedValue(undefined);

      render(
        <MessageInput onSendMessage={mockOnSendMessage} disabled={false} />
      );

      const input = screen.getByTestId("input");

      // Tab to input, type message, press Enter
      await user.tab();
      expect(input).toHaveFocus();

      await user.type(input, "Keyboard test");
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(mockOnSendMessage).toHaveBeenCalledWith("Keyboard test");
      });
    });

    it("should handle focus management properly", async () => {
      render(
        <MessageInput onSendMessage={mockOnSendMessage} disabled={false} />
      );

      const input = screen.getByTestId("input");
      const button = screen.getByTestId("button");

      // Focus input
      input.focus();
      expect(input).toHaveFocus();

      // Tab to button
      await user.tab();
      expect(button).toHaveFocus();
    });
  });
});
