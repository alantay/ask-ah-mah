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

  // Process recipe: clean instructions, generate tags, extract baseServings + structured ingredients
  const { cleanedInstructions, tags, baseServings, ingredients } =
    await processRecipe(name, instructions);

  const recipe = await saveRecipe({
    userId,
    name,
    instructions: cleanedInstructions,
    tags,
    recipeId,
    baseServings,
    ingredients,
  });

  return NextResponse.json(recipe);
}

export async function DELETE(req: NextRequest) {
  const { recipeId } = await req.json();
  await deleteRecipe(recipeId);
  return NextResponse.json({ success: true });
}
