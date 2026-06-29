import { classifyPendingAisles } from "@/lib/shoppingList";
import { unauthorized } from "@/lib/http";
import { getSessionUserId } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

/**
 * Assign a shopping Aisle to the user's not-yet-categorised rows and persist it.
 *
 * Client-triggered after the list loads (mirroring the Market Tip fetch) so a
 * typed-in item lands in `Other` instantly and shifts to its real aisle once
 * this returns. The caller is taken from the session — no body needed. A no-op
 * when nothing is pending. 401s when unauthenticated; 500s if the service throws.
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await getSessionUserId(req);
    if (!userId) return unauthorized();

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
