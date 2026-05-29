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
  title: z.string(),
  body: z.string(),
  tip: z.string().optional(),
});
export type RecipeStep = z.infer<typeof RecipeStepSchema>;

// Ingredient as emitted by the model (amounts as strings for scaling)
export const RecipeIngredientModelSchema = z.object({
  name: z.string(),
  category: CategorySchema.nullish().transform((v) => v ?? undefined),
  amount: z.string().nullish().transform((v) => v ?? undefined),   // string so "1 1/2" works
  unit: z.string().nullish().transform((v) => v ?? undefined),
  note: z.string().nullish().transform((v) => v ?? undefined),
});
export type RecipeIngredientModel = z.infer<typeof RecipeIngredientModelSchema>;

// Full structured recipe block (```recipe fenced JSON)
export const RecipeBlockSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  totalTimeMinutes: z.number().optional(),
  baseServings: z.number(),
  ingredients: z.array(RecipeIngredientModelSchema),
  prep: z.array(z.string()).optional(),
  steps: z.array(RecipeStepSchema),
  tags: z.array(z.string()).optional(),
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
  description?: string;
  totalTimeMinutes?: number;
  createdAt?: Date;
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

export const ChangeEntrySchema = z.object({
  kind: ChangeKindSchema,
  ref: z.union([z.string(), z.number()]).optional(),
  label: z.string(),
});
export type ChangeEntry = z.infer<typeof ChangeEntrySchema>;

export const TweakResponseSchema = z.object({
  recipe: RecipeBlockSchema,
  changes: z.array(ChangeEntrySchema),
});
export type TweakResponse = z.infer<typeof TweakResponseSchema>;

export function recipeWithIdToBlock(r: RecipeWithId) {
  return {
    id: r.id,
    title: r.name,
    description: r.description,
    totalTimeMinutes: r.totalTimeMinutes,
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
    tags: r.tags,
  };
}
