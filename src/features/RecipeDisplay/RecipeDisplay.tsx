import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Streamdown } from "streamdown";

export default function RecipeDisplay({
  recipe,
  exitRecipe,
  className,
}: {
  recipe: string;
  exitRecipe: () => void;
  className?: string;
}) {
  return (
    <div className={cn("h-full relative", className)}>
      <Button
        variant="outline"
        className="absolute right-4 top-6 cursor-pointer"
        onClick={exitRecipe}
      >
        Close Recipe
      </Button>
      <div className="h-full overflow-y-auto pt-6 pb-10 px-4 ">
        <Streamdown>{recipe}</Streamdown>
      </div>
    </div>
  );
}
