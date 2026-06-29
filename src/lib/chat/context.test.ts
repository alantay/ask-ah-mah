import { getMessages } from "@/lib/messages/messages";
import { validateUIMessages } from "ai";
import { loadConversationContext } from "./context";

jest.mock("@/lib/messages/messages", () => ({
  getMessages: jest.fn(),
}));

jest.mock("ai", () => ({
  validateUIMessages: jest.fn((args) => args.messages),
}));

const makeDbMessage = (id: string, role: "user" | "assistant", content: string) => ({
  id,
  role,
  content,
  createdAt: new Date(),
  conversationId: "conv-1",
  userId: "user-1",
});

const makeUIMessage = (id: string, role: "user" | "assistant", text: string) => ({
  id,
  role,
  parts: [{ type: "text" as const, text }],
});

describe("loadConversationContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (validateUIMessages as jest.Mock).mockImplementation((args) => args.messages);
  });

  it("drops last db message then appends all incoming messages", async () => {
    // With 2 db messages, slice(0,-1) gives [m1]; then incoming [m2-updated, m3] appended → 3 total
    (getMessages as jest.Mock).mockResolvedValue([
      makeDbMessage("m1", "user", "hello"),
      makeDbMessage("m2", "assistant", "hi"),
    ]);

    const incoming = [makeUIMessage("m2", "assistant", "hi updated"), makeUIMessage("m3", "user", "new")];
    const result = await loadConversationContext("conv-1", incoming, "user-1");

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({ id: "m1" });
    expect(result[1]).toMatchObject({ id: "m2", parts: [{ text: "hi updated" }] });
    expect(result[2]).toMatchObject({ id: "m3" });
  });

  it("scopes the history load to the session user", async () => {
    (getMessages as jest.Mock).mockResolvedValue([]);
    await loadConversationContext("conv-1", [makeUIMessage("m1", "user", "hi")], "user-1");

    expect(getMessages).toHaveBeenCalledTimes(1);
    expect(getMessages).toHaveBeenCalledWith("conv-1", "user-1");
  });

  it("caps db messages at the CONTEXT_WINDOW (15) before merging", async () => {
    const manyMessages = Array.from({ length: 20 }, (_, i) =>
      makeDbMessage(`m${i}`, i % 2 === 0 ? "user" : "assistant", `msg ${i}`),
    );
    (getMessages as jest.Mock).mockResolvedValue(manyMessages);

    const incoming = [makeUIMessage("m19", "assistant", "last")];
    const result = await loadConversationContext("conv-1", incoming, "user-1");

    // slice(-15) gives indices 5-19 (15 items), then drop last (index 19), giving 14 + 1 incoming = 15
    expect(result.length).toBeLessThanOrEqual(15);
  });

  it("handles empty db messages with only incoming", async () => {
    (getMessages as jest.Mock).mockResolvedValue([]);
    const incoming = [makeUIMessage("m1", "user", "first message")];
    const result = await loadConversationContext("conv-1", incoming, "user-1");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "m1" });
  });

  it("passes merged messages through validateUIMessages", async () => {
    (getMessages as jest.Mock).mockResolvedValue([makeDbMessage("m1", "user", "hello")]);
    const incoming = [makeUIMessage("m1", "user", "hello"), makeUIMessage("m2", "assistant", "hi")];
    await loadConversationContext("conv-1", incoming, "user-1");
    expect(validateUIMessages).toHaveBeenCalledTimes(1);
  });
});
