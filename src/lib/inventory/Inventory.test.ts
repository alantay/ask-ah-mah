import { prisma } from "@/lib/db";
import { addInventoryItem, removeInventoryItem } from "./Inventory";

jest.mock("@/lib/db", () => ({
  prisma: {
    inventoryItem: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

// Cast once: Prisma's upsert arg type is a big union, and asserting on
// `.mock.calls` through it fights the compiler for no benefit here.
const upsert = prisma.inventoryItem.upsert as unknown as jest.Mock;
const deleteMany = prisma.inventoryItem.deleteMany as unknown as jest.Mock;
const USER = "user-1";

describe("addInventoryItem", () => {
  beforeEach(() => jest.clearAllMocks());

  it("stores the canonical key alongside the display name", async () => {
    await addInventoryItem([{ name: "Shallots", type: "ingredient" }], USER);

    const call = upsert.mock.calls[0][0];
    expect(call.create).toMatchObject({ name: "Shallots", canonicalKey: "shallot" });
  });

  it("preserves existing stock details when a recipe tick supplies no replacements", async () => {
    const stored = { quantity: 200, unit: "g", category: "Protein" };
    upsert.mockImplementationOnce(async ({ update }) => Object.assign(stored, update));
    await addInventoryItem([{ name: "Fish", type: "ingredient" }], USER, { preserveUnspecifiedFields: true });
    expect(stored).toMatchObject({ quantity: 200, unit: "g", category: "Protein" });
  });

  it("applies explicit recipe stock details while preserving unspecified fields", async () => {
    const stored = { quantity: 200, unit: "g", category: "Protein" };
    upsert.mockImplementationOnce(async ({ update }) => Object.assign(stored, update));
    await addInventoryItem([{ name: "Fish", type: "ingredient", quantity: 2, unit: "pieces" }], USER, { preserveUnspecifiedFields: true });
    expect(stored).toMatchObject({ quantity: 2, unit: "pieces", category: "Protein" });
  });

  it("retains the existing unspecified-means-unlimited behavior for ordinary writes", async () => {
    const stored = { quantity: 200, unit: "g", category: "Protein" };
    upsert.mockImplementationOnce(async ({ update }) => Object.assign(stored, update));
    await addInventoryItem([{ name: "Fish", type: "ingredient" }], USER);
    expect(stored).toMatchObject({ quantity: null, unit: null, category: null });
  });

  it("never overwrites the display name of a row that already exists", async () => {
    await addInventoryItem([{ name: "Shallots", type: "ingredient" }], USER);

    const call = upsert.mock.calls[0][0];
    expect(call.update).not.toHaveProperty("name");
  });

  it("gives form variants different keys so they stay separate rows", async () => {
    await addInventoryItem(
      [
        { name: "Chilli", type: "ingredient" },
        { name: "Dried chilli", type: "ingredient" },
      ],
      USER,
    );

    const keys = upsert.mock.calls.map(
      ([arg]) => arg.create.canonicalKey as string,
    );
    expect(keys).toEqual(["chilli", "dried chilli"]);
  });

  it("resolves the row to upsert by canonical key, not display name", async () => {
    await addInventoryItem([{ name: "Shallots", type: "ingredient" }], USER);

    const call = upsert.mock.calls[0][0];
    expect(call.where).toEqual({
      userId_canonicalKey_type: {
        userId: USER,
        canonicalKey: "shallot",
        type: "ingredient",
      },
    });
  });
});

describe("removeInventoryItem", () => {
  beforeEach(() => jest.clearAllMocks());

  it("deletes by canonical key, so a plural removes the singular row", async () => {
    await removeInventoryItem(["Shallots"], USER);

    expect(deleteMany).toHaveBeenCalledWith({
      where: { userId: USER, canonicalKey: { in: ["shallot"] } },
    });
  });
});
