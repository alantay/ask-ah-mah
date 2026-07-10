"use client";

import { Button } from "@/components/ui/button";
import { useSessionContext } from "@/contexts/SessionContext";
import RecipeDisplay from "@/features/RecipeDisplay/RecipeDisplay";
import { RecipeWithId } from "@/lib/recipes/schemas";
import { fetcher } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";

export default function RecipePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { userId, isLoading: sessionLoading } = useSessionContext();

  const { data: recipes, isLoading } = useSWR<RecipeWithId[]>(
    userId ? `/api/recipe?userId=${userId}` : null,
    fetcher,
  );

  const recipe = recipes?.find((r) => r.id === params.id);

  // Treat "identity not resolved yet" as loading, not not-found — otherwise a
  // cold reload flashes "can't find that one" until the session round-trip
  // settles. With the persistent cache + optimistic userId, the recipe usually
  // resolves from cache before that. See ADR-0023.
  if (!recipe && (isLoading || sessionLoading || !userId)) {
    return (
      <div className="flex items-center justify-center">
        <p className="font-display italic text-muted-foreground">
          Pulling out the recipe…
        </p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <p className="font-display italic text-muted-foreground">
          Can&rsquo;t find that one, lah.
        </p>
        <Button
          variant="cta"
          onClick={() => router.push("/?tab=cookbook")}
          className="px-3.5 py-2 text-[13px] font-semibold"
        >
          Back to cookbook
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-hidden">
      <RecipeDisplay
        recipe={recipe}
        onBack={() => router.push("/?tab=cookbook")}
      />
    </div>
  );
}
