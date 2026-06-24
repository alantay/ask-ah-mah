import { prisma } from "@/lib/db";
import { addShoppingListItems, getShoppingList } from "./shoppingList";
import { canonicalShoppingKey } from "./canonicalKey";

jest.mock("@/lib/db", () => ({
  prisma: {
    shoppingListItem: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

const mockedFindMany = jest.mocked(prisma.shoppingListItem.findMany);
const mockedUpsert = jest.mocked(prisma.shoppingListItem.upsert);

beforeEach(() => {
  jest.clearAllMocks();
  mockedUpsert.mockResolvedValue({} as never);
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
