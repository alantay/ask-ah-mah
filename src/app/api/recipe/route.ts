import { deleteRecipe, getRecipes, saveRecipe } from "@/lib/recipes";
import { processRecipe } from "@/lib/recipes/recipeProcessor";
import { RecipeIngredientModel } from "@/lib/recipes/schemas";
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
  const body = await req.json();
  const { userId, recipeId } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId is needed" }, { status: 400 });
  }

  // New structured path: body.recipe contains the fully-structured object
  if (body.recipe) {
    const r = body.recipe;
    const recipe = await saveRecipe({
      userId,
      name: r.title,
      instructions: r.description ?? "",  // store description as instructions fallback for legacy reads
      tags: r.tags ?? [],
      recipeId,
      baseServings: r.baseServings,
      ingredients: r.ingredients.map(
        (ing: RecipeIngredientModel) => ({
          name: ing.name,
          category: ing.category,
          // Convert string amount to number for storage (legacy RecipeIngredient type uses number)
          amount: ing.amount ? parseFloat(ing.amount) || undefined : undefined,
          unit: ing.unit,
          note: ing.note,
        })
      ),
      steps: r.steps,
      description: r.description,
      totalTimeMinutes: r.totalTimeMinutes,
    });
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
