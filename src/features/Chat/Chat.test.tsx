/**
 * Regression tests for #383: switching conversations must not flash the
 * full-screen "New Chat" empty state while the new conversation's saved
 * messages are still loading.
 */

import { render, screen } from "@testing-library/react";
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

const INITIAL_MESSAGE_ONLY = [
  { id: "initial", role: "assistant" as const, parts: [{ type: "text", text: "hi" }] },
];

function baseSession(overrides: Partial<ReturnType<typeof useChatSession>>) {
  return {
    userId: "user-1",
    allMessages: INITIAL_MESSAGE_ONLY,
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
});
