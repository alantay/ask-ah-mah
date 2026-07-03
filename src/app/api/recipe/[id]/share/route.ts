import { NotFoundError } from "@/lib/errors";
import { mintShareToken } from "@/lib/recipes";
import { withAuthDynamic } from "@/lib/withAuth";
import { NextResponse } from "next/server";

// Mints (or returns) the public share token for a recipe the caller owns.
// Identity comes from the verified session; a request-supplied userId is
// ignored, so only the owner can mint a link for their own recipe. The public
// read path (/r/<token>, getRecipeByShareToken) stays open by design.
// Idempotent: repeated calls return the same token.
export const POST = withAuthDynamic<{ id: string }>(async (_req, { userId, params }) => {
  const { id } = await params;

  try {
    const token = await mintShareToken(id, userId);
    return NextResponse.json({ token });
  } catch (err) {
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
