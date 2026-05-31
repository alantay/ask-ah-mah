"use client";

import { useSessionContext } from "@/contexts/SessionContext";
import { RecipeWithId } from "@/lib/recipes/schemas";
import { fetcher } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import RecipeCard from "./components/RecipeCard";
import { AddRecipeModal } from "./components/AddRecipeModal";
import { RecipeSidebar } from "./components/RecipeSidebar";

const HIDE_SCROLLBAR =
  "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

interface RecipeListProps {
  onChatClick?: () => void;
}

export default function RecipeList({ onChatClick }: RecipeListProps) {
  const { userId } = useSessionContext();
  const router = useRouter();
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

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
        body: JSON.stringify({ recipeId, userId }),
      });
      if (!res.ok) throw new Error("Delete failed");
      mutate(`/api/recipe?userId=${userId}`);
      toast.success("Okay, thrown away.");
    } catch {
      toast.error("Aiyah, couldn't throw it away. Try again?");
    }
  };

  const allRecipes = recipes ?? [];
  const isEmpty = allRecipes.length === 0 && !isLoading;

  const tagCounts = allRecipes.reduce((acc, r) => {
    (r.tags ?? []).forEach((t) => { acc[t] = (acc[t] ?? 0) + 1; });
    return acc;
  }, {} as Record<string, number>);
  const tagEntries = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

  const handleTagToggle = (tag: string) => {
    setActiveTags((prev) => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  };

  const searchLower = search.trim().toLowerCase();
  const filtered = allRecipes
    .filter(
      (r) =>
        activeTags.size === 0 ||
        [...activeTags].every((t) => r.tags?.includes(t)),
    )
    .filter(
      (r) =>
        !searchLower ||
        r.name.toLowerCase().includes(searchLower) ||
        r.tags?.some((t) => t.toLowerCase().includes(searchLower)),
    );

  return (
    <div className="h-full flex flex-col bg-muted paper">
      {/* Title strip — hidden on mobile; Cookbook tab below the app header
          already labels this surface and the chip rail carries `All · N`. */}
      <div className="px-4 sm:px-9 pt-3 sm:pt-6 pb-[18px] sm:border-b sm:border-border flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-6 shrink-0">
        <div className="hidden sm:block">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
            Worth cooking again
          </div>
          <h1 className="font-display font-semibold text-[40px] text-foreground leading-none tracking-tight">
            Your kept recipes
          </h1>
          <p className="font-display italic text-[15px] text-muted-foreground mt-2">
            {isEmpty
              ? "Empty for now. Cook something with Ah Mah, then save the ones you'd cook again."
              : (() => {
                  const base = `${allRecipes.length} saved`;
                  const latest = allRecipes.reduce((max, r) => {
                    const t = r.createdAt ? new Date(r.createdAt).getTime() : 0;
                    return t > max ? t : max;
                  }, 0);
                  if (!latest) return `${base}.`;
                  const day = new Date(latest).toLocaleDateString("en-US", { weekday: "long" });
                  return `${base}. Last one in: ${day}.`;
                })()}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          {!isEmpty && (
            <>
              {tagEntries.length > 0 && <button
                onClick={() => setMobileFilterOpen(true)}
                className="sm:hidden shrink-0 flex items-center gap-1.5 px-3 py-[7px] font-sans text-[13px] font-medium text-muted-foreground bg-card border border-border rounded-full cursor-pointer hover:text-foreground transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 3h10M3 6h6M5 9h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                Filter
                {activeTags.size > 0 && (
                  <span className="ml-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
                    {activeTags.size}
                  </span>
                )}
              </button>}
              <label className="flex items-center gap-2 px-3 py-[7px] bg-card border border-border rounded-full sm:min-w-[200px] flex-1 sm:flex-none text-muted-foreground cursor-text">
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
            </>
          )}
          <button
            onClick={() => setShowAdd(true)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-[7px] font-sans text-[13px] font-semibold text-primary-foreground bg-primary border border-primary rounded-full shadow-[0_1px_0_oklch(0.46_0.135_35)] hover:opacity-90 transition-opacity cursor-pointer"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Add recipe
          </button>
        </div>
      </div>

      {/* Sidebar + grid */}
      <div className="flex-1 flex overflow-hidden">
        {!isEmpty && tagEntries.length > 0 && (
          <RecipeSidebar
            tagCounts={tagCounts}
            activeTags={activeTags}
            onToggle={handleTagToggle}
            onClear={() => setActiveTags(new Set())}
            mobileOpen={mobileFilterOpen}
            onMobileClose={() => setMobileFilterOpen(false)}
          />
        )}

        <div className={`flex-1 overflow-y-auto px-4 sm:px-6 py-5 ${HIDE_SCROLLBAR}`}>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-[18px]">
              {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : isEmpty ? (
            <CookbookEmpty onChatClick={onChatClick} onPasteClick={() => setShowAdd(true)} />
          ) : filtered.length === 0 ? (
            <p className="font-display italic text-[14px] text-muted-foreground">
              {activeTags.size > 0
                ? "Nothing matches those filters. Try removing one?"
                : "Nothing matches. Try a different word?"}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-[18px]">
              {filtered.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onSelect={(r) => router.push(`/recipe/${r.id}`)}
                  onDelete={deleteRecipe}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AddRecipeModal open={showAdd} onOpenChange={setShowAdd} />
    </div>
  );
}

function CookbookEmpty({ onChatClick, onPasteClick }: { onChatClick?: () => void; onPasteClick?: () => void }) {
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
            Cookbook&rsquo;s empty for now.
          </div>
          <div className="font-display italic text-sm text-muted-foreground leading-relaxed">
            When something&rsquo;s worth a second go, tap <em>Save</em>. Ah Mah keeps it tidy.
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={onChatClick}
            className="self-start px-3.5 py-2 text-[13px] font-semibold text-primary-foreground bg-primary border border-primary rounded-lg cursor-pointer shadow-[0_1px_0_oklch(0.46_0.135_35)] hover:opacity-90 transition-opacity"
          >
            Ask Ah Mah for a recipe →
          </button>
          <button
            onClick={onPasteClick}
            className="self-start font-sans text-[12px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            or paste one you&rsquo;ve found
          </button>
        </div>
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
