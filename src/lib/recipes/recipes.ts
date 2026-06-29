import { randomBytes } from "crypto";
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
      notes: block.notes ?? [],
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

// A short, URL-safe, unguessable token (72 bits) for public share links.
function generateShareToken() {
  return randomBytes(9).toString("base64url");
}

/**
 * Mints (or returns the existing) public share token for a recipe the user owns.
 * Owner-scoped and idempotent: once a recipe has a token it never changes, so a
 * link already shared keeps working. Throws "not found" if the recipe isn't the
 * user's, so callers can map that to a 404.
 */
export async function mintShareToken(id: string, userId: string) {
  const recipe = await prisma.recipe.findFirst({
    where: { id, userId },
    select: { shareToken: true },
  });
  if (!recipe) throw new Error("not found");
  if (recipe.shareToken) return recipe.shareToken;

  const token = generateShareToken();
  await prisma.recipe.update({ where: { id }, data: { shareToken: token } });
  return token;
}

/**
 * Resolves a public share link. Matches on the token ALONE — never userId — so
 * anyone with the link can read it, and only that one recipe is ever returned.
 * Read-only; returns null when the token is unknown.
 */
export async function getRecipeByShareToken(token: string) {
  return prisma.recipe.findUnique({ where: { shareToken: token } });
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
      notes: block.notes ?? [],
      description: block.description,
      totalTimeMinutes: block.totalTimeMinutes,
    },
    photo,
  );
}
