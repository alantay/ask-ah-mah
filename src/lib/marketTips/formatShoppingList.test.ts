import { formatShoppingList } from "./formatShoppingList";

describe("formatShoppingList", () => {
  it("appends a tip when present, keyed by canonical name", () => {
    const out = formatShoppingList(
      [{ name: "Tomato", amount: "2" }],
      { tomato: "firm, deep red, no bruises" },
    );
    expect(out).toBe("2 Tomato — firm, deep red, no bruises");
  });

  it("includes the unit when present", () => {
    const out = formatShoppingList(
      [{ name: "Prawns", amount: "300", unit: "g" }],
      { prawns: "shells tight, smell of the sea not ammonia" },
    );
    expect(out).toBe("300 g Prawns — shells tight, smell of the sea not ammonia");
  });

  it("omits the dash when there is no tip, and amount when absent", () => {
    const out = formatShoppingList(
      [{ name: "Tofu" }],
      {},
    );
    expect(out).toBe("Tofu");
  });

  it("treats an empty-string tip as no tip", () => {
    const out = formatShoppingList([{ name: "Flour" }], { flour: "" });
    expect(out).toBe("Flour");
  });

  it("joins multiple items with newlines", () => {
    const out = formatShoppingList(
      [{ name: "Tomato" }, { name: "Tofu" }],
      { tomato: "deep red" },
    );
    expect(out).toBe("Tomato — deep red\nTofu");
  });
});
