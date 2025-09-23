import { z } from "zod";

export const RecipeSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string(),
  ingredients: z.array(
    z.object({
      name: z.string(),
      quantity: z.number().optional(),
      unit: z.string().optional(),
      available: z.boolean(),
    })
  ),
  instructions: z.array(z.string()),
  cookingTime: z.number(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  requiredKitchenware: z.array(z.string()),
  userId: z.string(),
});

export type Recipe = z.infer<typeof RecipeSchema>;
