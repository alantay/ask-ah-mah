import { z } from "zod";

// Zod schemas for runtime validation
// MVP: Focus on inventory management only

export const CategorySchema = z.enum(["Protein", "Carbs", "Vegetable", "Condiments", "Spice", "Misc"]);
export type Category = z.infer<typeof CategorySchema>;

export const InventoryItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  type: z.enum(["ingredient", "kitchenware"]),
  category: CategorySchema.optional(),
  quantity: z.number().positive().optional(),
  unit: z
    .enum([
      // Weight
      "g",
      "kg",
      "oz",
      "lb",
      // Volume
      "ml",
      "l",
      "cup",
      "tbsp",
      "tsp",
      // Count/Container
      "piece",
      "pieces",
      "clove",
      "cloves",
      "bottle",
      "bottles",
      "can",
      "cans",
      "pack",
      "packs",
      "bunch",
      "bunches",
      // Other
      "pinch",
      "dash",
      "slice",
      "slices",
    ])
    .optional(),
  dateAdded: z.string().datetime(),
  lastUpdated: z.string().datetime(),
});

// for adding inventory items
export const AddInventoryItemSchema = InventoryItemSchema.omit({
  id: true,
  dateAdded: true,
  lastUpdated: true,
});

// for ai sdk
export const AddInventoryItemSchemaObj = z.object({
  items: z.array(AddInventoryItemSchema),
});

// In src/lib/schemas.ts
export const RemoveInventoryItemSchemaObj = z.object({
  itemNames: z.array(z.string().min(1)),
});

// Type inference from schemas - single source of truth
export type InventoryItem = z.infer<typeof InventoryItemSchema>;

export type AddInventoryItem = z.infer<typeof AddInventoryItemSchema>;
