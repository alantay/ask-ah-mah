import { Card, CardContent } from "@/components/ui/card";
import { useRecipeContext } from "@/contexts/RecipeContext";
import { useSessionContext } from "@/contexts/SessionContext";
import { RecipeWithId } from "@/lib/recipes/schemas";
import { fetcher } from "@/lib/utils/index";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import RecipeButton from "./components/RecipeButton";

export default function RecipeList() {
  const { userId } = useSessionContext();
  const { setSelectedRecipe } = useRecipeContext();

  const { data: recipes, isLoading } = useSWR<RecipeWithId[]>(
    userId ? `/api/recipe?userId=${userId}` : null,
    fetcher,
    {
      shouldRetryOnError: true,
      revalidateOnMount: true,
    }
  );

  const deleteRecipe = async (recipeId: string) => {
    try {
      await fetch(`/api/recipe`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId }),
      });
      // Refresh the recipes list
      mutate(`/api/recipe?userId=${userId}`);
      toast.success("Recipe deleted successfully");
    } catch (error) {
      console.error("Failed to delete recipe:", error);
      toast.error("Failed to delete recipe");
    }
  };

  return (
    <Card className="shadow-none py-2 md:py-2">
      <CardContent>
        {isLoading && <div>Looking for recipes...</div>}
        {recipes?.length === 0 ? (
          <p className="text-muted-foreground">No recipes yet</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {recipes?.map((recipe: RecipeWithId) => (
              <RecipeButton
                key={recipe.id}
                recipe={recipe}
                onSelect={setSelectedRecipe}
                onDelete={deleteRecipe}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
