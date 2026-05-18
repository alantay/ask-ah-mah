"use client";

import { useSessionContext } from "@/contexts/SessionContext";
import RecipeDisplay from "@/features/RecipeDisplay/RecipeDisplay";
import { RecipeWithId } from "@/lib/recipes/schemas";
import { fetcher } from "@/lib/utils/index";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";

export default function RecipePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { userId } = useSessionContext();

  const { data: recipes, isLoading } = useSWR<RecipeWithId[]>(
    userId ? `/api/recipe?userId=${userId}` : null,
    fetcher,
  );

  const recipe = recipes?.find((r) => r.id === params.id);

  if (isLoading) {
    return (
      <div className="h-[calc(100dvh-3.25rem)] sm:h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] flex items-center justify-center">
        <p className="font-display italic text-muted-foreground">Pulling out the recipe…</p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="h-[calc(100dvh-3.25rem)] sm:h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] flex flex-col items-center justify-center gap-4">
        <p className="font-display italic text-muted-foreground">
          Can&rsquo;t find that one, lah.
        </p>
        <button
          onClick={() => router.push("/?tab=cookbook")}
          className="px-3.5 py-2 text-[13px] font-semibold text-primary-foreground bg-primary border border-primary rounded-lg cursor-pointer shadow-[0_1px_0_oklch(0.46_0.135_35)] hover:opacity-90 transition-opacity"
        >
          Back to cookbook
        </button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-3.25rem)] sm:h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] overflow-hidden">
      <RecipeDisplay recipe={recipe} onBack={() => router.push("/?tab=cookbook")} />
    </div>
  );
}
