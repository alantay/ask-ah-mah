import { updateRecipeForUser } from "@/lib/recipes";
import { missingUserId } from "@/lib/http";
import { RecipeBlockSchema } from "@/lib/recipes/schemas";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const body = await req.json();
    const { userId, recipe } = body;

    if (!userId) return missingUserId();

    const parsed = RecipeBlockSchema.safeParse(recipe);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid recipe payload" }, { status: 400 });
    }

    const updated = await updateRecipeForUser(id, userId, parsed.data);
    return NextResponse.json(updated);
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
