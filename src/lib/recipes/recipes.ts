import { fetchRecipePhoto } from "../pexels/fetchPhoto";
import type { PexelsPhoto } from "../pexels/fetchPhoto";
import { prisma } from "../db";
import { normalizeTags } from "./normalizeTags";
import { Recipe, RecipeBlock, RecipeIngredientModel } from "./schemas";

export async function getRecipes(userId: string) {
  const recipes = await prisma.recipe.findMany({
    where: { userId },
  });

  return recipes;
}

export async function saveRecipe(
  recipe: Recipe,
  photo?: PexelsPhoto | null,
) {
  return await prisma.recipe.create({
    data: {
      ...recipe,
      ...(photo && {
        imageUrl: photo.url,
        photographerName: photo.photographerName,
        photographerUrl: photo.photographerUrl,
      }),
    },
  });
}

export async function deleteRecipe(recipeId: string) {
  await prisma.recipe.delete({
    where: { id: recipeId },
  });
}

export async function deleteRecipeForUser(recipeId: string, userId: string) {
  const result = await prisma.recipe.deleteMany({
    where: { id: recipeId, userId },
  });
  if (result.count === 0) {
    throw new Error("Recipe not found or not owned by user");
  }
}

export async function saveRecipeFromBlock(block: RecipeBlock, userId: string) {
  const tags = normalizeTags(block.tags ?? []);
  const photo = await fetchRecipePhoto(block.title, tags);
  return saveRecipe(
    {
      userId,
      name: block.title,
      instructions: block.description ?? "",
      tags,
      baseServings: block.baseServings,
      ingredients: block.ingredients.map((ing: RecipeIngredientModel) => ({
        name: ing.name,
        category: ing.category ?? "Misc",
        amount: ing.amount ? parseFloat(ing.amount) || undefined : undefined,
        unit: ing.unit,
        note: ing.note,
      })),
      prep: block.prep ?? [],
      steps: block.steps,
      description: block.description,
      totalTimeMinutes: block.totalTimeMinutes,
    },
    photo,
  );
}
