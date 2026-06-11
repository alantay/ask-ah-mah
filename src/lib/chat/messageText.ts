import { UIMessage } from "ai";

/** Concatenate the text parts of a UIMessage into a plain string. */
export function messageText(message: UIMessage): string {
  return (message.parts ?? [])
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join(" ")
    .trim();
}

/** Text of the most recent user message in a list, or "" if none. */
export function latestUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return messageText(messages[i]);
  }
  return "";
}
