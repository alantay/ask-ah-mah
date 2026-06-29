import { mintShareToken } from "@/lib/recipes";
import { getSessionUserId } from "@/lib/session";
import { unauthorized } from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";

// Mints (or returns) the public share token for a recipe the caller owns.
// Identity comes from the verified session; a request-supplied userId is
// ignored, so only the owner can mint a link for their own recipe. The public
// read path (/r/<token>, getRecipeByShareToken) stays open by design.
// Idempotent: repeated calls return the same token.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const userId = await getSessionUserId(req);
  if (!userId) return unauthorized();

  try {
    const token = await mintShareToken(id, userId);
    return NextResponse.json({ token });
  } catch (err) {
    if (err instanceof Error && err.message === "not found") {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
