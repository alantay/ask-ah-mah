import { UnsplashPhoto } from "../unsplash/fetchPhoto";
import { prisma } from "../db";
import { Recipe } from "./schemas";

export async function getRecipes(userId: string) {
  const recipes = await prisma.recipe.findMany({
    where: { userId },
  });

  return recipes;
}

export async function saveRecipe(
  recipe: Recipe,
  photo?: UnsplashPhoto | null,
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
