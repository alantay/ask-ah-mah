import {
  addInventoryItem,
  getInventory,
  removeInventoryItem,
} from "@/lib/inventory/Inventory";
import { buildChatTools } from "./tools";

jest.mock("@/lib/inventory/Inventory", () => ({
  addInventoryItem: jest.fn(),
  getInventory: jest.fn(),
  removeInventoryItem: jest.fn(),
}));

describe("buildChatTools", () => {
  const userId = "user-123";

  it("returns a tool set with the three expected keys", () => {
    const tools = buildChatTools(userId);
    expect(Object.keys(tools)).toEqual(
      expect.arrayContaining(["addInventoryItem", "getInventory", "removeInventoryItem"]),
    );
  });

  it("each tool has a description, inputSchema, and execute", () => {
    const tools = buildChatTools(userId);
    for (const tool of Object.values(tools)) {
      expect(tool).toHaveProperty("description");
      expect(tool).toHaveProperty("inputSchema");
      expect(tool).toHaveProperty("execute");
      expect(typeof tool.execute).toBe("function");
    }
  });

  describe("addInventoryItem.execute", () => {
    it("calls addInventoryItem with items and userId", async () => {
      const tools = buildChatTools(userId);
      const items = [{ name: "eggs", type: "ingredient" as const }];
      await tools.addInventoryItem.execute({ items });
      expect(addInventoryItem).toHaveBeenCalledWith(items, userId);
    });

    it("returns a confirmation message", async () => {
      const tools = buildChatTools(userId);
      const result = await tools.addInventoryItem.execute({
        items: [{ name: "salt", type: "ingredient" as const }],
      });
      expect(result).toHaveProperty("content");
    });
  });

  describe("getInventory.execute", () => {
    it("calls getInventory with userId", async () => {
      (getInventory as jest.Mock).mockResolvedValue({
        ingredientInventory: [{ name: "eggs" }],
        kitchenwareInventory: [],
      });
      const tools = buildChatTools(userId);
      await tools.getInventory.execute({});
      expect(getInventory).toHaveBeenCalledWith(userId);
    });

    it("returns content string and inventory object", async () => {
      (getInventory as jest.Mock).mockResolvedValue({
        ingredientInventory: [{ name: "eggs" }, { name: "milk" }],
        kitchenwareInventory: [{ name: "wok" }],
      });
      const tools = buildChatTools(userId);
      const result = await tools.getInventory.execute({});
      expect(result).toHaveProperty("content");
      expect(result).toHaveProperty("inventory");
      expect((result as { content: string }).content).toContain("2 ingredients");
      expect((result as { content: string }).content).toContain("1 kitchenware");
    });
  });

  describe("removeInventoryItem.execute", () => {
    it("calls removeInventoryItem with itemNames and userId", async () => {
      const tools = buildChatTools(userId);
      await tools.removeInventoryItem.execute({ itemNames: ["eggs"] });
      expect(removeInventoryItem).toHaveBeenCalledWith(["eggs"], userId);
    });

    it("returns a confirmation message", async () => {
      const tools = buildChatTools(userId);
      const result = await tools.removeInventoryItem.execute({ itemNames: ["eggs"] });
      expect(result).toHaveProperty("content");
    });
  });
});
