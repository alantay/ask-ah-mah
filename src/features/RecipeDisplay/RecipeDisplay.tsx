import { Button } from "@/components/ui/button";
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
  // Remove only the specific ✅ and 🛒 symbols, preserving other emojis and formatting
  const cleanRecipe = recipe
    .replace(/✅\s*/g, "") // Remove checkmark and any following spaces
    .replace(/🛒\s*/g, ""); // Remove shopping cart and any following spaces

  return (
    <div className="h-full relative">
      <Button
        variant="outline"
        className="absolute right-4 top-6 cursor-pointer"
        onClick={exitRecipe}
      >
        Close Recipe
      </Button>
      <div className="h-full overflow-y-auto pt-6 pb-10 px-4 ">
        <Streamdown>{cleanRecipe}</Streamdown>
      </div>
    </div>
  );
}
