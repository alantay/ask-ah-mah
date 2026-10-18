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

  it("replaces matching saved messages by ID before appending incoming messages", async () => {
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

    expect(result.length).toBeLessThanOrEqual(15);
  });

  it("keeps the last saved assistant reply when the incoming turn is not saved yet", async () => {
    (getMessages as jest.Mock).mockResolvedValue([
      makeDbMessage("question", "user", "Check my sauce"),
      makeDbMessage("answer", "assistant", "Reduce uncovered."),
    ]);
    const result = await loadConversationContext("conv-1", [makeUIMessage("next", "user", "For how long?")], "user-1");
    expect(result.map((message) => message.id)).toEqual(["question", "answer", "next"]);
  });

  it("tells the model to request reattachment when an older photo leaves context", async () => {
    (getMessages as jest.Mock).mockResolvedValue([
      { ...makeDbMessage("old-photo", "user", "Check this"), photo: "saved-photo" },
      ...Array.from({ length: 15 }, (_, i) => makeDbMessage(`m${i}`, "user", "More cooking questions")),
    ]);
    const result = await loadConversationContext("conv-1", [makeUIMessage("next", "user", "What about my old photo?")], "user-1");
    expect(result[0]).toMatchObject({ role: "system", parts: [{ type: "text", text: expect.stringContaining("attach it again") }] });
    expect(result.some((message) => message.id === "old-photo")).toBe(false);
    expect(result.slice(1)).toHaveLength(15);
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

  it("restores the earlier photo for a text-only follow-up after reload", async () => {
    const photo = "data:image/jpeg;base64,/9j/2Q==";
    (getMessages as jest.Mock).mockResolvedValue([
      { ...makeDbMessage("photo", "user", "Check this sauce"), photo },
      makeDbMessage("answer", "assistant", "Reduce it uncovered."),
      makeDbMessage("follow-up", "user", "For how long?"),
    ]);
    const result = await loadConversationContext("conv-1", [makeUIMessage("follow-up", "user", "For how long?")], "user-1");
    expect(result).toHaveLength(3);
    expect(result[0].parts).toContainEqual(expect.objectContaining({ type: "file", mediaType: "image/jpeg", url: photo }));
    expect(result[1].parts).toEqual([{ type: "text", text: "Reduce it uncovered." }]);
  });
});
