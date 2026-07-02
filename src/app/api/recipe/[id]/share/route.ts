import { mintShareToken } from "@/lib/recipes";
import { withAuthDynamic } from "@/lib/withAuth";
import { NextResponse } from "next/server";

export const POST = withAuthDynamic<{ id: string }>(async (_req, { userId, params }) => {
  const { id } = await params;

  try {
    const token = await mintShareToken(id, userId);
    return NextResponse.json({ token });
  } catch (err) {
    if (err instanceof Error && err.message === "not found") {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
