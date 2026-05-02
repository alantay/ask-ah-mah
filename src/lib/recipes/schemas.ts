import { z } from "zod";

export const RecipeIngredientSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive().optional(),
  unit: z.string().optional(),
});

export type RecipeIngredient = z.infer<typeof RecipeIngredientSchema>;

export type Recipe = {
  userId: string;
  name: string;
  instructions: string;
  tags?: string[];
  recipeId?: string;
  baseServings: number;
  ingredients: RecipeIngredient[];
  description?: string;
  totalTimeMinutes?: number;
  createdAt?: Date;
};

export type RecipeWithId = Recipe & { id: string };
