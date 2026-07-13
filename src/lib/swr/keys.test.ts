import {
  conversationListKey,
  inventoryKey,
  marketTipKey,
  messageKey,
  recipeKey,
  shoppingListKey,
  storageTipKey,
} from "./keys";

const DIRTY_USER_ID = "user id&more";
const ENCODED_DIRTY_USER_ID = encodeURIComponent(DIRTY_USER_ID);

describe("swr key factory", () => {
  it("builds the recipe key, URL-encoding the userId", () => {
    expect(recipeKey("user-1")).toBe("/api/recipe?userId=user-1");
    expect(recipeKey(DIRTY_USER_ID)).toBe(
      `/api/recipe?userId=${ENCODED_DIRTY_USER_ID}`,
    );
  });

  it("builds the inventory key, URL-encoding the userId", () => {
    expect(inventoryKey("user-1")).toBe("/api/inventory?userId=user-1");
    expect(inventoryKey(DIRTY_USER_ID)).toBe(
      `/api/inventory?userId=${ENCODED_DIRTY_USER_ID}`,
    );
  });

  it("builds the shopping-list key, URL-encoding the userId", () => {
    expect(shoppingListKey("user-1")).toBe(
      "/api/shopping-list?userId=user-1",
    );
    expect(shoppingListKey(DIRTY_USER_ID)).toBe(
      `/api/shopping-list?userId=${ENCODED_DIRTY_USER_ID}`,
    );
  });

  it("builds the message key, URL-encoding the conversationId", () => {
    expect(messageKey("conv-1")).toBe(
      "/api/message?conversationId=conv-1",
    );
    expect(messageKey(DIRTY_USER_ID)).toBe(
      `/api/message?conversationId=${ENCODED_DIRTY_USER_ID}`,
    );
  });

  it("builds the conversation list key as a tuple, URL-encoding the userId", () => {
    expect(conversationListKey("user-1")).toEqual([
      "/api/conversation",
      "user-1",
    ]);
    expect(conversationListKey(DIRTY_USER_ID)).toEqual([
      "/api/conversation",
      ENCODED_DIRTY_USER_ID,
    ]);
  });

  it("builds the market-tip key from sorted canonical names", () => {
    expect(marketTipKey(["banana", "apple"])).toBe("market-tip:apple|banana");
  });

  it("builds the storage-tip key from sorted canonical names", () => {
    expect(storageTipKey(["banana", "apple"])).toBe(
      "storage-tip:apple|banana",
    );
  });
});
