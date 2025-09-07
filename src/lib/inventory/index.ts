import { InventoryItem } from "../schemas";
import { generateShortId } from "./utils";

const kitchenwareInventory: InventoryItem[] = [];
const ingredientInventory: InventoryItem[] = [];

export function getInventory() {
  return {
    kitchenwareInventory,
    ingredientInventory,
  };
}

export function getKitchenwareInventory() {
  return kitchenwareInventory;
}

export function getIngredientInventory() {
  return ingredientInventory;
}

export function addInventoryItem(items: InventoryItem[]) {
  items.forEach((item) => {
    item.id = generateShortId();
    // make the name consistent with first letter capitalized and rest of the letters lowercase
    item.name =
      item.name.charAt(0).toUpperCase() + item.name.slice(1).toLowerCase();
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
}
