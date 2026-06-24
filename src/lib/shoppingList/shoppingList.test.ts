import { prisma } from "@/lib/db";
import {
  addShoppingListItems,
  clearBoughtItems,
  getShoppingList,
  removeShoppingListItem,
  setBought,
} from "./shoppingList";
import { canonicalShoppingKey } from "./canonicalKey";

jest.mock("@/lib/db", () => ({
  prisma: {
    shoppingListItem: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

const mockedFindMany = jest.mocked(prisma.shoppingListItem.findMany);
const mockedUpsert = jest.mocked(prisma.shoppingListItem.upsert);
const mockedUpdateMany = jest.mocked(prisma.shoppingListItem.updateMany);
const mockedDeleteMany = jest.mocked(prisma.shoppingListItem.deleteMany);

beforeEach(() => {
  jest.clearAllMocks();
  mockedUpsert.mockResolvedValue({} as never);
  mockedUpdateMany.mockResolvedValue({ count: 1 } as never);
  mockedDeleteMany.mockResolvedValue({ count: 1 } as never);
});

describe("addShoppingListItems", () => {
  it("keys each item by its canonical shopping key", async () => {
    await addShoppingListItems([{ name: "2 apples, sliced" }], "u1");

    expect(mockedUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_key: { userId: "u1", key: canonicalShoppingKey("apple") },
        },
      }),
    );
  });

  it("merges plural and singular onto the same row key", async () => {
    await addShoppingListItems([{ name: "apple" }, { name: "Apples" }], "u1");

    const keys = mockedUpsert.mock.calls.map(
      (call) => call[0].where.userId_key?.key,
    );
    expect(keys).toEqual([
      canonicalShoppingKey("apple"),
      canonicalShoppingKey("apple"),
    ]);
  });

  it("re-adding an existing item is a no-op (empty update)", async () => {
    await addShoppingListItems([{ name: "apple" }], "u1");

    expect(mockedUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: {} }),
    );
  });

  it("creates the row with display name, category, and userId", async () => {
    await addShoppingListItems([{ name: "Apples", category: "Fruit" }], "u1");

    expect(mockedUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: {
          userId: "u1",
          key: canonicalShoppingKey("apple"),
          name: "Apples",
          category: "Fruit",
        },
      }),
    );
  });
});

describe("setBought", () => {
  it("sets the bought flag on the user's row", async () => {
    await setBought("u1", "row-1", true);

    expect(mockedUpdateMany).toHaveBeenCalledWith({
      where: { id: "row-1", userId: "u1" },
      data: { bought: true },
    });
  });

  it("scopes the update by userId so another user's row is untouched", async () => {
    await setBought("u1", "row-1", false);

    expect(mockedUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "u1" }),
      }),
    );
  });
});

describe("removeShoppingListItem", () => {
  it("deletes exactly the one user-scoped row", async () => {
    await removeShoppingListItem("u1", "row-1");

    expect(mockedDeleteMany).toHaveBeenCalledWith({
      where: { id: "row-1", userId: "u1" },
    });
  });
});

describe("clearBoughtItems", () => {
  it("deletes only the user's bought rows", async () => {
    await clearBoughtItems("u1");

    expect(mockedDeleteMany).toHaveBeenCalledWith({
      where: { userId: "u1", bought: true },
    });
  });
});

describe("getShoppingList", () => {
  it("returns the user's rows oldest-first", async () => {
    const rows = [{ id: "1", name: "Apples" }];
    mockedFindMany.mockResolvedValue(rows as never);

    const result = await getShoppingList("u1");

    expect(mockedFindMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
      orderBy: { createdAt: "asc" },
    });
    expect(result).toBe(rows);
  });
});
