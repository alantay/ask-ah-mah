import { classifyPendingAisles } from "@/lib/shoppingList";
import { missingUserId } from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";

/**
 * Assign a shopping Aisle to the user's not-yet-categorised rows and persist it.
 *
 * Body: `{ userId: string }`. Client-triggered after the list loads (mirroring
 * the Market Tip fetch) so a typed-in item lands in `Other` instantly and
 * shifts to its real aisle once this returns. A no-op when nothing is pending.
 * 400s on malformed JSON or a missing `userId`; 500s if the service throws.
 */
export async function POST(req: NextRequest) {
  try {
    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const userId = (payload as { userId?: unknown })?.userId;
    if (!userId || typeof userId !== "string") return missingUserId();

    await classifyPendingAisles(userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to classify shopping list aisles", error);
    return NextResponse.json(
      { error: "Failed to classify shopping list aisles" },
      { status: 500 },
    );
  }
}
