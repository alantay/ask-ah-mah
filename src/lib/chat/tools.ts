import { ADD_INVENTORY_TOOL_DESCRIPTION } from "@/lib/inventory/prompts";
import {
  addInventoryItem,
  getInventory,
  removeInventoryItem,
} from "@/lib/inventory/Inventory";
import {
  AddInventoryItemSchemaObj,
  RemoveInventoryItemSchemaObj,
} from "@/lib/inventory/schemas";
import { z } from "zod";

export function buildChatTools(userId: string) {
  return {
    addInventoryItem: {
      description: ADD_INVENTORY_TOOL_DESCRIPTION,
      inputSchema: AddInventoryItemSchemaObj,
      execute: async ({ items }: z.infer<typeof AddInventoryItemSchemaObj>) => {
        await addInventoryItem(items, userId);
        return { content: "Item added to inventory" };
      },
    },
    getInventory: {
      inputSchema: z.object({}),
      description:
        "Check what ingredients and kitchenware the user currently has in their inventory. Use this BEFORE suggesting recipes to see what they can cook with.",
      execute: async () => {
        const { ingredientInventory, kitchenwareInventory } =
          await getInventory(userId);
        return {
          content: `Current inventory: ${ingredientInventory.length} ingredients, ${kitchenwareInventory.length} kitchenware items`,
          inventory: { ingredientInventory, kitchenwareInventory },
        };
      },
    },
    removeInventoryItem: {
      description:
        "Remove items from inventory by their names (e.g., 'eggs', 'frying pan')",
      inputSchema: RemoveInventoryItemSchemaObj,
      execute: async ({ itemNames }: z.infer<typeof RemoveInventoryItemSchemaObj>) => {
        await removeInventoryItem(itemNames, userId);
        return { content: "Items removed from inventory" };
      },
    },
  };
}
