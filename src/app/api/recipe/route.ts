import { deleteRecipe, getRecipes, saveRecipe } from "@/lib/recipes";
import { processRecipe } from "@/lib/recipes/recipeProcessor";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }
  const recipes = await getRecipes(userId);
  return NextResponse.json(recipes);
}

export async function POST(req: NextRequest) {
  const { userId, name, instructions, recipeId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "userId is needed" }, { status: 400 });
  }

  // Extract metadata (tags, baseServings, ingredients). If the model fails,
  // save with empty metadata — the recipe text itself is the user's actual work.
  let metadata;
  try {
    metadata = await processRecipe(name, instructions);
  } catch (error) {
    console.error("processRecipe failed, saving without metadata:", error);
    metadata = { tags: [], baseServings: 2, ingredients: [], description: "" };
  }

  const recipe = await saveRecipe({
    userId,
    name,
    instructions,
    tags: metadata.tags,
    recipeId,
    baseServings: metadata.baseServings,
    ingredients: metadata.ingredients,
    description: metadata.description,
    totalTimeMinutes: metadata.totalTimeMinutes,
  });

  return NextResponse.json(recipe);
}

export async function DELETE(req: NextRequest) {
  const { recipeId } = await req.json();
  await deleteRecipe(recipeId);
  return NextResponse.json({ success: true });
}
