"use client";

import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useRecipeContext } from "@/contexts/RecipeContext";
import { useSessionContext } from "@/contexts/SessionContext";
import { TAG_SETS } from "@/lib/recipes/tagColors";
import { RecipeWithId } from "@/lib/recipes/schemas";
import { cn } from "@/lib/utils";
import { fetcher } from "@/lib/utils/index";
import { useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import RecipeCard from "./components/RecipeCard";

interface FacetSheetProps {
  label: string;
  tags: readonly string[];
  counts: Record<string, number>;
  value: string | null;
  onChange: (value: string | null) => void;
}

function FacetSheet({ label, tags, counts, value, onChange }: FacetSheetProps) {
  const [open, setOpen] = useState(false);
  const sorted = tags
    .map((t) => ({ tag: t, count: counts[t] ?? 0 }))
    .filter(({ count }) => count > 0)
    .sort((a, b) => b.count - a.count);

  // Hide the button entirely if no recipes in this cookbook match any of the canonical tags
  if (sorted.length === 0) return null;

  const buttonLabel = value ? value : label;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className={cn(
            "px-3 py-1.5 text-[12px] font-medium rounded-full border transition-colors cursor-pointer inline-flex items-center gap-1 capitalize shrink-0",
            value
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground border-border hover:text-foreground",
          )}
          aria-label={`Filter by ${label}`}
        >
          {buttonLabel}
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="bg-muted paper max-h-[70vh] flex flex-col p-4">
        <SheetTitle className="font-display italic font-medium text-[22px] text-foreground mb-3">
          {label}
        </SheetTitle>
        <div className="flex flex-col gap-1 overflow-y-auto -mx-2">
          <button
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className="text-left py-2.5 px-3 rounded-lg hover:bg-card text-sm text-muted-foreground border-b border-dashed border-border mb-1 cursor-pointer"
          >
            Clear
          </button>
          {sorted.map(({ tag, count }) => (
            <button
              key={tag}
              onClick={() => {
                onChange(tag);
                setOpen(false);
              }}
              className={cn(
                "text-left py-2.5 px-3 rounded-lg hover:bg-card flex items-center justify-between cursor-pointer",
                value === tag && "bg-card",
              )}
            >
              <span className="text-sm capitalize text-foreground">{tag}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface RecipeListProps {
  onChatClick?: () => void;
}

export default function RecipeList({ onChatClick }: RecipeListProps) {
  const { userId } = useSessionContext();
  const { setSelectedRecipe } = useRecipeContext();
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [cuisineFilter, setCuisineFilter] = useState<string | null>(null);
  const [proteinFilter, setProteinFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: recipes, isLoading } = useSWR<RecipeWithId[]>(
    userId ? `/api/recipe?userId=${userId}` : null,
    fetcher,
    { shouldRetryOnError: true, revalidateOnMount: true }
  );

  const deleteRecipe = async (recipeId: string) => {
    try {
      const res = await fetch(`/api/recipe`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId }),
      });
      if (!res.ok) throw new Error("Delete failed");
      mutate(`/api/recipe?userId=${userId}`);
      toast.success("Recipe deleted");
    } catch {
      toast.error("Failed to delete recipe");
    }
  };

  const allRecipes = recipes ?? [];
  const isEmpty = allRecipes.length === 0 && !isLoading;

  const tagCounts = allRecipes.reduce((acc, r) => {
    (r.tags ?? []).forEach((t) => { acc[t] = (acc[t] ?? 0) + 1; });
    return acc;
  }, {} as Record<string, number>);
  const tagEntries = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

  const searchLower = search.trim().toLowerCase();
  const filtered = allRecipes
    .filter((r) => !activeTag || r.tags?.includes(activeTag))
    .filter((r) => !cuisineFilter || r.tags?.includes(cuisineFilter))
    .filter((r) => !proteinFilter || r.tags?.includes(proteinFilter))
    .filter(
      (r) =>
        !searchLower ||
        r.name.toLowerCase().includes(searchLower) ||
        r.tags?.some((t) => t.toLowerCase().includes(searchLower)),
    );

  const hasMobileFilter = !!cuisineFilter || !!proteinFilter;

  return (
    <div className="h-full flex flex-col bg-muted">
      {/* Title strip */}
      <div className="px-4 sm:px-9 pt-6 pb-[18px] border-b border-border flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-6 shrink-0">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
            Yours, kept
          </div>
          <h1 className="font-display font-semibold text-[40px] text-foreground leading-none tracking-tight">
            My Cookbook
          </h1>
          <p className="font-display italic text-[15px] text-muted-foreground mt-2">
            {isEmpty
              ? "0 saved recipes — your shelf is waiting."
              : (() => {
                  const base = `${allRecipes.length} saved recipe${allRecipes.length !== 1 ? "s" : ""}`;
                  const latest = allRecipes.reduce((max, r) => {
                    const t = r.createdAt ? new Date(r.createdAt).getTime() : 0;
                    return t > max ? t : max;
                  }, 0);
                  if (!latest) return base;
                  const day = new Date(latest).toLocaleDateString("en-US", { weekday: "long" });
                  return `${base} · last added ${day}`;
                })()}
          </p>
        </div>
        {!isEmpty && (
          <label className="flex items-center gap-2 px-3 py-[7px] bg-card border border-border rounded-full sm:min-w-[200px] w-full sm:w-auto text-muted-foreground cursor-text shrink-0">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="shrink-0">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your cookbook…"
              className="flex-1 bg-transparent border-none outline-none text-[13px] placeholder:text-muted-foreground text-foreground min-w-0"
            />
          </label>
        )}
      </div>

      {/* Mobile facet row (<sm) */}
      {!isEmpty && (
        <div className="sm:hidden px-4 py-3 border-b border-border flex gap-2 items-center shrink-0">
          <FacetSheet
            label="Cuisine"
            tags={TAG_SETS.cuisine}
            counts={tagCounts}
            value={cuisineFilter}
            onChange={setCuisineFilter}
          />
          <FacetSheet
            label="Protein"
            tags={TAG_SETS.protein}
            counts={tagCounts}
            value={proteinFilter}
            onChange={setProteinFilter}
          />
        </div>
      )}

      {/* Desktop flat chip rail (sm+) */}
      {!isEmpty && tagEntries.length > 0 && (
        <div className="hidden sm:flex px-9 py-3 border-b border-border gap-2 flex-wrap items-center shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground mr-1">
            Filter
          </span>
          <button
            onClick={() => setActiveTag(null)}
            className={`px-3 py-1 text-[11px] font-medium rounded-full border transition-colors cursor-pointer ${
              !activeTag
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-transparent text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            All · {allRecipes.length}
          </button>
          {tagEntries.map(([tag, count]) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`px-3 py-1 text-[11px] font-medium rounded-full border transition-colors cursor-pointer ${
                activeTag === tag
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {tag} · {count}
            </button>
          ))}
        </div>
      )}

      {/* Grid area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-9 py-5">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
            {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : isEmpty ? (
          <CookbookEmpty onChatClick={onChatClick} />
        ) : filtered.length === 0 ? (
          <p className="font-display italic text-[14px] text-muted-foreground">
            No recipes{" "}
            {activeTag
              ? `tagged "${activeTag}"`
              : hasMobileFilter
              ? "match those filters"
              : "matching your search"}
            .
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
            {filtered.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onSelect={setSelectedRecipe}
                onDelete={deleteRecipe}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CookbookEmpty({ onChatClick }: { onChatClick?: () => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
      {/* Instructional card — spans 2 rows on desktop */}
      <div className="bg-card border-[1.5px] border-dashed border-border rounded-lg p-6 lg:row-span-2 flex flex-col gap-3.5 shadow-[0_1px_0_var(--color-border-soft)]">
        <div className="w-11 h-11 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shrink-0">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3-7 3z" />
          </svg>
        </div>
        <div>
          <div className="font-display font-semibold text-[22px] text-foreground leading-tight tracking-tight mb-1.5">
            Your cookbook is empty.
          </div>
          <div className="font-display italic text-sm text-muted-foreground leading-relaxed">
            When Ah Mah suggests a recipe you like, tap <em>Save to cookbook</em> and it lives here. Saved by you, ready when you need it.
          </div>
        </div>
        <button
          onClick={onChatClick}
          className="self-start px-3.5 py-2 text-[13px] font-semibold text-primary-foreground bg-primary border border-primary rounded-lg cursor-pointer shadow-[0_1px_0_oklch(0.46_0.135_35)] hover:opacity-90 transition-opacity"
        >
          Ask Ah Mah for a recipe →
        </button>
      </div>

      {/* Ghost cards */}
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="border-[1.5px] border-dashed border-border rounded-lg overflow-hidden flex flex-col opacity-55"
        >
          <div
            className="h-16 border-b border-border opacity-60"
            style={{
              background:
                "repeating-linear-gradient(135deg, var(--color-border-soft) 0 6px, transparent 6px 12px)",
            }}
          />
          <div className="p-4 flex flex-col gap-2">
            <div className="h-3 w-[70%] bg-border rounded" />
            <div className="h-2 w-[90%] bg-border rounded opacity-60" />
            <div className="h-2 w-[60%] bg-border rounded opacity-60" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden animate-pulse">
      <div className="h-28 bg-muted" />
      <div className="p-5 flex flex-col gap-2.5">
        <div className="h-4 w-3/4 bg-muted rounded" />
        <div className="h-3 w-full bg-muted rounded" />
        <div className="h-3 w-2/3 bg-muted rounded" />
      </div>
    </div>
  );
}
