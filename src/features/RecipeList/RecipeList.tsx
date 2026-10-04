"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useSessionContext } from "@/contexts/SessionContext";
import { LoadError } from "@/features/shared/components/LoadError";
import { Eyebrow } from "@/features/shared/components/recipe";
import { RecipeWithId } from "@/lib/recipes/schemas";
import { recipeKey } from "@/lib/swr/keys";
import { mutateResource } from "@/lib/swr/mutateResource";
import { fetcher } from "@/lib/utils";
import { useRef, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import { AddRecipeModal } from "./components/AddRecipeModal";
import RecipeCard from "./components/RecipeCard";
import { RecipeSidebar } from "./components/RecipeSidebar";
import { lastSavedLabel } from "./utils/lastSavedLabel";

const HIDE_SCROLLBAR =
  "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

interface RecipeListProps {
  onChatClick?: () => void;
}

export default function RecipeList({ onChatClick }: RecipeListProps) {
  const { userId } = useSessionContext();
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RecipeWithId | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const deleteTrigger = useRef<HTMLButtonElement | null>(null);
  const addButton = useRef<HTMLButtonElement | null>(null);
  const deleteSucceeded = useRef(false);

  const {
    data: recipes,
    isLoading,
    error,
    isValidating,
    mutate: retryRecipes,
  } = useSWR<RecipeWithId[]>(
    userId ? recipeKey(userId) : null,
    fetcher,
    { shouldRetryOnError: true, revalidateOnMount: true },
  );

  const deleteRecipe = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError(false);
    try {
      const res = await mutateResource({
        url: "/api/recipe",
        method: "DELETE",
        body: { recipeId: deleteTarget.id },
      });
      if (!res.ok) throw new Error("Delete failed");
      if (userId) mutate(recipeKey(userId));
      deleteSucceeded.current = true;
      setDeleteTarget(null);
      toast.success("Okay, thrown away.");
    } catch {
      setDeleteError(true);
    } finally {
      setDeleting(false);
    }
  };

  const allRecipes = recipes ?? [];
  const isEmpty = allRecipes.length === 0 && !isLoading && !error;

  const tagCounts = allRecipes.reduce(
    (acc, r) => {
      (r.tags ?? []).forEach((t) => {
        acc[t] = (acc[t] ?? 0) + 1;
      });
      return acc;
    },
    {} as Record<string, number>,
  );
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
      {error && (
        <div className="px-4 sm:px-9 pt-4">
          <LoadError
            message="Aiyah, couldn’t load your cookbook. Try again to bring your recipes back."
            retrying={isValidating}
            onRetry={retryRecipes}
          />
        </div>
      )}
      {/* Title strip — hidden on mobile; Cookbook tab below the app header
          already labels this surface and the chip rail carries `All · N`. */}
      <div className="px-4 sm:px-9 pt-3 sm:pt-6 pb-[18px] sm:border-b sm:border-border flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-6 shrink-0">
        <div className="hidden sm:block">
          <Eyebrow className="block mb-1.5">Worth cooking again</Eyebrow>
          <h1 className="font-display font-semibold text-display text-foreground leading-none tracking-tight">
            Your kept recipes
          </h1>
          <p className="font-display italic text-emphasis text-muted-foreground mt-2">
            {isEmpty
              ? "Empty for now. Cook something with Ah Mah, then save the ones you'd cook again."
              : (() => {
                  const base = `${allRecipes.length} saved`;
                  const latest = allRecipes.reduce((max, r) => {
                    const t = r.createdAt ? new Date(r.createdAt).getTime() : 0;
                    return t > max ? t : max;
                  }, 0);
                  if (!latest) return `${base}.`;
                  return `${base}. Last one in: ${lastSavedLabel(new Date(latest))}.`;
                })()}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto shrink-0">
          {!isEmpty && (
            <>
              {tagEntries.length > 0 && (
                <button
                  onClick={() => setMobileFilterOpen(true)}
                  aria-label="Filter"
                  className="sm:hidden shrink-0 flex items-center gap-1.5 px-3 py-[7px] font-sans text-dense font-medium text-muted-foreground bg-card border border-border rounded-full cursor-pointer hover:text-foreground transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M1 3h10M3 6h6M5 9h2"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                  </svg>
                  {activeTags.size > 0 && (
                    <span className="ml-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
                      {activeTags.size}
                    </span>
                  )}
                </button>
              )}
              <label className="flex items-center gap-2 px-3 py-[7px] bg-card border border-border rounded-full min-w-0 sm:min-w-[200px] flex-1 sm:flex-none text-muted-foreground cursor-text">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="shrink-0"
                >
                  <circle
                    cx="7"
                    cy="7"
                    r="4.5"
                    stroke="currentColor"
                    strokeWidth="1.4"
                  />
                  <path
                    d="m10.5 10.5 3 3"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search your cookbook…"
                  className="flex-1 bg-transparent border-none outline-none text-dense placeholder:text-muted-foreground text-foreground min-w-0"
                />
              </label>
            </>
          )}
          <Button
            variant="cta"
            onClick={() => setShowAdd(true)}
            ref={addButton}
            aria-label="Add recipe"
            className="shrink-0 gap-1.5 px-3 py-[7px] font-sans text-dense font-semibold rounded-full"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className="size-[12px]"
            >
              <path
                d="M6 1v10M1 6h10"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            <span className="hidden sm:inline">Add recipe</span>
          </Button>
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

        <div
          className={`flex-1 overflow-y-auto px-4 sm:px-6 py-5 ${HIDE_SCROLLBAR}`}
        >
          {isLoading && !error ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-[18px]">
              {[0, 1, 2].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : isEmpty ? (
            <CookbookEmpty
              onChatClick={onChatClick}
              onPasteClick={() => setShowAdd(true)}
            />
          ) : error && !recipes ? null : filtered.length === 0 ? (
            <p className="font-display italic text-emphasis text-muted-foreground">
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
                  onDelete={(_id, trigger) => {
                    deleteTrigger.current = trigger;
                    deleteSucceeded.current = false;
                    setDeleteError(false);
                    setDeleteTarget(recipe);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AddRecipeModal open={showAdd} onOpenChange={setShowAdd} />
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (!deleteSucceeded.current && deleteTrigger.current?.isConnected) {
              deleteTrigger.current.focus();
            } else {
              addButton.current?.focus();
            }
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="break-words">
              Delete &ldquo;{deleteTarget?.name}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This removes the recipe from your cookbook for good. Anyone with
              its shared link will no longer be able to open it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p role="alert" className="text-sm text-destructive">
              Aiyah, couldn’t confirm the deletion. Try again, or keep browsing your cookbook.
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Keep recipe</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                void deleteRecipe();
              }}
            >
              {deleting ? "Deleting…" : "Delete recipe"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CookbookEmpty({
  onChatClick,
  onPasteClick,
}: {
  onChatClick?: () => void;
  onPasteClick?: () => void;
}) {
  return (
    <div className="max-w-xl">
      {/* A settled empty state, distinct from the loading skeletons. */}
      <div className="bg-card border-[1.5px] border-dashed border-border rounded-lg p-6 flex flex-col gap-3.5 shadow-[0_1px_0_var(--color-border-soft)]">
        <div className="w-11 h-11 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shrink-0">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3-7 3z" />
          </svg>
        </div>
        <div>
          <div className="font-display font-semibold text-heading text-foreground leading-tight tracking-tight mb-1.5">
            Cookbook&rsquo;s empty for now.
          </div>
          <div className="font-display italic text-sm text-muted-foreground leading-relaxed">
            When something&rsquo;s worth a second go, tap <em>Save</em>. Ah Mah
            keeps it tidy.
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            variant="cta"
            onClick={onChatClick}
            className="self-start px-3.5 py-2 text-dense font-semibold"
          >
            Ask Ah Mah for a recipe →
          </Button>
          <button
            onClick={onPasteClick}
            className="self-start font-sans text-dense text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            or paste one you&rsquo;ve found
          </button>
        </div>
      </div>
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
