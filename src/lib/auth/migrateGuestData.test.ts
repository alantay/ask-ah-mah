import { prisma } from "@/lib/db";
import { migrateGuestData } from "./migrateGuestData";

// Mock Prisma. The interactive transaction runs its callback against the same
// mock so every reassignment is observable on the shared jest.fn()s.
jest.mock("@/lib/db", () => {
  const prismaMock: Record<string, unknown> = {
    recipe: { updateMany: jest.fn() },
    conversation: { updateMany: jest.fn() },
    message: { updateMany: jest.fn() },
    inventoryItem: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    shoppingListItem: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((cb: (tx: unknown) => unknown) => cb(prismaMock)),
  };
  return { prisma: prismaMock };
});

const mockedPrisma = jest.mocked(prisma);

const ANON = "anon-1";
const NEW = "google-1";

describe("migrateGuestData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: the destination account is empty, so nothing collides.
    mockedPrisma.inventoryItem.findMany.mockResolvedValue([] as never);
    mockedPrisma.shoppingListItem.findMany.mockResolvedValue([] as never);
  });

  it("reassigns recipes, conversations, and messages to the new user", async () => {
    await migrateGuestData(ANON, NEW);

    for (const model of [
      mockedPrisma.recipe,
      mockedPrisma.conversation,
      mockedPrisma.message,
    ]) {
      expect(model.updateMany).toHaveBeenCalledWith({
        where: { userId: ANON },
        data: { userId: NEW },
      });
    }
  });

  it("moves all guest inventory when the destination has none", async () => {
    mockedPrisma.inventoryItem.findMany
      .mockResolvedValueOnce([] as never) // destination
      .mockResolvedValueOnce([
        { id: "i1", name: "egg", type: "fridge" },
        { id: "i2", name: "rice", type: "pantry" },
      ] as never); // guest

    await migrateGuestData(ANON, NEW);

    expect(mockedPrisma.inventoryItem.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["i1", "i2"] } },
      data: { userId: NEW },
    });
    expect(mockedPrisma.inventoryItem.deleteMany).not.toHaveBeenCalled();
  });

  it("skips colliding inventory and drops the guest duplicate", async () => {
    mockedPrisma.inventoryItem.findMany
      .mockResolvedValueOnce([{ name: "egg", type: "fridge" }] as never) // destination owns "egg fridge"
      .mockResolvedValueOnce([
        { id: "i1", name: "egg", type: "fridge" }, // collides → drop
        { id: "i2", name: "rice", type: "pantry" }, // unique → move
      ] as never);

    await migrateGuestData(ANON, NEW);

    expect(mockedPrisma.inventoryItem.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["i2"] } },
      data: { userId: NEW },
    });
    expect(mockedPrisma.inventoryItem.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["i1"] } },
    });
  });

  it("moves all guest shopping-list items when the destination has none", async () => {
    mockedPrisma.shoppingListItem.findMany
      .mockResolvedValueOnce([] as never) // destination
      .mockResolvedValueOnce([
        { id: "s1", key: "egg" },
        { id: "s2", key: "rice" },
      ] as never); // guest

    await migrateGuestData(ANON, NEW);

    expect(mockedPrisma.shoppingListItem.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["s1", "s2"] } },
      data: { userId: NEW },
    });
    expect(mockedPrisma.shoppingListItem.deleteMany).not.toHaveBeenCalled();
  });

  it("skips colliding shopping-list items and drops the guest duplicate", async () => {
    mockedPrisma.shoppingListItem.findMany
      .mockResolvedValueOnce([{ key: "egg" }] as never) // destination owns "egg"
      .mockResolvedValueOnce([
        { id: "s1", key: "egg" }, // collides → drop
        { id: "s2", key: "rice" }, // unique → move
      ] as never);

    await migrateGuestData(ANON, NEW);

    expect(mockedPrisma.shoppingListItem.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["s2"] } },
      data: { userId: NEW },
    });
    expect(mockedPrisma.shoppingListItem.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["s1"] } },
    });
  });

  it("is a no-op when the anonymous and new user are the same", async () => {
    await migrateGuestData(NEW, NEW);

    expect(mockedPrisma.$transaction).not.toHaveBeenCalled();
    expect(mockedPrisma.recipe.updateMany).not.toHaveBeenCalled();
  });
});
