import { RecipeWithId } from "@/lib/recipes/schemas";
import { getRandomRecipeProcessingMessage, isTempId } from "@/features/Chat/constants";

interface RecipeCardProps {
  recipe: RecipeWithId;
  onSelect: (recipe: RecipeWithId) => void;
  onDelete: (recipeId: string) => void;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} h ${m} m` : `${h} h`;
}

export default function RecipeCard({ recipe, onSelect, onDelete }: RecipeCardProps) {
  const isOptimistic = isTempId(recipe.id);
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients as { name: string }[] : [];
  const servings = recipe.baseServings ?? 2;

  const blurb = recipe.description ||
    (ingredients.length > 0
      ? ingredients.slice(0, 4).map((i) => i.name).join(", ") + (ingredients.length > 4 ? "…" : ".")
      : `${servings} serving${servings !== 1 ? "s" : ""}.`);

  return (
    <article
      className="bg-card border border-border rounded-lg overflow-hidden flex flex-col relative group cursor-pointer shadow-[0_1px_0_var(--color-border-soft),0_18px_28px_-24px_oklch(0.3_0.05_50/0.5)] transition-shadow hover:shadow-[0_1px_0_var(--color-border-soft),0_24px_36px_-24px_oklch(0.3_0.05_50/0.6)]"
      onClick={() => !isOptimistic && onSelect(recipe)}
    >
      {/* Delete button — revealed on hover */}
      <button
        className="absolute top-2 right-2 z-20 p-1.5 rounded-md bg-card border border-border opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-muted-foreground hover:text-foreground"
        onClick={(e) => { e.stopPropagation(); onDelete(recipe.id); }}
        aria-label={`Delete ${recipe.name}`}
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Image strip */}
      <div
        className="h-28 border-b border-border flex items-center justify-center shrink-0"
        style={{
          background:
            "repeating-linear-gradient(135deg, oklch(0.84 0.05 60) 0 8px, oklch(0.80 0.05 60) 8px 16px)",
        }}
      >
        {isOptimistic && (
          <span className="font-mono text-[10px] tracking-widest text-foreground/40 uppercase">
            Saving…
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 gap-2.5">
        {isOptimistic ? (
          <div className="animate-pulse font-display italic text-sm text-muted-foreground">
            {getRandomRecipeProcessingMessage()}
          </div>
        ) : (
          <>
            <div className="font-display font-semibold text-xl text-foreground leading-tight tracking-tight group-hover:text-primary transition-colors line-clamp-2">
              {recipe.name}
            </div>
            <div className="font-display italic text-[13.5px] text-muted-foreground leading-[1.45] line-clamp-2">
              {blurb}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-auto pt-2.5 border-t border-dashed border-border flex items-center gap-2.5 flex-wrap">
          {recipe.totalTimeMinutes && (
            <span className="flex items-center gap-1 font-mono text-[11px] text-ink-faint shrink-0">
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none" className="shrink-0">
                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M8 4.5V8l2.5 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {formatDuration(recipe.totalTimeMinutes)}
            </span>
          )}
          {recipe.tags?.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[11px] font-medium px-2 py-0.5 border border-border rounded-full text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
