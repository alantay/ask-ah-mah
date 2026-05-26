import { deleteRecipeForUser, getRecipes, saveRecipe, saveRecipeFromBlock } from "@/lib/recipes";
import { processRecipe } from "@/lib/recipes/recipeProcessor";
import { normalizeTags } from "@/lib/recipes/normalizeTags";
import { fetchRecipePhoto } from "@/lib/pexels/fetchPhoto";
import { missingUserId } from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return missingUserId();
  const recipes = await getRecipes(userId);
  return NextResponse.json(recipes);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, recipeId } = body;

  if (!userId) return missingUserId();

  if (body.recipe) {
    const recipe = await saveRecipeFromBlock(body.recipe, userId, recipeId ?? undefined);
    return NextResponse.json(recipe);
  }

  // Legacy markdown path
  const { name, instructions } = body;
  let metadata;
  try {
    metadata = await processRecipe(name, instructions);
  } catch (error) {
    console.error("processRecipe failed, saving without metadata:", error);
    metadata = { tags: [], baseServings: 2, ingredients: [], description: "" };
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
      description: metadata.description,
      totalTimeMinutes: metadata.totalTimeMinutes,
    },
    photo,
  );

  return NextResponse.json(recipe);
}

export async function DELETE(req: NextRequest) {
  const { recipeId, userId } = await req.json();
  if (!userId) return missingUserId();
  if (!recipeId) return NextResponse.json({ error: "recipeId is required" }, { status: 400 });
  try {
    await deleteRecipeForUser(recipeId, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }
    throw error;
  }
}
