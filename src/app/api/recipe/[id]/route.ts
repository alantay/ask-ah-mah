import { NotFoundError } from "@/lib/errors";
import { updateRecipeForUser } from "@/lib/recipes";
import { RecipeBlockSchema } from "@/lib/recipes/schemas";
import { withAuthDynamic } from "@/lib/withAuth";
import { NextRequest, NextResponse } from "next/server";

export const PATCH = withAuthDynamic<{ id: string }>(async (req: NextRequest, { userId, params }) => {
  const { id } = await params;

  try {
    const body = await req.json();
    const { recipe } = body;

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
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
