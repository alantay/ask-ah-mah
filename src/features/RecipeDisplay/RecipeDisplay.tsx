import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRecipeContext } from "@/contexts/RecipeContext";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

export default function RecipeDisplay() {
  const { selectedRecipe, setSelectedRecipe, exitRecipe } = useRecipeContext();

  const copyRecipe = async () => {
    try {
      await navigator.clipboard.writeText(selectedRecipe?.instructions || "");
      toast.success("Recipe copied to clipboard!");
    } catch {
      toast.error("Failed to copy recipe");
    }
  };

  return (
    <div className="h-full relative">
      <div className="absolute right-4 top-4 flex gap-2">
        <Button
          variant="outline"
          className="cursor-pointer"
          onClick={copyRecipe}
          aria-label="Copy recipe to clipboard"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M19 2C19.5304 2 20.0391 2.21071 20.4142 2.58579C20.7893 2.96086 21 3.46957 21 4V16C21 16.5304 20.7893 17.0391 20.4142 17.4142C20.0391 17.7893 19.5304 18 19 18H17V20C17 20.5304 16.7893 21.0391 16.4142 21.4142C16.0391 21.7893 15.5304 22 15 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H7V4C7 3.46957 7.21071 2.96086 7.58579 2.58579C7.96086 2.21071 8.46957 2 9 2H19ZM15 8H5V20H15V8ZM10 15C10.2652 15 10.5196 15.1054 10.7071 15.2929C10.8946 15.4804 11 15.7348 11 16C11 16.2652 10.8946 16.5196 10.7071 16.7071C10.5196 16.8946 10.2652 17 10 17H8C7.73478 17 7.48043 16.8946 7.29289 16.7071C7.10536 16.5196 7 16.2652 7 16C7 15.7348 7.10536 15.4804 7.29289 15.2929C7.48043 15.1054 7.73478 15 8 15H10ZM19 4H9V6H15C15.5304 6 16.0391 6.21071 16.4142 6.58579C16.7893 6.96086 17 7.46957 17 8V16H19V4ZM12 11C12.2549 11.0003 12.5 11.0979 12.6854 11.2728C12.8707 11.4478 12.9822 11.687 12.9972 11.9414C13.0121 12.1958 12.9293 12.4464 12.7657 12.6418C12.6021 12.8373 12.3701 12.9629 12.117 12.993L12 13H8C7.74512 12.9997 7.49997 12.9021 7.31463 12.7272C7.1293 12.5522 7.01777 12.313 7.00283 12.0586C6.98789 11.8042 7.07067 11.5536 7.23426 11.3582C7.39786 11.1627 7.6299 11.0371 7.883 11.007L8 11H12Z"
              fill="currentColor"
            />
          </svg>
        </Button>
        <Button
          variant="outline"
          className="cursor-pointer gap-1"
          onClick={exitRecipe}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 3C12.2549 3.00028 12.5 3.09788 12.6854 3.27285C12.8707 3.44782 12.9822 3.68695 12.9972 3.94139C13.0121 4.19584 12.9293 4.44638 12.7657 4.64183C12.6021 4.83729 12.3701 4.9629 12.117 4.993L12 5H7C6.75507 5.00003 6.51866 5.08996 6.33563 5.25272C6.15259 5.41547 6.03566 5.63975 6.007 5.883L6 6V18C6.00003 18.2449 6.08996 18.4813 6.25272 18.6644C6.41547 18.8474 6.63975 18.9643 6.883 18.993L7 19H11.5C11.7549 19.0003 12 19.0979 12.1854 19.2728C12.3707 19.4478 12.4822 19.687 12.4972 19.9414C12.5121 20.1958 12.4293 20.4464 12.2657 20.6418C12.1021 20.8373 11.8701 20.9629 11.617 20.993L11.5 21H7C6.23479 21 5.49849 20.7077 4.94174 20.1827C4.38499 19.6578 4.04989 18.9399 4.005 18.176L4 18V6C3.99996 5.23479 4.29233 4.49849 4.81728 3.94174C5.34224 3.38499 6.06011 3.04989 6.824 3.005L7 3H12ZM17.707 8.464L20.535 11.293C20.7225 11.4805 20.8278 11.7348 20.8278 12C20.8278 12.2652 20.7225 12.5195 20.535 12.707L17.707 15.536C17.5194 15.7235 17.2649 15.8288 16.9996 15.8287C16.7344 15.8286 16.48 15.7231 16.2925 15.5355C16.105 15.3479 15.9997 15.0934 15.9998 14.8281C15.9999 14.5629 16.1054 14.3085 16.293 14.121L17.414 13H12C11.7348 13 11.4804 12.8946 11.2929 12.7071C11.1054 12.5196 11 12.2652 11 12C11 11.7348 11.1054 11.4804 11.2929 11.2929C11.4804 11.1054 11.7348 11 12 11H17.414L16.293 9.879C16.1054 9.69149 15.9999 9.43712 15.9998 9.17185C15.9997 8.90658 16.105 8.65214 16.2925 8.4645C16.48 8.27686 16.7344 8.17139 16.9996 8.1713C17.2649 8.1712 17.5194 8.27649 17.707 8.464Z"
              fill="currentColor"
            />
          </svg>
          Exit
          <span className="hidden md:block">Recipe</span>
        </Button>
      </div>

      <div className="h-full overflow-y-auto pt-15 xl:pt-4 pb-10 px-4 ">
        {selectedRecipe?.tags && selectedRecipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedRecipe.tags.map((tag: string) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        <Streamdown>{selectedRecipe?.instructions || ""}</Streamdown>
      </div>
    </div>
  );
}
