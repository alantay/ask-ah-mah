import { getRecipeByShareToken } from "@/lib/recipes";
import { RecipeWithId } from "@/lib/recipes/schemas";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicRecipeView } from "./PublicRecipeView";

// A public, unauthenticated, read-only view of a single shared recipe. Resolved
// by share token alone — never userId — so the link works for anyone, and only
// the one recipe behind that token is ever exposed.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const recipe = await getRecipeByShareToken(token);
  if (!recipe) return { title: "Recipe not found" };

  const title = recipe.name;
  const description =
    recipe.description ?? `${recipe.name} — shared from Ask Ah Mah.`;
  const images = recipe.imageUrl ? [recipe.imageUrl] : undefined;

  return {
    title,
    description,
    // Link-only sharing: these URLs are protected solely by an unguessable
    // token, so keep them out of search indexes.
    robots: { index: false, follow: false },
    openGraph: { title, description, images, type: "article" },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      images,
    },
  };
}

export default async function SharedRecipePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const recipe = await getRecipeByShareToken(token);
  if (!recipe) notFound();

  // getRecipeByShareToken already omits owner-scoped fields; userId is supplied
  // empty only to satisfy the type — readOnly mode never reads it.
  return (
    <PublicRecipeView
      recipe={{ ...recipe, userId: "" } as unknown as RecipeWithId}
    />
  );
}
