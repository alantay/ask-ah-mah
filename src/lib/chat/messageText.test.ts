import { UIMessage } from "ai";
import { latestUserText, messageText } from "./messageText";

const msg = (role: string, ...texts: string[]): UIMessage =>
  ({
    id: Math.random().toString(),
    role,
    parts: texts.map((text) => ({ type: "text", text })),
  }) as unknown as UIMessage;

describe("messageText", () => {
  it("joins multiple text parts with a space", () => {
    expect(messageText(msg("user", "I have", "chicken broth"))).toBe(
      "I have chicken broth",
    );
  });

  it("ignores non-text parts", () => {
    const m = {
      id: "1",
      role: "user",
      parts: [
        { type: "text", text: "hello" },
        { type: "tool-call", toolName: "x" },
      ],
    } as unknown as UIMessage;
    expect(messageText(m)).toBe("hello");
  });

  it("returns '' when there are no parts", () => {
    expect(messageText({ id: "1", role: "user" } as UIMessage)).toBe("");
  });
});

describe("latestUserText", () => {
  it("returns the text of the most recent user message", () => {
    const messages = [
      msg("user", "first"),
      msg("assistant", "reply"),
      msg("user", "second"),
    ];
    expect(latestUserText(messages)).toBe("second");
  });

  it("skips trailing assistant messages", () => {
    const messages = [msg("user", "question"), msg("assistant", "answer")];
    expect(latestUserText(messages)).toBe("question");
  });

  it("returns '' when there is no user message", () => {
    expect(latestUserText([msg("assistant", "hi")])).toBe("");
    expect(latestUserText([])).toBe("");
  });
});
