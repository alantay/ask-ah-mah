import { z } from "zod";

// Zod schemas for runtime validation
// MVP: Focus on inventory management only

export const InventoryItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  type: z.enum(["ingredient", "kitchenware"]),
  quantity: z.number().positive().optional(),
  unit: z.string().min(1).max(20).optional(),
  dateAdded: z.date(),
  lastUpdated: z.date(),
});

export const ChatMessageSchema = z.object({
  id: z.string().min(1),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
  timestamp: z.date(),
});

export const InventoryActionSchema = z.object({
  type: z.enum(["add", "remove", "update"]),
  item: InventoryItemSchema.partial(),
});

// Type inference from schemas
export type InventoryItem = z.infer<typeof InventoryItemSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type InventoryAction = z.infer<typeof InventoryActionSchema>;
