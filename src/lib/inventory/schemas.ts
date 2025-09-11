import { z } from "zod";

// Zod schemas for runtime validation
// MVP: Focus on inventory management only

export const InventoryItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  type: z.enum(["ingredient", "kitchenware"]),
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
export const AddInventoryItemSchema = z.object({
  items: z.array(
    InventoryItemSchema.omit({
      id: true,
      dateAdded: true,
      lastUpdated: true,
    })
  ),
});

// In src/lib/schemas.ts
export const RemoveInventoryItemSchema = z.object({
  itemNames: z.array(z.string().min(1)),
});

export const GetInventoryResponseSchema = z.object({
  kitchenwareInventory: z.array(InventoryItemSchema),
  ingredientInventory: z.array(InventoryItemSchema),
});

export const ChatMessageSchema = z.object({
  id: z.string().min(1),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
  timestamp: z.string().datetime(),
});

// Type inference from schemas - single source of truth
export type InventoryItem = z.infer<typeof InventoryItemSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const InventoryActionSchema = z.object({
  type: z.enum(["add", "remove", "update"]),
  item: InventoryItemSchema.partial(),
});

export type InventoryAction = z.infer<typeof InventoryActionSchema>;

export type GetInventoryResponse = z.infer<typeof GetInventoryResponseSchema>;
