import { prisma } from "../db";
import { Recipe } from "./schemas";

export async function getRecipes(userId: string) {
  const recipes = await prisma.recipe.findMany({
    where: { userId },
  });

  return recipes;
}

export async function saveRecipe(recipe: Recipe) {
  return await prisma.recipe.create({
    data: recipe,
  });
}

export async function deleteRecipe(recipeId: string) {
  await prisma.recipe.delete({
    where: { id: recipeId },
  });
}
