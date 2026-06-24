import { z } from "zod";

// A single item being added to the Shopping List: a display name and an
// optional category (fed to the Market Tip engine on the Need tab).
export const AddShoppingListItemSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().min(1).optional(),
});

export const AddShoppingListItemsSchema = z.object({
  items: z.array(AddShoppingListItemSchema),
});

export type AddShoppingListItem = z.infer<typeof AddShoppingListItemSchema>;
