/**
 * Regression tests for #383: switching conversations must not flash the
 * full-screen "New Chat" empty state while the new conversation's saved
 * messages are still loading.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import Chat from "./Chat";
import { useChatSession } from "./hooks/useChatSession";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

jest.mock("./hooks/useChatSession");

// This suite is only about Chat.tsx's empty-state gate — MessageList has its
// own dedicated tests, so stub it out rather than pull in its full SWR /
// ai-elements dependency chain here.
jest.mock("./components/MessageList", () => ({
  MessageList: () => <div data-testid="message-list" />,
}));

const mockUseChatSession = useChatSession as jest.Mock;

// A genuinely empty thread is now an empty array — the chat no longer prepends
// a phantom welcome message to every conversation.
const NO_MESSAGES: ReturnType<typeof useChatSession>["allMessages"] = [];

function baseSession(overrides: Partial<ReturnType<typeof useChatSession>>) {
  return {
    userId: "user-1",
    allMessages: NO_MESSAGES,
    status: "ready",
    submittedAt: null,
    isSending: false,
    messagesLoading: false,
    handleSendMessage: jest.fn(),
    handleRecipeDetected: jest.fn(),
    ...overrides,
  };
}

describe("Chat — empty-state gate during conversation switch", () => {
  beforeEach(() => {
    mockUseChatSession.mockReset();
  });

  it("allows a new message and offers reply retry after an AI failure", () => {
    const retryReply = jest.fn().mockResolvedValue(undefined);
    mockUseChatSession.mockReturnValue(baseSession({
      status: "error", error: new Error("Failed"), retryReply,
    }));
    render(<Chat />);
    expect(screen.getByRole("textbox", { name: "Message Ah Mah" })).toBeEnabled();
    expect(screen.queryByPlaceholderText("Sending…")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retryReply).toHaveBeenCalledTimes(1);
  });

  it("does not call missing history a new chat or let users send into it", () => {
    const retryHistory = jest.fn().mockResolvedValue(undefined);
    mockUseChatSession.mockReturnValue(baseSession({
      historyError: new Error("Failed"), retryHistory,
    }));
    render(<Chat />);
    expect(screen.queryByText(/aiyoh, you.re here/i)).not.toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retryHistory).toHaveBeenCalledTimes(1);
  });

  it("shows the New Chat empty state when genuinely empty and not loading", () => {
    mockUseChatSession.mockReturnValue(baseSession({}));

    render(<Chat />);

    expect(screen.getByText(/aiyoh, you.re here/i)).toBeInTheDocument();
  });

  it("does not show the empty state while a just-switched conversation's messages are still loading", () => {
    mockUseChatSession.mockReturnValue(
      baseSession({ messagesLoading: true })
    );

    render(<Chat />);

    expect(screen.queryByText(/aiyoh, you.re here/i)).not.toBeInTheDocument();
  });

  it("drops the greeting once the thread has a committed message", () => {
    mockUseChatSession.mockReturnValue(
      baseSession({
        allMessages: [
          { id: "m1", role: "user", parts: [{ type: "text", text: "got chicken" }] },
        ] as ReturnType<typeof useChatSession>["allMessages"],
      })
    );

    render(<Chat />);

    expect(screen.queryByText(/aiyoh, you.re here/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("message-list")).toBeInTheDocument();
  });
});
