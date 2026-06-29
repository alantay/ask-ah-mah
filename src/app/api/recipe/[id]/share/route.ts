import { mintShareToken } from "@/lib/recipes";
import { missingUserId } from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";

// Mints (or returns) the public share token for a recipe the caller owns.
// Idempotent: repeated calls return the same token.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const { userId } = await req.json();
    if (!userId) return missingUserId();

    const token = await mintShareToken(id, userId);
    return NextResponse.json({ token });
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }
    if (err instanceof Error && err.message === "not found") {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
