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

export async function updateRecipeForUser(id: string, userId: string, block: RecipeBlock) {
  const result = await prisma.recipe.updateMany({
    where: { id, userId },
    data: {
      name: block.title,
      tags: normalizeTags(block.tags ?? []),
      baseServings: block.baseServings,
      ingredients: block.ingredients.map((ing: RecipeIngredientModel) => ({
        name: ing.name,
        category: ing.category ?? "Misc",
        amount:
          ing.amount !== undefined
            ? Number.isNaN(parseFloat(ing.amount))
              ? undefined
              : parseFloat(ing.amount)
            : undefined,
        unit: ing.unit,
        note: ing.note,
      })),
      prep: block.prep ?? [],
      steps: block.steps ?? [],
      description: block.description,
      totalTimeMinutes: block.totalTimeMinutes,
      instructions: block.description ?? "",
    },
  });
  if (result.count === 0) {
    throw new Error("not found");
  }
  return await prisma.recipe.findUnique({ where: { id } });
}

export async function saveRecipeFromBlock(block: RecipeBlock, userId: string, recipeId?: string) {
  const tags = normalizeTags(block.tags ?? []);
  const photo = await fetchRecipePhoto(block.title, tags);
  return saveRecipe(
    {
      userId,
      name: block.title,
      instructions: block.description ?? "",
      tags,
      recipeId,
      baseServings: block.baseServings,
      ingredients: block.ingredients.map((ing: RecipeIngredientModel) => ({
        name: ing.name,
        category: ing.category ?? "Misc",
        amount: ing.amount !== undefined ? (Number.isNaN(parseFloat(ing.amount)) ? undefined : parseFloat(ing.amount)) : undefined,
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
