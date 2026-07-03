/**
 * Regression tests for #383/#384: the id passed to useChat must not reset
 * while a staging send's stream is in flight or just finishing, and must not
 * reset when its own commitConversation call lands — otherwise the AI SDK
 * drops the just-sent/streamed message from view for a beat. It should only
 * reset for a genuine conversation switch (e.g. the sidebar).
 */

import { act, renderHook } from "@testing-library/react";
import type { UIMessage } from "ai";
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
    // Mirrors the real commitConversation's effect on activeConversationId so
    // these tests can exercise the actual re-render this triggers.
    commitConversation: jest.fn((id: string) => {
      mockActiveConversationId = id;
    }),
    autoTitleActiveConversation: jest.fn().mockResolvedValue(true),
    pendingCookWithMessage: null,
    clearCookWithMessage: jest.fn(),
    activeConversation: null,
  }),
}));

// ── AI SDK mock — records every id useChat was called with, and captures the
// most recent onFinish so tests can simulate a stream completing.

const chatIdCalls: string[] = [];
const mockSendMessage = jest.fn();
let latestOnFinish: ((options: { message: UIMessage }) => void) | undefined;

jest.mock("@ai-sdk/react", () => ({
  useChat: jest.fn(
    (opts: { id: string; onFinish?: (options: { message: UIMessage }) => void }) => {
      chatIdCalls.push(opts.id);
      latestOnFinish = opts.onFinish;
      return { messages: [], sendMessage: mockSendMessage, status: "ready" };
    }
  ),
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

const fakeAssistantMessage: UIMessage = {
  id: "msg-1",
  role: "assistant",
  parts: [{ type: "text", text: "Try laksa!" }],
};

describe("useChatSession — chat id stability across staging → commit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    chatIdCalls.length = 0;
    mockActiveConversationId = null;
    latestOnFinish = undefined;
    mockSendMessage.mockResolvedValue(undefined);
  });

  it("keeps useChat keyed on 'staging' through a send, even after the conversation id is created", async () => {
    mockFetch.mockReturnValueOnce(okConversation());
    mockFetch.mockResolvedValue(okMessage());

    const { result } = renderHook(() => useChatSession());

    expect(chatIdCalls[chatIdCalls.length - 1]).toBe("staging");

    await act(async () => {
      await result.current.handleSendMessage("laksa");
    });

    // The conversation was created (real id exists server-side), but useChat
    // must not have been re-keyed mid-send — that would drop the just-added
    // user message from its store.
    expect(chatIdCalls[chatIdCalls.length - 1]).toBe("staging");
  });

  it("does not reset useChat's id when its own commitConversation call lands after the stream finishes", async () => {
    mockFetch.mockReturnValueOnce(okConversation());
    mockFetch.mockResolvedValue(okMessage());

    const { result, rerender } = renderHook(() => useChatSession());

    await act(async () => {
      await result.current.handleSendMessage("laksa");
    });

    const callsBeforeFinish = chatIdCalls.length;

    // Simulate the stream completing: onFinish commits the pending
    // conversation, which flips activeConversationId to the real id.
    await act(async () => {
      await latestOnFinish?.({ message: fakeAssistantMessage });
      rerender();
    });

    expect(mockActiveConversationId).toBe("conv-new");

    // useChat's id must still be "staging" — the commit's activeConversationId
    // change should have been skipped, not applied.
    const callsAfterFinish = chatIdCalls.slice(callsBeforeFinish);
    expect(callsAfterFinish.every((id) => id === "staging")).toBe(true);
  });

  it("does reset useChat's id for a genuine conversation switch unrelated to its own commit", async () => {
    mockFetch.mockReturnValueOnce(okConversation());
    mockFetch.mockResolvedValue(okMessage());

    const { result, rerender } = renderHook(() => useChatSession());

    await act(async () => {
      await result.current.handleSendMessage("laksa");
    });

    await act(async () => {
      await latestOnFinish?.({ message: fakeAssistantMessage });
      rerender();
    });

    // Now simulate the user picking a different, unrelated conversation from
    // the sidebar (not caused by our own commit).
    mockActiveConversationId = "conv-other";
    act(() => rerender());

    expect(chatIdCalls[chatIdCalls.length - 1]).toBe("conv-other");
  });
});
