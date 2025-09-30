import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSessionContext } from "@/contexts/SessionContext";
import { RecipeWithId } from "@/lib/recipes/schemas";
import { fetcher } from "@/lib/utils/index";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import { getRandomRecipeProcessingMessage, isTempId } from "../Chat/constants";

export default function RecipeList({
  setSelectedRecipe,
}: {
  setSelectedRecipe: (recipe: RecipeWithId) => void;
}) {
  const { userId } = useSessionContext();

  const { data: recipes, isLoading } = useSWR<RecipeWithId[]>(
    userId ? `/api/recipe?userId=${userId}` : null,
    fetcher,
    {
      shouldRetryOnError: true,
      revalidateOnMount: true,
    }
  );
  const showRecipe = (r: RecipeWithId) => {
    setSelectedRecipe(r);
  };

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
    <Card className="shadow-none">
      <CardContent>
        {isLoading && <div>Looking for recipes...</div>}
        {recipes?.length === 0 ? (
          <p className="text-muted-foreground">No recipes yet</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {recipes?.map((recipe: RecipeWithId) => {
              const isOptimistic = isTempId(recipe.id);
              return (
                <div key={recipe.id} className="w-full flex border-b py-2">
                  <Button
                    variant="ghost"
                    className="flex-1 items-start text-wrap break-words whitespace-normal h-auto cursor-pointer rounded p-2 flex-col"
                    onClick={() => showRecipe(recipe)}
                    disabled={isOptimistic}
                  >
                    <div className="font-medium text-left">{recipe.name}</div>
                    {isOptimistic && (
                      <div className="animate-pulse text-sm text-muted-foreground text-left">
                        {getRandomRecipeProcessingMessage()}
                      </div>
                    )}
                    {recipe.tags && recipe.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {recipe.tags.slice(0, 4).map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs px-2 py-0.5 border border-background"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {recipe.tags.length > 4 && (
                          <Badge
                            variant="secondary"
                            className="text-xs px-2 py-0.5"
                          >
                            +{recipe.tags.length - 4}
                          </Badge>
                        )}
                      </div>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    className="cursor-pointer"
                    disabled={isOptimistic}
                    onClick={() => deleteRecipe(recipe.id)}
                  >
                    <svg
                      className="text-gray-400 hover:text-gray-500"
                      width="16"
                      height="16"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M14.3479 14.8489C14.1228 15.0739 13.8176 15.2003 13.4994 15.2003C13.1811 15.2003 12.8759 15.0739 12.6509 14.8489L9.99989 11.8189L7.34889 14.8479C7.23779 14.9608 7.10544 15.0506 6.95946 15.1121C6.81349 15.1736 6.65677 15.2056 6.49837 15.2063C6.33996 15.2069 6.18299 15.1762 6.03652 15.1159C5.89004 15.0555 5.75696 14.9668 5.64495 14.8548C5.53294 14.7428 5.44421 14.6097 5.38389 14.4632C5.32357 14.3168 5.29285 14.1598 5.29349 14.0014C5.29414 13.843 5.32614 13.6863 5.38765 13.5403C5.44916 13.3943 5.53897 13.262 5.65189 13.1509L8.40989 10.0009L5.65089 6.84887C5.53797 6.73777 5.44816 6.60542 5.38665 6.45944C5.32514 6.31346 5.29314 6.15675 5.29249 5.99834C5.29185 5.83994 5.32257 5.68297 5.38289 5.5365C5.44321 5.39002 5.53194 5.25694 5.64395 5.14493C5.75596 5.03292 5.88905 4.94419 6.03552 4.88387C6.18199 4.82355 6.33896 4.79282 6.49737 4.79347C6.65577 4.79411 6.81249 4.82611 6.95846 4.88763C7.10444 4.94914 7.23679 5.03895 7.34789 5.15187L9.99989 8.18287L12.6509 5.15187C12.762 5.03895 12.8943 4.94914 13.0403 4.88763C13.1863 4.82611 13.343 4.79411 13.5014 4.79347C13.6598 4.79282 13.8168 4.82355 13.9633 4.88387C14.1097 4.94419 14.2428 5.03292 14.3548 5.14493C14.4668 5.25694 14.5556 5.39002 14.6159 5.5365C14.6762 5.68297 14.7069 5.83994 14.7063 5.99834C14.7056 6.15675 14.6736 6.31346 14.6121 6.45944C14.5506 6.60542 14.4608 6.73777 14.3479 6.84887L11.5899 10.0009L14.3479 13.1509C14.4595 13.2623 14.548 13.3947 14.6084 13.5403C14.6688 13.686 14.6998 13.8422 14.6998 13.9999C14.6998 14.1576 14.6688 14.3137 14.6084 14.4594C14.548 14.6051 14.4595 14.7374 14.3479 14.8489Z"
                        fill="currentColor"
                      />
                    </svg>
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
