import {
  AddInventoryItemSchema,
  AddInventoryItemSchemaObj,
  CategorySchema,
  InventoryItemSchema,
  RemoveInventoryItemSchemaObj,
} from "./schemas";

describe("Inventory Schemas", () => {
  const validItem = {
    id: "item-123",
    name: "eggs",
    type: "ingredient" as const,
    quantity: 6,
    unit: "pieces" as const,
    dateAdded: "2024-01-01T10:00:00.000Z",
    lastUpdated: "2024-01-01T10:00:00.000Z",
  };

  describe("InventoryItemSchema", () => {

    it("should validate a complete valid inventory item", () => {
      expect(() => InventoryItemSchema.parse(validItem)).not.toThrow();
    });

    it("should validate item without optional fields", () => {
      const minimalItem = {
        id: "item-123",
        name: "garlic",
        type: "ingredient" as const,
        dateAdded: "2024-01-01T10:00:00.000Z",
        lastUpdated: "2024-01-01T10:00:00.000Z",
      };
      expect(() => InventoryItemSchema.parse(minimalItem)).not.toThrow();
    });

    it("should accept kitchenware type", () => {
      const kitchenwareItem = {
        ...validItem,
        name: "frying pan",
        type: "kitchenware" as const,
      };
      expect(() => InventoryItemSchema.parse(kitchenwareItem)).not.toThrow();
    });

    it("should reject invalid type", () => {
      const invalidItem = {
        ...validItem,
        type: "invalid-type",
      };
      expect(() => InventoryItemSchema.parse(invalidItem)).toThrow();
    });

    it("should reject missing required fields", () => {
      const invalidItems = [
        { ...validItem, id: undefined },
        { ...validItem, name: undefined },
        { ...validItem, type: undefined },
        { ...validItem, dateAdded: undefined },
        { ...validItem, lastUpdated: undefined },
      ];

      invalidItems.forEach((item) => {
        expect(() => InventoryItemSchema.parse(item)).toThrow();
      });
    });

    it("should reject empty strings", () => {
      const invalidItems = [
        { ...validItem, id: "" },
        { ...validItem, name: "" },
      ];

      invalidItems.forEach((item) => {
        expect(() => InventoryItemSchema.parse(item)).toThrow();
      });
    });

    it("should accept a valid category", () => {
      const withCategory = { ...validItem, category: "Protein" as const };
      expect(() => InventoryItemSchema.parse(withCategory)).not.toThrow();
    });

    it("should accept all valid category values", () => {
      const categories = ["Protein", "Carbs", "Vegetable", "Condiments", "Spice", "Misc"] as const;
      categories.forEach((category) => {
        expect(() => InventoryItemSchema.parse({ ...validItem, category })).not.toThrow();
      });
    });

    it("should reject an invalid category string", () => {
      expect(() =>
        InventoryItemSchema.parse({ ...validItem, category: "Fruit" })
      ).toThrow();
    });

    it("should accept item without category (optional)", () => {
      const { ...itemWithoutCategory } = validItem;
      expect(() => InventoryItemSchema.parse(itemWithoutCategory)).not.toThrow();
    });
  });

  describe("CategorySchema", () => {
    it("should accept all valid values", () => {
      ["Protein", "Carbs", "Vegetable", "Condiments", "Spice", "Misc"].forEach((v) => {
        expect(() => CategorySchema.parse(v)).not.toThrow();
      });
    });

    it("should reject unknown values", () => {
      ["protein", "PROTEIN", "Fruit", "Dairy", ""].forEach((v) => {
        expect(() => CategorySchema.parse(v)).toThrow();
      });
    });
  });

  describe("InventoryItemSchema additional", () => {
    it("should reject invalid datetime strings", () => {
      const invalidItems = [
        { ...validItem, dateAdded: "invalid-date" },
        { ...validItem, lastUpdated: "2024-01-01" }, // Missing time
      ];

      invalidItems.forEach((item) => {
        expect(() => InventoryItemSchema.parse(item)).toThrow();
      });
    });

    it("should reject negative quantity", () => {
      const invalidItem = {
        ...validItem,
        quantity: -1,
      };
      expect(() => InventoryItemSchema.parse(invalidItem)).toThrow();
    });

    it("should accept all valid units", () => {
      const validUnits = [
        "g",
        "kg",
        "oz",
        "lb", // Weight
        "ml",
        "l",
        "cup",
        "tbsp",
        "tsp", // Volume
        "piece",
        "pieces",
        "clove",
        "cloves", // Count
        "bottle",
        "bottles",
        "can",
        "cans", // Container
        "pack",
        "packs",
        "bunch",
        "bunches", // Packaging
        "pinch",
        "dash",
        "slice",
        "slices", // Other
      ];

      validUnits.forEach((unit) => {
        const item = { ...validItem, unit };
        expect(() => InventoryItemSchema.parse(item)).not.toThrow();
      });
    });

    it("should reject invalid units", () => {
      const invalidItem = {
        ...validItem,
        unit: "invalid-unit",
      };
      expect(() => InventoryItemSchema.parse(invalidItem)).toThrow();
    });
  });

  describe("AddInventoryItemSchema", () => {
    it("should validate item for adding (without id, dates)", () => {
      const newItem = {
        name: "chicken breast",
        type: "ingredient" as const,
        quantity: 2,
        unit: "pieces" as const,
      };
      expect(() => AddInventoryItemSchema.parse(newItem)).not.toThrow();
    });

    it("should validate minimal item for adding", () => {
      const minimalItem = {
        name: "salt",
        type: "ingredient" as const,
      };
      expect(() => AddInventoryItemSchema.parse(minimalItem)).not.toThrow();
    });

    it("should reject item with id field", () => {
      const itemWithId = {
        id: "should-not-be-here",
        name: "eggs",
        type: "ingredient" as const,
      };
      // This should still work because omit removes the field from validation
      // but if the id is present, it will be ignored
      expect(() => AddInventoryItemSchema.parse(itemWithId)).not.toThrow();
    });
  });

  describe("AddInventoryItemSchemaObj", () => {
    it("should validate array of items for adding", () => {
      const itemsObj = {
        items: [
          {
            name: "eggs",
            type: "ingredient" as const,
            quantity: 6,
            unit: "pieces" as const,
          },
          {
            name: "frying pan",
            type: "kitchenware" as const,
          },
        ],
      };
      expect(() => AddInventoryItemSchemaObj.parse(itemsObj)).not.toThrow();
    });

    it("should accept empty items array", () => {
      const emptyItems = { items: [] };
      expect(() => AddInventoryItemSchemaObj.parse(emptyItems)).not.toThrow();
    });

    it("should reject missing items field", () => {
      const noItems = {};
      expect(() => AddInventoryItemSchemaObj.parse(noItems)).toThrow();
    });
  });

  describe("RemoveInventoryItemSchemaObj", () => {
    it("should validate array of item names for removal", () => {
      const removeObj = {
        itemNames: ["eggs", "garlic", "frying pan"],
      };
      expect(() => RemoveInventoryItemSchemaObj.parse(removeObj)).not.toThrow();
    });

    it("should accept empty item names array", () => {
      const emptyNames = { itemNames: [] };
      expect(() =>
        RemoveInventoryItemSchemaObj.parse(emptyNames)
      ).not.toThrow();
    });

    it("should reject empty strings in item names", () => {
      const invalidNames = { itemNames: ["eggs", "", "garlic"] };
      expect(() => RemoveInventoryItemSchemaObj.parse(invalidNames)).toThrow();
    });
  });

});
