import { buildCookWithMessage, withoutItemNamed } from "./Inventory";
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

describe("withoutItemNamed", () => {
  const data = {
    ingredientInventory: [makeIngredient("Duck"), makeIngredient("Eggs")],
    kitchenwareInventory: [makeEquipment("Wok")],
  };

  it("drops the named ingredient and leaves the rest", () => {
    const next = withoutItemNamed(data, "Duck");

    expect(next.ingredientInventory.map((i) => i.name)).toEqual(["Eggs"]);
    expect(next.kitchenwareInventory.map((i) => i.name)).toEqual(["Wok"]);
  });

  it("drops the named item from kitchenware too", () => {
    const next = withoutItemNamed(data, "Wok");

    expect(next.kitchenwareInventory).toEqual([]);
    expect(next.ingredientInventory).toHaveLength(2);
  });

  it("drops the name from both lists — mirrors the server's name-keyed deleteMany", () => {
    const both = {
      ingredientInventory: [makeIngredient("Ginger")],
      kitchenwareInventory: [makeEquipment("Ginger")],
    };

    const next = withoutItemNamed(both, "Ginger");

    expect(next.ingredientInventory).toEqual([]);
    expect(next.kitchenwareInventory).toEqual([]);
  });

  it("leaves the input untouched", () => {
    withoutItemNamed(data, "Duck");

    expect(data.ingredientInventory).toHaveLength(2);
  });

  it("returns empty lists when there is no data yet", () => {
    expect(withoutItemNamed(undefined, "Duck")).toEqual({
      ingredientInventory: [],
      kitchenwareInventory: [],
    });
  });

  // The reason Task 3 passes a *function* to optimisticData rather than a
  // precomputed value: three clicks in one frame all close over the same
  // render snapshot, so composing must be what removes all three.
  it("composes — chained removals accumulate", () => {
    const next = withoutItemNamed(withoutItemNamed(data, "Duck"), "Eggs");

    expect(next.ingredientInventory).toEqual([]);
    expect(next.kitchenwareInventory.map((i) => i.name)).toEqual(["Wok"]);
  });
});
