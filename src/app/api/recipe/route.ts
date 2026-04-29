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

  // Process recipe: clean instructions, generate tags, extract baseServings + structured ingredients.
  // If the model returns garbage and validation fails entirely, save the raw recipe in degraded
  // form rather than losing the user's work — they can still read it; stepper just won't render.
  let processed;
  try {
    processed = await processRecipe(name, instructions);
  } catch (error) {
    console.error("processRecipe failed, saving raw recipe:", error);
    processed = {
      cleanedInstructions: instructions,
      tags: [],
      baseServings: 2,
      ingredients: [],
    };
  }

  const recipe = await saveRecipe({
    userId,
    name,
    instructions: processed.cleanedInstructions,
    tags: processed.tags,
    recipeId,
    baseServings: processed.baseServings,
    ingredients: processed.ingredients,
  });

  return NextResponse.json(recipe);
}

export async function DELETE(req: NextRequest) {
  const { recipeId } = await req.json();
  await deleteRecipe(recipeId);
  return NextResponse.json({ success: true });
}
