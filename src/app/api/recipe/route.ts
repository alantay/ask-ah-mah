import { deleteRecipeForUser, getRecipes, saveRecipe, saveRecipeFromBlock } from "@/lib/recipes";
import { processRecipe } from "@/lib/recipes/recipeProcessor";
import { normalizeTags } from "@/lib/recipes/normalizeTags";
import { fetchRecipePhoto } from "@/lib/pexels/fetchPhoto";
import { NotFoundError } from "@/lib/errors";
import { withAuth } from "@/lib/withAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAuth(async (_req, { userId }) => {
  const recipes = await getRecipes(userId);
  return NextResponse.json(recipes);
});

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const body = await req.json();
  const { recipeId } = body;

  if (body.recipe) {
    // `cooked` rides beside the block, never inside it — the block is
    // model-streamed and must not be able to set the marker (ADR-0020).
    const recipe = await saveRecipeFromBlock(
      body.recipe,
      userId,
      recipeId ?? undefined,
      body.cooked === true,
    );
    return NextResponse.json(recipe);
  }

  // Legacy markdown path
  const { name, instructions } = body;
  let metadata;
  try {
    metadata = await processRecipe(name, instructions);
  } catch (error) {
    console.error("processRecipe failed, saving without metadata:", error);
    metadata = { tags: [], baseServings: 2, ingredients: [], description: "", prep: [], notes: [] };
  }

  const tags = normalizeTags(metadata.tags ?? []);
  const photo = await fetchRecipePhoto(name, tags);
  const recipe = await saveRecipe(
    {
      userId,
      name,
      instructions,
      tags,
      recipeId,
      baseServings: metadata.baseServings,
      ingredients: metadata.ingredients,
      prep: metadata.prep,
      notes: metadata.notes,
      description: metadata.description,
      totalTimeMinutes: metadata.totalTimeMinutes,
    },
    photo,
  );

  return NextResponse.json(recipe);
});

export const DELETE = withAuth(async (req: NextRequest, { userId }) => {
  const { recipeId } = await req.json();
  if (!recipeId) return NextResponse.json({ error: "recipeId is required" }, { status: 400 });
  try {
    await deleteRecipeForUser(recipeId, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }
    throw error;
  }
});
