/**
 * Regression tests for the in-flight send guard in useChatSession.
 *
 * The guard prevents duplicate submissions during the async pre-send gap
 * (conversation creation + message save) that occurs before the AI SDK
 * status transitions away from "ready".
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { useChatSession } from "./useChatSession";

// ── Context mocks ────────────────────────────────────────────────────────────

const mockSetPendingConversation = jest.fn();
const mockCommitConversation = jest.fn();

jest.mock("@/contexts/SessionContext", () => ({
  useSessionContext: () => ({ userId: "user-1", isLoading: false }),
}));

jest.mock("@/contexts/ConversationContext", () => ({
  useConversationContext: () => ({
    activeConversationId: null,
    setPendingConversation: mockSetPendingConversation,
    commitConversation: mockCommitConversation,
    autoTitleActiveConversation: jest.fn().mockResolvedValue(true),
    pendingCookWithMessage: null,
    clearCookWithMessage: jest.fn(),
    activeConversation: null,
  }),
}));

// ── AI SDK mocks ─────────────────────────────────────────────────────────────

const mockSendMessage = jest.fn();

jest.mock("@ai-sdk/react", () => ({
  useChat: jest.fn(() => ({
    messages: [],
    sendMessage: mockSendMessage,
    status: "ready",
  })),
}));

jest.mock("ai", () => ({
  DefaultChatTransport: jest.fn().mockImplementation(() => ({})),
}));

// ── SWR mocks ────────────────────────────────────────────────────────────────

jest.mock("swr", () => ({
  __esModule: true,
  default: jest.fn(() => ({ data: [], isLoading: false, mutate: jest.fn() })),
  mutate: jest.fn(),
}));

// ── Toast mock ───────────────────────────────────────────────────────────────

jest.mock("sonner", () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

// ── Fetch mock ───────────────────────────────────────────────────────────────

const mockFetch = jest.fn();
global.fetch = mockFetch;

// Helpers — use plain objects, not `new Response()`, because jsdom's Response
// constructor doesn't set `.ok` reliably in the test environment.
const okConversation = () =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ conversation: { id: "conv-1" } }),
  });

const okMessage = () =>
  Promise.resolve({ ok: true, status: 200 });

// ── Tests ────────────────────────────────────────────────────────────────────

describe("useChatSession — in-flight send guard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSendMessage.mockResolvedValue(undefined);
  });

  it("sets isSending=true immediately on submit before fetch resolves", async () => {
    let resolveConv!: (r: Response) => void;
    const hangingConv = new Promise<Response>((res) => {
      resolveConv = res;
    });
    mockFetch.mockReturnValueOnce(hangingConv);

    const { result } = renderHook(() => useChatSession());

    expect(result.current.isSending).toBe(false);

    // Kick off the send but don't await it — fetch is still hanging
    act(() => void result.current.handleSendMessage("nasi lemak"));

    expect(result.current.isSending).toBe(true);

    // Clean up — resolve the hanging fetch so the hook can settle
    await act(async () => {
      resolveConv({ ok: true, status: 200, json: () => Promise.resolve({ conversation: { id: "conv-1" } }) } as unknown as Response);
      mockFetch.mockResolvedValue(okMessage());
    });
  });

  it("blocks a duplicate send while one is already in flight", async () => {
    let resolveConv!: (r: Response) => void;
    const hangingConv = new Promise<Response>((res) => {
      resolveConv = res;
    });
    // First call hangs at conversation POST; all subsequent calls succeed
    mockFetch.mockReturnValueOnce(hangingConv);
    mockFetch.mockResolvedValue(okMessage());

    const { result } = renderHook(() => useChatSession());

    // Start the first send without awaiting (stays in-flight at conv POST)
    act(() => void result.current.handleSendMessage("char kway teow"));

    // The second send should be blocked synchronously by the guard
    await act(async () => {
      await result.current.handleSendMessage("char kway teow");
    });

    // Only the single conversation POST should have fired — no second POST
    expect(mockFetch).toHaveBeenCalledTimes(1);
    // sendMessage (stream) not yet called since conv fetch is still pending
    expect(mockSendMessage).toHaveBeenCalledTimes(0);

    // Clean up: resolve the first send so it can complete
    await act(async () => {
      resolveConv({ ok: true, status: 200, json: () => Promise.resolve({ conversation: { id: "conv-1" } }) } as unknown as Response);
    });

    // After the first send completes, exactly one stream was started
    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledTimes(1);
    });
  });

  it("releases the lock and resets isSending=false when conversation creation fails", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    const { result } = renderHook(() => useChatSession());

    await act(async () => {
      await result.current.handleSendMessage("hokkien mee");
    });

    expect(result.current.isSending).toBe(false);
    expect(toast.error).toHaveBeenCalled();
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it("allows a new send after a previous one fails (lock fully released)", async () => {
    // First send fails
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const { result } = renderHook(() => useChatSession());

    await act(async () => {
      await result.current.handleSendMessage("failed attempt");
    });

    // Now set up a successful path
    mockFetch.mockReturnValueOnce(okConversation());
    mockFetch.mockResolvedValue(okMessage());

    await act(async () => {
      await result.current.handleSendMessage("retry attempt");
    });

    // sendMessage called once (the retry, not the failed first attempt)
    expect(mockSendMessage).toHaveBeenCalledTimes(1);
  });
});
