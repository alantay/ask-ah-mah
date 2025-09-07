import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const model = google("gemini-1.5-flash");

  const { messages } = await req.json();

  const result = await generateText({
    model,
    messages: [
      {
        role: "system",
        content:
          "You are Ask Ah Mah, a warm and friendly cooking assistant. Be encouraging, use simple language, and always help beginners feel confident about cooking.",
      },
      {
        role: "user",
        content: messages,
      },
    ],
  });
  return NextResponse.json({ message: result.text });
}
