"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import RecipeDisplay from "@/features/RecipeDisplay/RecipeDisplay";
import { type RecipeBlock } from "@/lib/recipes/schemas";
import { type RecipeWithId } from "@/lib/recipes/schemas";
import { useSessionContext } from "@/contexts/SessionContext";
import { VisuallyHidden } from "radix-ui";
import { useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";

interface AddRecipeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function blockToPreviewRecipe(block: RecipeBlock): RecipeWithId {
  return {
    id: "preview",
    userId: "",
    name: block.title,
    instructions: block.description ?? "",
    description: block.description,
    totalTimeMinutes: block.totalTimeMinutes,
    baseServings: block.baseServings,
    ingredients: block.ingredients.map((ing) => ({
      name: ing.name,
      category: ing.category ?? "Misc",
      amount: ing.amount ? parseFloat(ing.amount) || undefined : undefined,
      unit: ing.unit,
      note: ing.note,
    })),
    prep: block.prep ?? [],
    steps: block.steps,
    tags: block.tags ?? [],
    imageUrl: null,
  };
}

export function AddRecipeModal({ open, onOpenChange }: AddRecipeModalProps) {
  const { userId } = useSessionContext();
  const [text, setText] = useState("");
  const [step, setStep] = useState<"paste" | "preview">("paste");
  const [preview, setPreview] = useState<RecipeBlock | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setText("");
    setStep("paste");
    setPreview(null);
    setError(null);
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const handleExtract = async () => {
    setError(null);
    setExtracting(true);
    try {
      const res = await fetch("/api/recipe/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again?");
        return;
      }
      setPreview(data);
      setStep("preview");
    } catch {
      setError("Couldn't connect. Check your network and try again.");
    } finally {
      setExtracting(false);
    }
  };

  const handleSave = async () => {
    if (!preview || !userId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, recipe: preview }),
      });
      if (!res.ok) throw new Error("Save failed");
      mutate(`/api/recipe?userId=${userId}`);
      toast.success("Recipe saved to your cookbook");
      handleOpenChange(false);
    } catch {
      toast.error("Failed to save recipe");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={step === "paste"}
        className="max-w-3xl w-[95vw] sm:w-[92vw] h-[92vh] p-0 overflow-hidden bg-background flex flex-col"
      >
        <VisuallyHidden.Root>
          <DialogTitle>{step === "paste" ? "Add a recipe" : "Preview recipe"}</DialogTitle>
        </VisuallyHidden.Root>

        {step === "paste" ? (
          <>
            <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
              <h2 className="font-display font-semibold text-[22px] text-foreground tracking-tight leading-tight">
                Add a recipe
              </h2>
              <p className="font-display italic text-[13px] text-muted-foreground mt-1">
                Paste recipe text you found — blog post, Reddit comment, anything.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3">
              <textarea
                value={text}
                onChange={(e) => { setText(e.target.value); setError(null); }}
                placeholder="Paste a recipe you found…"
                className="w-full flex-1 min-h-[280px] resize-none rounded-lg border border-border bg-card px-4 py-3 font-sans text-[13.5px] text-foreground placeholder:text-muted-foreground leading-relaxed outline-none focus:ring-1 focus:ring-primary transition-shadow"
              />
              {error && (
                <p className="font-sans text-[12.5px] text-destructive">{error}</p>
              )}
            </div>

            <div className="px-6 py-4 border-t border-border shrink-0">
              <button
                onClick={handleExtract}
                disabled={!text.trim() || extracting}
                className="w-full py-3 font-sans text-sm font-semibold text-white bg-primary border border-[oklch(0.405_0.130_32)] rounded-xl shadow-[0_2px_0_oklch(0.405_0.130_32)] hover:bg-[oklch(0.50_0.130_32)] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {extracting ? "Extracting…" : "Extract →"}
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Custom header overriding RecipeDisplay's internal back button */}
            <div className="px-5 py-3 border-b border-border flex items-center justify-between shrink-0">
              <button
                onClick={() => setStep("paste")}
                className="font-sans text-[11.5px] font-semibold tracking-[0.14em] uppercase text-ink-faint hover:text-foreground transition-colors cursor-pointer"
              >
                ← Back to edit
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {preview && (
                <RecipeDisplay
                  recipe={blockToPreviewRecipe(preview)}
                  onBack={() => setStep("paste")}
                  hideBackButton
                />
              )}
            </div>

            <div className="px-6 py-4 border-t border-border flex items-center gap-3 shrink-0">
              <button
                onClick={() => handleOpenChange(false)}
                className="flex-1 py-3 font-sans text-sm font-semibold text-foreground bg-card border border-border rounded-xl shadow-[0_1px_0_var(--border-soft)] hover:bg-muted/50 transition-colors cursor-pointer"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-[2] py-3 font-sans text-sm font-semibold text-white bg-primary border border-[oklch(0.405_0.130_32)] rounded-xl shadow-[0_2px_0_oklch(0.405_0.130_32)] hover:bg-[oklch(0.50_0.130_32)] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {saving ? "Saving…" : "Save to cookbook"}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
