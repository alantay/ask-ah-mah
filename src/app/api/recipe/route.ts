import { deleteRecipe, getRecipes, saveRecipe } from "@/lib/recipes";
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
  const { userId, name, instructions } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "userId is needed" }, { status: 400 });
  }

  const recipe = await saveRecipe({ userId, name, instructions });
  return NextResponse.json(recipe);
}

export async function DELETE(req: NextRequest) {
  const { recipeId } = await req.json();
  await deleteRecipe(recipeId);
  return NextResponse.json({ success: true });
}
