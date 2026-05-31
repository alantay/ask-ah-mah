"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import RecipeDisplay from "@/features/RecipeDisplay/RecipeDisplay";
import { type RecipeBlock, type RecipeWithId } from "@/lib/recipes/schemas";
import { useSessionContext } from "@/contexts/SessionContext";
import { VisuallyHidden } from "radix-ui";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";

const CHAR_LIMIT = 8000;
const MIN_EXTRACTING_MS = 1200;
const STAGE_INTERVAL_MS = 600;

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

function ExtractingSkeleton({ revealStage }: { revealStage: number }) {
  const shimmer = "bg-border rounded animate-pulse";

  const bandVisible = (minStage: number) => ({
    opacity: revealStage >= minStage ? 1 : 0,
    transform: revealStage >= minStage ? "translateY(0)" : "translateY(6px)",
    transition: "opacity 0.25s, transform 0.25s",
  });

  const ingredientVisible = (i: number) => {
    const visible = revealStage >= 3 || (revealStage >= 2 && i < 4);
    return {
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(4px)",
      transition: `opacity 0.22s ${i * 0.07}s, transform 0.22s ${i * 0.07}s`,
    };
  };

  return (
    <div className="px-6 py-6 flex flex-col gap-6">
      {/* Title */}
      <div style={bandVisible(1)}>
        <div className={`h-7 w-3/5 ${shimmer}`} />
      </div>

      {/* Meta chips */}
      <div className="flex gap-2" style={bandVisible(2)}>
        <div className={`h-5 w-16 ${shimmer} rounded-full`} />
        <div className={`h-5 w-14 ${shimmer} rounded-full`} />
      </div>

      {/* Ingredients */}
      <div style={bandVisible(2)}>
        <div className={`h-2.5 w-28 ${shimmer} mb-3`} />
        <div className="flex flex-col">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 py-2 border-b border-dashed border-border"
              style={ingredientVisible(i)}
            >
              <div className={`h-2.5 w-10 ${shimmer} shrink-0`} />
              <div className={`h-2.5 ${shimmer}`} style={{ width: `${50 + (i % 4) * 10}%` }} />
            </div>
          ))}
        </div>
      </div>

      {/* Method */}
      <div style={bandVisible(3)}>
        <div className={`h-2.5 w-16 ${shimmer} mb-3`} />
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className={`h-5 w-5 ${shimmer} rounded-full shrink-0`} />
              <div className="flex-1 flex flex-col gap-1.5">
                <div className={`h-2.5 w-full ${shimmer}`} />
                <div className={`h-2.5 ${shimmer}`} style={{ width: `${60 + (i % 2) * 20}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AddRecipeModal({ open, onOpenChange }: AddRecipeModalProps) {
  const { userId } = useSessionContext();
  const [text, setText] = useState("");
  const [step, setStep] = useState<"paste" | "extracting" | "preview">("paste");
  const [revealStage, setRevealStage] = useState(0);
  const [preview, setPreview] = useState<RecipeBlock | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const resolvedRef = useRef<RecipeBlock | null>(null);
  const minTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minTimerDoneRef = useRef(false);
  const apiFetchDoneRef = useRef(false);

  const tryTransitionToPreview = () => {
    if (minTimerDoneRef.current && apiFetchDoneRef.current && resolvedRef.current) {
      setPreview(resolvedRef.current);
      setStep("preview");
    }
  };

  // Advance reveal stage every STAGE_INTERVAL_MS while extracting
  useEffect(() => {
    if (step !== "extracting") {
      setRevealStage(0);
      return;
    }
    const iv = setInterval(() => {
      setRevealStage((s) => {
        if (s >= 3) { clearInterval(iv); return s; }
        return s + 1;
      });
    }, STAGE_INTERVAL_MS);
    return () => clearInterval(iv);
  }, [step]);

  const reset = () => {
    abortRef.current?.abort();
    if (minTimerRef.current) clearTimeout(minTimerRef.current);
    minTimerRef.current = null;
    setText("");
    setStep("paste");
    setRevealStage(0);
    setPreview(null);
    setError(null);
    resolvedRef.current = null;
    minTimerDoneRef.current = false;
    apiFetchDoneRef.current = false;
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const handleExtract = async () => {
    setError(null);
    resolvedRef.current = null;
    minTimerDoneRef.current = false;
    apiFetchDoneRef.current = false;

    const controller = new AbortController();
    abortRef.current = controller;
    setStep("extracting");

    minTimerRef.current = setTimeout(() => {
      minTimerDoneRef.current = true;
      tryTransitionToPreview();
    }, MIN_EXTRACTING_MS);

    try {
      const res = await fetch("/api/recipe/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again?");
        setStep("paste");
        return;
      }
      resolvedRef.current = data;
      apiFetchDoneRef.current = true;
      tryTransitionToPreview();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError("Couldn't connect. Check your network and try again.");
      setStep("paste");
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
      toast.success("Kept in your cookbook.");
      handleOpenChange(false);
    } catch {
      toast.error("Aiyah, couldn't keep it. Try again?");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton
        className="max-w-3xl w-[95vw] sm:w-[92vw] h-[92vh] p-0 overflow-hidden bg-background flex flex-col"
      >
        <VisuallyHidden.Root>
          <DialogTitle>
            {step === "paste" ? "Add a recipe" : step === "extracting" ? "Reading recipe…" : "Preview recipe"}
          </DialogTitle>
        </VisuallyHidden.Root>

        {/* ── Header — changes per step ── */}
        {step === "extracting" ? (
          <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-border shrink-0 flex items-center gap-3">
            <div className="w-4 h-4 rounded-full border-2 border-border border-t-primary shrink-0 [animation:modalSpin_0.9s_linear_infinite]" />
            <span className="font-display italic text-[15px] text-foreground">
              Ah Mah is reading your recipe…
            </span>
          </div>
        ) : step === "paste" ? (
          <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-border shrink-0">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="hidden sm:flex w-9 h-9 shrink-0 rounded-lg bg-primary/10 border border-border items-center justify-center text-primary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="6" y="3" width="12" height="18" rx="2" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <h2 className="font-display font-semibold text-[20px] sm:text-[22px] text-foreground tracking-tight leading-tight">
                  Add a recipe
                </h2>
                <p className="hidden sm:block font-display italic text-[13px] text-muted-foreground mt-1 leading-snug">
                  Paste any recipe text — Ah Mah will read it and tidy it up for you.
                </p>
              </div>
            </div>
          </div>
        ) : null /* preview: no custom header, RecipeDisplay handles its own layout */}

        {/* ── Body — keyed so the enter animation fires on every step change ── */}
        <style>{`
          @keyframes modalBodyIn {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes modalSpin {
            to { transform: rotate(360deg); }
          }
        `}</style>

        <div
          key={step}
          className="flex-1 overflow-hidden flex flex-col"
          style={{ animation: "modalBodyIn 180ms cubic-bezier(0.32,0.72,0,1) both" }}
        >
          {/* ── Paste step ── */}
          {step === "paste" && (
            <>
              {/* Textarea + error banner + tip */}
              <div className="flex-1 px-5 sm:px-6 py-3 flex flex-col gap-2 min-h-0">
                <textarea
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value.slice(0, CHAR_LIMIT));
                    setError(null);
                  }}
                  placeholder="Paste recipe text here. Messy is fine."
                  className={[
                    "w-full flex-1 min-h-[140px] sm:min-h-0 resize-none rounded-lg border bg-card px-4 py-3",
                    "font-sans text-dense text-foreground placeholder:text-muted-foreground leading-relaxed",
                    "outline-none transition-all",
                    error
                      ? "border-[oklch(0.78_0.10_27)] ring-[3px] ring-[oklch(0.78_0.10_27)/0.12]"
                      : text
                      ? "border-primary ring-[3px] ring-primary/10"
                      : "border-border focus:border-primary focus:ring-[3px] focus:ring-primary/10",
                  ].join(" ")}
                />

                {error && (
                  <div className="flex gap-2.5 items-start px-3 py-2.5 rounded-lg bg-[oklch(0.97_0.04_27)] border border-[oklch(0.85_0.08_27)] shrink-0">
                    <div className="w-[18px] h-[18px] rounded-full bg-[oklch(0.52_0.16_27)] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      !
                    </div>
                    <div className="font-sans text-[12px] text-foreground leading-[1.5]">
                      <span className="font-semibold">Ah Mah couldn&rsquo;t find a recipe in this.</span>{" "}
                      <span className="text-muted-foreground">
                        Try pasting just the recipe portion — usually the ingredients and steps.
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between shrink-0">
                  <span className="font-sans text-eyebrow text-muted-foreground">
                    Tip: paste just the recipe portion for the cleanest result.
                  </span>
                  <span className="hidden sm:inline font-mono text-eyebrow text-muted-foreground tabular-nums">
                    {text.length.toLocaleString()} / {CHAR_LIMIT.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="px-5 sm:px-6 py-4 border-t border-dashed border-border shrink-0">
                <Button
                  variant="ctaDeep"
                  onClick={handleExtract}
                  disabled={!text.trim()}
                  className="w-full py-3 font-sans text-sm font-semibold"
                >
                  Extract recipe →
                </Button>
              </div>
            </>
          )}

          {/* ── Extracting step ── */}
          {step === "extracting" && (
            <>
              <div className="flex-1 overflow-y-auto">
                <ExtractingSkeleton revealStage={revealStage} />
              </div>
              <div className="px-6 py-3 border-t border-dashed border-border text-center font-sans text-micro text-muted-foreground shrink-0">
                Pulling out ingredients, steps, and timing… usually 4–6 seconds.
              </div>
            </>
          )}

          {/* ── Preview step ── */}
          {step === "preview" && (
            <>
              <div className="flex-1 overflow-y-auto min-h-0">
                {preview && (
                  <RecipeDisplay
                    recipe={blockToPreviewRecipe(preview)}
                    onBack={() => setStep("paste")}
                    hideBackButton
                  />
                )}
              </div>
              <div className="px-5 sm:px-6 py-4 border-t border-border flex items-center justify-between gap-3 shrink-0">
                <button
                  onClick={() => setStep("paste")}
                  className="inline-flex items-center gap-1.5 font-sans text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                    <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Back to edit
                </button>
                <Button
                  variant="ctaDeep"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2.5 font-sans text-sm font-semibold"
                >
                  {saving ? "Saving…" : "Save to cookbook →"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
