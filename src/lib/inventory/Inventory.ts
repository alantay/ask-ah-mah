import { InventoryItem } from "../schemas";
import { generateShortId } from "./utils";

const kitchenwareInventory: InventoryItem[] = [];
const ingredientInventory: InventoryItem[] = [];

export function getInventory() {
  const inventory = {
    kitchenwareInventory,
    ingredientInventory,
  };
  console.log("Inventory", inventory);
  return inventory;
}

export function getKitchenwareInventory() {
  return kitchenwareInventory;
}

export function getIngredientInventory() {
  return ingredientInventory;
}

export function addInventoryItem(items: InventoryItem[]) {
  console.log("Adding items to inventory", items);
  for (const item of items) {
    console.log("Adding item to inventory(inside loop)", item);
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
      item.unit = undefined;
    }

    switch (item.type) {
      case "kitchenware": {
        const duplicateIdx = kitchenwareInventory.findIndex(
          (i) => i.name.toLowerCase() === item.name.toLowerCase()
        );
        if (duplicateIdx >= 0) {
          kitchenwareInventory[duplicateIdx] = item;
        } else {
          console.log("push kitchenwareInventory");

          kitchenwareInventory.push(item);
        }

        break;
      }
      case "ingredient": {
        const duplicateName = ingredientInventory.findIndex(
          (i) => i.name.toLowerCase() === item.name.toLowerCase()
        );
        if (duplicateName >= 0) {
          ingredientInventory[duplicateName] = item;
        } else {
          console.log("push ingredientInventory");

          ingredientInventory.push(item);
        }
        break;
      }
    }
  }
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
