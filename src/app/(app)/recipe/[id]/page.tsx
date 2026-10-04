"use client";

import { Button } from "@/components/ui/button";
import { useSessionContext } from "@/contexts/SessionContext";
import { LoadError } from "@/features/shared/components/LoadError";
import RecipeDisplay from "@/features/RecipeDisplay/RecipeDisplay";
import { RecipeWithId } from "@/lib/recipes/schemas";
import { recipeKey } from "@/lib/swr/keys";
import { fetcher } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";

export default function RecipePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { userId, isLoading: sessionLoading } = useSessionContext();

  const {
    data: recipes,
    isLoading,
    error,
    isValidating,
    mutate: retryRecipes,
  } = useSWR<RecipeWithId[]>(
    userId ? recipeKey(userId) : null,
    fetcher,
  );

  const recipe = recipes?.find((r) => r.id === params.id);

  if (sessionLoading || !userId || (isLoading && !error)) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="font-display italic text-muted-foreground">
          Pulling out the recipe…
        </p>
      </div>
    );
  }

  if (error && !recipe) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <LoadError
          message="Aiyah, couldn’t load this recipe. Try again to open it."
          retrying={isValidating}
          onRetry={retryRecipes}
        />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
        <p className="font-display italic text-muted-foreground">
          Can&rsquo;t find that one, lah.
        </p>
        <Button
          variant="cta"
          onClick={() => router.push("/?tab=cookbook")}
          className="px-3.5 py-2 text-dense font-semibold"
        >
          Back to cookbook
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {error && (
        <LoadError
          message="Couldn’t refresh this recipe. You can keep reading while we try again."
          retrying={isValidating}
          onRetry={retryRecipes}
        />
      )}
      <div className="flex-1 min-h-0">
        <RecipeDisplay
          recipe={recipe}
          onBack={() => router.push("/?tab=cookbook")}
        />
      </div>
    </div>
  );
}
