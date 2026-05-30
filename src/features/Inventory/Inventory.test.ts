import { buildCookWithMessage } from "./Inventory";
import type { InventoryItem } from "@/lib/inventory/schemas";

function makeIngredient(name: string): InventoryItem {
  return { id: name, userId: "u1", name, type: "ingredient", shelfLife: "medium" };
}

function makeEquipment(name: string): InventoryItem {
  return { id: name, userId: "u1", name, type: "kitchenware", shelfLife: "long" };
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
    expect(msg).toBe("Suggest recipes using: chicken, bok choy — featuring air fryer");
  });

  it("equipment only (no ingredients)", () => {
    const msg = buildCookWithMessage([], [makeEquipment("wok")]);
    expect(msg).toBe("Suggest recipes using:  — featuring wok");
  });

  it("multiple equipment items joined with comma", () => {
    const msg = buildCookWithMessage(
      [makeIngredient("egg")],
      [makeEquipment("wok"), makeEquipment("rice cooker")],
    );
    expect(msg).toBe("Suggest recipes using: egg — featuring wok, rice cooker");
  });
});
