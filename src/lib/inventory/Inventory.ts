import { InventoryItem } from "../schemas";
import { generateShortId } from "./utils";

const kitchenwareInventory: InventoryItem[] = [
  {
    id: "2",
    name: "Pot",
    type: "kitchenware",
    dateAdded: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  },
];
const ingredientInventory: InventoryItem[] = [
  {
    id: "1",
    name: "Eggs",
    type: "ingredient",
    quantity: 12,
    unit: "piece",
    dateAdded: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  },
];

export function getInventory() {
  const inventory = {
    kitchenwareInventory,
    ingredientInventory,
  };
  console.log("getInventory called, returning:", inventory);
  return inventory;
}

export function getKitchenwareInventory() {
  return kitchenwareInventory;
}

export function getIngredientInventory() {
  return ingredientInventory;
}

export function addInventoryItem(items: InventoryItem[]) {
  console.log("Adding items to inventory:", items);
  items.forEach((item) => {
    item.id = generateShortId();
    // make the name consistent with first letter capitalized and rest of the letters lowercase
    item.name =
      item.name.charAt(0).toUpperCase() + item.name.slice(1).toLowerCase();
    // Add missing date fields
    item.dateAdded = new Date().toISOString();
    item.lastUpdated = new Date().toISOString();

    if (!item.quantity) {
      item.quantity = 1;
    }

    if (!item.unit) {
      item.unit = "piece"; // Default to empty string when unit is ambiguous
    }

    console.log("Processing item:", item);
    switch (item.type) {
      case "kitchenware": {
        const duplicateIdx = kitchenwareInventory.findIndex(
          (i) => i.name.toLowerCase() === item.name.toLowerCase()
        );
        if (duplicateIdx >= 0) {
          kitchenwareInventory[duplicateIdx] = item;
        } else {
          kitchenwareInventory.push(item);
        }

        break;
      }
      case "ingredient": {
        const duplicateIdx = ingredientInventory.findIndex(
          (i) => i.name.toLowerCase() === item.name.toLowerCase()
        );
        if (duplicateIdx >= 0) {
          ingredientInventory[duplicateIdx] = item;
        } else {
          ingredientInventory.push(item);
        }
        break;
      }
    }
  });
  console.log("Inventory after adding items:");
  console.log("Kitchenware:", kitchenwareInventory);
  console.log("Ingredients:", ingredientInventory);
}

export function removeInventoryItem(itemNames: string[]) {
  itemNames.forEach((name) => {
    // Remove from kitchenware inventory
    const kitchenwareIndex = kitchenwareInventory.findIndex(
      (item) => item.name.toLowerCase() === name.toLowerCase()
    );
    if (kitchenwareIndex >= 0) {
      kitchenwareInventory.splice(kitchenwareIndex, 1);
    }

    // Remove from ingredient inventory
    const ingredientIndex = ingredientInventory.findIndex(
      (item) => item.name.toLowerCase() === name.toLowerCase()
    );
    if (ingredientIndex >= 0) {
      ingredientInventory.splice(ingredientIndex, 1);
    }
  });
}
