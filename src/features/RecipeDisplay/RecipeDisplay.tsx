import { Button } from "@/components/ui/button";
import { useRecipeContext } from "@/contexts/RecipeContext";
import { RecipeIngredient, RecipeStep, RecipeWithId } from "@/lib/recipes/schemas";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

const formatAmount = (n: number) => {
  if (Number.isInteger(n)) return String(n);
  return Number(n.toFixed(2)).toString();
};

const extractInstructions = (markdown: string): string => {
  const match = markdown.match(/\*\*Instructions:\*\*\s*\n([\s\S]*)/i);
  if (match) {
    return match[1].replace(/\n?\s*-----\s*$/, "").trim();
  }
  return markdown;
};

const formatTime = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} h ${m} m` : `${h} h`;
};

function RecipeBody({ selectedRecipe }: { selectedRecipe: RecipeWithId }) {
  const [servings, setServings] = useState<number>(selectedRecipe.baseServings ?? 2);
  const baseServings = selectedRecipe.baseServings || 2;
  const ingredients = (selectedRecipe.ingredients || []) as RecipeIngredient[];
  const steps = (selectedRecipe.steps || []) as RecipeStep[];
  const scale = servings / baseServings;

  return (
    <>
      {/* Hero strip */}
      <div
        className="relative h-[180px] sm:h-[220px] border-b border-border flex items-end overflow-hidden"
        style={!selectedRecipe.imageUrl ? { background: "linear-gradient(135deg, oklch(0.55 0.13 35) 0%, oklch(0.42 0.10 30) 100%)" } : undefined}
      >
        {selectedRecipe.imageUrl ? (
          <Image
            src={selectedRecipe.imageUrl}
            alt={selectedRecipe.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 900px"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ backgroundImage: "repeating-linear-gradient(135deg, oklch(1 0 0 / 0.04) 0 12px, transparent 12px 24px)" }}
          />
        )}
        <div
          className="relative w-full px-4 sm:px-9 pt-6 pb-5 text-white"
          style={{ background: "linear-gradient(to top, oklch(0 0 0 / 0.5), transparent)" }}
        >
          {selectedRecipe.tags && selectedRecipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {selectedRecipe.tags.map((tag, i) => (
                <span
                  key={`${tag}-${i}`}
                  className="text-[10.5px] font-semibold tracking-wide px-[9px] py-[3px] rounded-full text-white border border-white/35 bg-white/[0.18] backdrop-blur-[4px]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <h1
            className="font-display font-semibold text-[28px] sm:text-[36px] leading-none tracking-tight m-0"
            style={{ textShadow: "0 2px 8px oklch(0 0 0 / 0.3)" }}
          >
            {selectedRecipe.name}
          </h1>
        </div>
        {selectedRecipe.imageUrl && selectedRecipe.photographerName && selectedRecipe.photographerUrl && (
          <a
            href={selectedRecipe.photographerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-2 right-3 font-sans text-[10px] text-white/70 hover:text-white transition-colors leading-none"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}
          >
            Photo by {selectedRecipe.photographerName}
          </a>
        )}
      </div>

      {/* Body */}
      <div className="px-4 sm:px-9 py-7 pb-12">
        {/* From Ah Mah */}
        {selectedRecipe.description && (
          <div className="flex gap-3.5 items-start mb-6 pb-5 border-b border-dashed border-border">
            <div className="relative w-10 h-10 shrink-0">
              <Image src="/granny-icon.png" alt="" fill className="object-contain" />
            </div>
            <div>
              <div className="font-sans text-[10.5px] font-bold tracking-[0.16em] uppercase text-ink-faint mb-1">
                From Ah Mah
              </div>
              <div className="font-display italic text-[15px] sm:text-base text-foreground leading-[1.5] max-w-prose">
                {selectedRecipe.description}
              </div>
            </div>
          </div>
        )}

        {/* Stat row — total time */}
        {selectedRecipe.totalTimeMinutes && (
          <div className="flex flex-wrap items-end gap-3 mb-7">
            <div className="flex flex-col px-3.5 py-2 bg-card border border-border rounded-lg shadow-[0_1px_0_var(--color-border-soft)] min-w-[78px]">
              <span className="font-sans text-[9.5px] font-bold tracking-[0.16em] uppercase text-ink-faint">
                Total time
              </span>
              <span className="font-display font-semibold text-[18px] text-foreground tabular-nums mt-0.5">
                {formatTime(selectedRecipe.totalTimeMinutes)}
              </span>
            </div>
          </div>
        )}

        {/* Ingredients — header inline with servings stepper */}
        {ingredients.length > 0 && (
          <section className="mb-9">
            <div className="flex items-center justify-between mb-1 gap-3">
              <h2 className="font-display font-semibold text-[24px] sm:text-[26px] text-foreground tracking-tight m-0">
                What to gather
              </h2>
              <div className="inline-flex items-center bg-card border border-border rounded-lg overflow-hidden shadow-[0_1px_0_var(--color-border-soft)]">
                <button
                  onClick={() => setServings((s) => Math.max(1, s - 1))}
                  disabled={servings <= 1}
                  aria-label="Decrease servings"
                  className="w-8 h-8 flex items-center justify-center text-foreground text-base font-semibold border-r border-border hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  −
                </button>
                <span className="min-w-11 text-center font-display font-semibold text-[15px] text-foreground tabular-nums">
                  {servings}
                </span>
                <button
                  onClick={() => setServings((s) => Math.min(20, s + 1))}
                  disabled={servings >= 20}
                  aria-label="Increase servings"
                  className="w-8 h-8 flex items-center justify-center text-foreground text-base font-semibold border-l border-border hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
            <ul className="list-none p-0 mt-2 border-t border-border">
              {ingredients.map((ing, i) => {
                const scaled = ing.amount != null ? ing.amount * scale : undefined;
                return (
                  <li
                    key={i}
                    className="flex items-baseline gap-3 py-2.5 border-b border-dashed border-border"
                  >
                    <span className="basis-20 sm:basis-24 shrink-0 font-mono text-[13px] font-semibold text-foreground tabular-nums text-right">
                      {scaled != null
                        ? `${formatAmount(scaled)}${ing.unit ? ` ${ing.unit}` : ""}`
                        : "—"}
                    </span>
                    <span className="flex-1 font-display text-[15px] text-foreground leading-[1.4]">
                      {ing.name}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Method */}
        <section>
          <h2 className="font-display font-semibold text-[24px] sm:text-[26px] text-foreground tracking-tight mb-4">
            Method
          </h2>
          {steps.length > 0 ? (
            <ol className="list-none p-0 flex flex-col gap-5">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="font-mono text-[13px] font-bold text-ink-faint tabular-nums pt-0.5 shrink-0 w-5 text-right">
                    {i + 1}.
                  </span>
                  <div className="flex-1">
                    {step.title && (
                      <div className="font-display font-semibold text-[15px] text-foreground mb-0.5">
                        {step.title}
                      </div>
                    )}
                    <div className="font-sans text-[14px] text-foreground leading-[1.6]">
                      {step.body}
                    </div>
                    {step.tip && (
                      <div className="mt-1.5 text-[12.5px] text-ink-faint italic">
                        {step.tip}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="recipe-prose">
              <Streamdown>{extractInstructions(selectedRecipe.instructions || "")}</Streamdown>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

export default function RecipeDisplay() {
  const { selectedRecipe, exitRecipe } = useRecipeContext();

  const copyRecipe = async () => {
    try {
      await navigator.clipboard.writeText(selectedRecipe?.instructions || "");
      toast.success("Recipe copied to clipboard!");
    } catch {
      toast.error("Failed to copy recipe");
    }
  };

  if (!selectedRecipe) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Top strip — Back / Copy */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-dashed border-border shrink-0">
        <button
          onClick={exitRecipe}
          className="font-sans text-[11.5px] font-semibold tracking-[0.14em] uppercase text-ink-faint hover:text-foreground transition-colors cursor-pointer"
          aria-label="Back to cookbook"
        >
          ← Back to cookbook
        </button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={copyRecipe}
            aria-label="Copy recipe to clipboard"
          >
            Copy
          </Button>
          <button
            onClick={exitRecipe}
            className="w-7 h-7 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 3l10 10M13 3L3 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <RecipeBody selectedRecipe={selectedRecipe} />
      </div>
    </div>
  );
}
