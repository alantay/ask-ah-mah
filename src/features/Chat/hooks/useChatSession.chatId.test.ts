/**
 * Regression tests for #383/#384: the id passed to useChat must not reset
 * between a staging send claiming a new conversation id and
 * commitConversation later assigning that same id to activeConversationId —
 * otherwise the AI SDK drops the just-streamed assistant message from view
 * for a beat, flashing back to the empty state right as a recipe finishes.
 */

import { act, renderHook } from "@testing-library/react";
import { useChatSession } from "./useChatSession";

// ── Mutable context mock ────────────────────────────────────────────────────

let mockActiveConversationId: string | null = null;

jest.mock("@/contexts/SessionContext", () => ({
  useSessionContext: () => ({ userId: "user-1", isLoading: false }),
}));

jest.mock("@/contexts/ConversationContext", () => ({
  useConversationContext: () => ({
    activeConversationId: mockActiveConversationId,
    setPendingConversation: jest.fn(),
    commitConversation: jest.fn(),
    autoTitleActiveConversation: jest.fn().mockResolvedValue(true),
    pendingCookWithMessage: null,
    clearCookWithMessage: jest.fn(),
    activeConversation: null,
  }),
}));

// ── AI SDK mock — records every id useChat was called with ─────────────────

const chatIdCalls: string[] = [];
const mockSendMessage = jest.fn();

jest.mock("@ai-sdk/react", () => ({
  useChat: jest.fn((opts: { id: string }) => {
    chatIdCalls.push(opts.id);
    return { messages: [], sendMessage: mockSendMessage, status: "ready" };
  }),
}));

jest.mock("ai", () => ({
  DefaultChatTransport: jest.fn().mockImplementation(() => ({})),
}));

jest.mock("swr", () => ({
  __esModule: true,
  default: jest.fn(() => ({ data: [], isLoading: false, mutate: jest.fn() })),
  mutate: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

const okConversation = () =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ conversation: { id: "conv-new" } }),
  });

const okMessage = () => Promise.resolve({ ok: true, status: 200 });

describe("useChatSession — chat id stability across staging → commit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    chatIdCalls.length = 0;
    mockActiveConversationId = null;
    mockSendMessage.mockResolvedValue(undefined);
  });

  it("claims the real conversation id for useChat as soon as it's created, before commitConversation ever runs", async () => {
    mockFetch.mockReturnValueOnce(okConversation());
    mockFetch.mockResolvedValue(okMessage());

    const { result } = renderHook(() => useChatSession());

    expect(chatIdCalls[chatIdCalls.length - 1]).toBe("staging");

    await act(async () => {
      await result.current.handleSendMessage("laksa");
    });

    // useChat should already be keyed on the real id — never bounced back to
    // "staging" once the conversation was created.
    expect(chatIdCalls[chatIdCalls.length - 1]).toBe("conv-new");
    expect(chatIdCalls).not.toContain(undefined);
  });

  it("does not change useChat's id when activeConversationId later catches up to the same value (simulated commit)", async () => {
    mockFetch.mockReturnValueOnce(okConversation());
    mockFetch.mockResolvedValue(okMessage());

    const { result, rerender } = renderHook(() => useChatSession());

    await act(async () => {
      await result.current.handleSendMessage("laksa");
    });

    const callsBeforeCommit = chatIdCalls.length;
    expect(chatIdCalls[chatIdCalls.length - 1]).toBe("conv-new");

    // Simulate commitConversation resolving: context now reports the same id
    // as activeConversationId.
    mockActiveConversationId = "conv-new";
    act(() => rerender());

    // Every subsequent call must still be "conv-new" — no reset to "staging"
    // and no transient different value in between.
    const callsAfterCommit = chatIdCalls.slice(callsBeforeCommit);
    expect(callsAfterCommit.every((id) => id === "conv-new")).toBe(true);
  });
});
