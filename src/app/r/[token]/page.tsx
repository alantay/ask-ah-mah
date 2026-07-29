import { getRecipeByShareToken } from "@/lib/recipes";
import { RecipeWithId } from "@/lib/recipes/schemas";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { PublicRecipeView } from "./PublicRecipeView";

// A public, unauthenticated, read-only view of a single shared recipe. Resolved
// by share token alone — never userId — so the link works for anyone, and only
// the one recipe behind that token is ever exposed.

// Next calls generateMetadata and the page separately, and both need the
// recipe. cache() is request-scoped, so they share one read instead of two —
// and, more than a saved round-trip, it closes the window where a delete
// landing between them would leave the tab naming a dish the page says is
// gone.
const getSharedRecipe = cache(getRecipeByShareToken);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;

  let recipe: Awaited<ReturnType<typeof getRecipeByShareToken>>;
  try {
    recipe = await getSharedRecipe(token);
  } catch {
    // A database outage shouldn't surface as a metadata crash. The page's own
    // read hits the same cached failure and hands off to the error boundary,
    // which is the surface built to explain it. Mirrors opengraph-image.tsx.
    // noindex is kept: it's the one guarantee a share URL must not lose.
    return { robots: { index: false, follow: false } };
  }

  // Kept in step with r/not-found.tsx, which renders for this same case — the
  // tab must not say "Recipe not found" while the page says "put away". Both
  // set it because which one wins is Next's business, not ours.
  if (!recipe) return { title: "This one's been put away" };

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
  const recipe = await getSharedRecipe(token);
  if (!recipe) notFound();

  // getRecipeByShareToken already omits owner-scoped fields; userId is supplied
  // empty only to satisfy the type — readOnly mode never reads it.
  return (
    <PublicRecipeView
      recipe={{ ...recipe, userId: "" } as unknown as RecipeWithId}
    />
  );
}
