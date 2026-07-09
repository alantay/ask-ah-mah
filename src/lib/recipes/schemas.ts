import { z } from "zod";
import { CategorySchema } from "@/lib/inventory/schemas";

export const RecipeIngredientSchema = z.object({
  name: z.string().min(1),
  category: CategorySchema,
  amount: z.number().positive().optional(),
  unit: z.string().optional(),
  note: z.string().optional(),
});

export type RecipeIngredient = z.infer<typeof RecipeIngredientSchema>;

// Step in a structured recipe
export const RecipeStepSchema = z.object({
  title: z.string().max(100),
  body: z.string().max(2000),
  tip: z.string().max(500).optional(),
});
export type RecipeStep = z.infer<typeof RecipeStepSchema>;

// Ingredient as emitted by the model (amounts as strings for scaling)
export const RecipeIngredientModelSchema = z.object({
  name: z.string().max(200),
  category: CategorySchema.nullish().transform((v) => v ?? undefined),
  amount: z.string().max(20).nullish().transform((v) => v ?? undefined),   // string so "1 1/2" works
  unit: z.string().max(20).nullish().transform((v) => v ?? undefined),
  note: z.string().max(300).nullish().transform((v) => v ?? undefined),
});
export type RecipeIngredientModel = z.infer<typeof RecipeIngredientModelSchema>;

// Full structured recipe block (```recipe fenced JSON)
export const RecipeBlockSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  totalTimeMinutes: z.number().optional(),
  baseServings: z.number(),
  ingredients: z.array(RecipeIngredientModelSchema).max(50),
  prep: z.array(z.string().max(300)).max(50).optional(),
  steps: z.array(RecipeStepSchema).max(50),
  // Whole-dish asides (make-ahead, storage, serving, pantry-independent
  // technique fallbacks). NOT pantry substitutions — those live on the
  // ingredient `note` and the "Ask Ah Mah for substitutions" affordance.
  notes: z.array(z.string().max(500)).max(20).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  // Set by the model in Cook With What You Have (Mode 3) responses only.
  // "close" = 0–2 additions (UI: "Right now"); "stretch" = 3–4 additions (UI: "Worth a small trip").
  closeness: z.enum(["close", "stretch"]).optional(),
  // Explicit "I made this" marker (ADR-0020) — a recall flag, never inferred or scored.
  // Carried here only so saved recipes round-trip through updates; the create
  // path (saveRecipeFromBlock) ignores it, so a model-streamed block can never
  // stamp a recipe.
  cooked: z.boolean().optional(),
});
export type RecipeBlock = z.infer<typeof RecipeBlockSchema>;

// One option inside a ```suggestions block
export const SuggestionOptionSchema = z.object({
  id: z.string(),
  title: z.string(),
  blurb: z.string(),
  time: z.string(),
  tags: z.array(z.string()),
  keyIngredients: z.array(z.string()),
  note: z.string().optional(),
});
export type SuggestionOption = z.infer<typeof SuggestionOptionSchema>;

// Full ```suggestions block
export const SuggestionsBlockSchema = z.object({
  intro: z.string(),
  options: z.array(SuggestionOptionSchema),
});
export type SuggestionsBlockData = z.infer<typeof SuggestionsBlockSchema>;

// ```gate block
export const GateSchema = z.object({
  recipeId: z.string(),
  title: z.string(),
  keyIngredients: z.array(z.string()),
});
export type GateData = z.infer<typeof GateSchema>;

export type Recipe = {
  userId: string;
  name: string;
  instructions: string;
  tags?: string[];
  recipeId?: string;
  baseServings: number;
  ingredients: RecipeIngredient[];
  prep?: string[];
  steps?: RecipeStep[];          // new: structured steps (null for legacy recipes)
  notes?: string[];              // whole-dish asides (make-ahead, storage, serving)
  description?: string;
  totalTimeMinutes?: number;
  createdAt?: Date;
  cooked?: boolean;
};

export type RecipeWithId = Recipe & {
  id: string;
  imageUrl?: string | null;
  photographerName?: string | null;
  photographerUrl?: string | null;
};

// Structured change list returned by the tweak model alongside the updated recipe
export const ChangeKindSchema = z.enum([
  "title_updated",
  "description_updated",
  "tags_updated",
  "servings_updated",
  "time_updated",
  "ingredient_added",
  "ingredient_removed",
  "ingredient_changed",
  "step_added",
  "step_removed",
  "step_replaced",
  "prep_updated",
]);
export type ChangeKind = z.infer<typeof ChangeKindSchema>;

export const ChangeRefSchema = z.object({
  type: z.enum(["ingredient", "step"]),
  index: z.number().int().nonnegative(),
  basis: z.enum(["original", "workingDraft"]),
});
export type ChangeRef = z.infer<typeof ChangeRefSchema>;

export const ChangeEntrySchema = z.object({
  kind: ChangeKindSchema,
  // `ref` is a presentational locator (drives row highlighting for ingredient/step
  // changes only — prep and recipe-level changes have no highlight). The model
  // sometimes emits refs we don't model (e.g. `type: "prep"`); treat a malformed
  // ref as "no highlight" rather than discarding the entire valid tweak.
  ref: ChangeRefSchema.optional().catch(undefined),
  label: z.string(),
});
export type ChangeEntry = z.infer<typeof ChangeEntrySchema>;

// A Recipe Tweak returns a **patch** (ADR-0010), not the whole recipe: only the
// fields that changed, plus the change list. Every recipe field is optional;
// `changes` is always present. Presence is the signal — see `applyTweakPatch`.
export const TweakPatchSchema = z.strictObject({
  title: z.string().optional(),
  description: z.string().optional(),
  totalTimeMinutes: z.number().optional(),
  baseServings: z.number().optional(),
  ingredients: z.array(RecipeIngredientModelSchema).optional(),
  prep: z.array(z.string()).optional(),
  steps: z.array(RecipeStepSchema).optional(),
  tags: z.array(z.string()).optional(),
  closeness: z.enum(["close", "stretch"]).optional(),
  changes: z.array(ChangeEntrySchema),
});
export type TweakPatch = z.infer<typeof TweakPatchSchema>;

// Merge a Tweak Patch onto the working draft (pure). Presence-based:
//   key present  → replace that field (an empty array clears it)
//   key absent    → keep the working draft's value
// Arrays are replaced wholesale — the model returns the entire array if any
// element changed — so the client never applies indexed row ops (ADR-0010).
export function applyTweakPatch(workingDraft: RecipeBlock, patch: TweakPatch): RecipeBlock {
  const next: RecipeBlock = { ...workingDraft };
  if (patch.title !== undefined) next.title = patch.title;
  if (patch.description !== undefined) next.description = patch.description;
  if (patch.totalTimeMinutes !== undefined) next.totalTimeMinutes = patch.totalTimeMinutes;
  if (patch.baseServings !== undefined) next.baseServings = patch.baseServings;
  if (patch.ingredients !== undefined) next.ingredients = patch.ingredients;
  if (patch.prep !== undefined) next.prep = patch.prep;
  if (patch.steps !== undefined) next.steps = patch.steps;
  if (patch.tags !== undefined) next.tags = patch.tags;
  if (patch.closeness !== undefined) next.closeness = patch.closeness;
  return next;
}

const parseIngredientAmount = (amount: string | undefined) => {
  if (amount === undefined) return undefined;
  const parsed = parseFloat(amount);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export function recipeBlockToRecipeWithId(block: RecipeBlock, base: RecipeWithId): RecipeWithId {
  return {
    ...base,
    name: block.title,
    description: block.description,
    totalTimeMinutes: block.totalTimeMinutes,
    baseServings: block.baseServings,
    ingredients: block.ingredients.map((i) => ({
      name: i.name,
      category: i.category ?? "Misc",
      amount: parseIngredientAmount(i.amount),
      unit: i.unit,
      note: i.note,
    })),
    prep: block.prep,
    steps: block.steps,
    notes: block.notes,
    tags: block.tags,
    cooked: block.cooked,
  };
}

export function recipeWithIdToBlock(r: RecipeWithId) {
  return {
    id: r.id,
    title: r.name,
    description: r.description ?? undefined,
    totalTimeMinutes: r.totalTimeMinutes ?? undefined,
    baseServings: r.baseServings,
    ingredients: r.ingredients.map((i) => ({
      name: i.name,
      category: i.category,
      amount: i.amount != null ? String(i.amount) : undefined,
      unit: i.unit,
      note: i.note,
    })),
    prep: r.prep,
    steps: r.steps ?? [],
    notes: r.notes,
    tags: r.tags,
    cooked: r.cooked,
  };
}
