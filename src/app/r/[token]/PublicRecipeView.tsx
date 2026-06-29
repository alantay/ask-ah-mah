"use client";

import RecipeDisplay from "@/features/RecipeDisplay/RecipeDisplay";
import { RecipeWithId } from "@/lib/recipes/schemas";
import Link from "next/link";

// Client wrapper for a shared recipe link. RecipeDisplay needs an `onBack`
// callback (can't cross the server boundary as a prop), so it's supplied here
// as a no-op — read-only mode hides the Back button anyway.
export function PublicRecipeView({ recipe }: { recipe: RecipeWithId }) {
  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      <header className="shrink-0 border-b border-border px-4 sm:px-6 py-2.5">
        <Link
          href="/"
          className="inline-flex items-baseline gap-1.5 font-logo text-foreground hover:opacity-80 transition-opacity"
        >
          <span className="font-semibold">Ask Ah Mah</span>
          <span className="text-micro text-muted-foreground">
            cook with what you have
          </span>
        </Link>
      </header>
      <div className="flex-1 min-h-0">
        <RecipeDisplay recipe={recipe} onBack={() => {}} readOnly />
      </div>
    </div>
  );
}
