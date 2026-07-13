import { buildCookWithMessage } from "./Inventory";
import type { InventoryItem } from "@/lib/inventory/schemas";

const TS = "2024-01-01T10:00:00.000Z";

function makeIngredient(name: string): InventoryItem {
  return { id: name, name, type: "ingredient", dateAdded: TS, lastUpdated: TS };
}

function makeEquipment(name: string): InventoryItem {
  return { id: name, name, type: "kitchenware", dateAdded: TS, lastUpdated: TS };
}

describe("buildCookWithMessage", () => {
  it("ingredients only — no equipment section", () => {
    const msg = buildCookWithMessage(
      [makeIngredient("tomato"), makeIngredient("tofu")],
      [],
    );
    expect(msg).toBe("Suggest recipes using: tomato, tofu");
  });

  it("ingredients + equipment", () => {
    const msg = buildCookWithMessage(
      [makeIngredient("chicken"), makeIngredient("bok choy")],
      [makeEquipment("air fryer")],
    );
    expect(msg).toBe("Suggest recipes using: chicken, bok choy. Kitchenware: air fryer");
  });

  it("equipment only (no ingredients)", () => {
    const msg = buildCookWithMessage([], [makeEquipment("wok")]);
    expect(msg).toBe("Suggest recipes using: no featured ingredients. Kitchenware: wok");
  });

  it("multiple equipment items joined with comma", () => {
    const msg = buildCookWithMessage(
      [makeIngredient("egg")],
      [makeEquipment("wok"), makeEquipment("rice cooker")],
    );
    expect(msg).toBe("Suggest recipes using: egg. Kitchenware: wok, rice cooker");
  });
});
