import { unauthorized } from "@/lib/http";
import { getSessionUserId } from "@/lib/session";
import { parseRecipeText } from "@/lib/recipes/parseRecipeText";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Model-calling endpoint: gate on a verified session so anonymous callers
  // can't loop it and burn token budget. Anonymous visitors still carry a
  // session cookie, so the app's own calls are unaffected.
  const userId = await getSessionUserId(req);
  if (!userId) return unauthorized();

  const body = await req.json();
  const { text } = body;

  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  try {
    const block = await parseRecipeText(text.trim());

    if (!block.ingredients.length || !block.steps.length) {
      return NextResponse.json(
        { error: "Hmm, couldn't find a recipe in that text. Try cleaning it up?" },
        { status: 422 },
      );
    }

    return NextResponse.json(block);
  } catch {
    return NextResponse.json(
      { error: "Couldn't read that as a recipe. Try again?" },
      { status: 422 },
    );
  }
}
