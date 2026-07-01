import { NextRequest } from "next/server";
import { POST } from "./route";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { generateObject } from "ai";

jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
    })),
  },
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    storageTip: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock("ai", () => ({ generateObject: jest.fn() }));
jest.mock("@ai-sdk/openai", () => ({ openai: jest.fn(() => "model") }));
jest.mock("@/lib/session", () => ({ getSessionUserId: jest.fn() }));

const mockedFindMany = jest.mocked(prisma.storageTip.findMany);
const mockedCreate = jest.mocked(prisma.storageTip.create);
const mockedGenerate = jest.mocked(generateObject);
const mockedGetSessionUserId = jest.mocked(getSessionUserId);

const reqWith = (body: unknown) =>
  ({ json: async () => body } as unknown as NextRequest);

beforeEach(() => {
  jest.clearAllMocks();
  mockedCreate.mockResolvedValue({} as never);
  mockedGetSessionUserId.mockResolvedValue("user-123");
});

describe("POST /api/storage-tip", () => {
  it("401s when unauthenticated, without calling the model", async () => {
    mockedGetSessionUserId.mockResolvedValue(null);

    const res = await POST(
      reqWith({ items: [{ name: "Potato", type: "ingredient" }] }),
    );

    expect(res.status).toBe(401);
    expect(mockedGenerate).not.toHaveBeenCalled();
    expect(mockedFindMany).not.toHaveBeenCalled();
  });

  it("returns cached tips without calling the model", async () => {
    mockedFindMany.mockResolvedValue([
      { key: "potato", tip: "cool, dark place — never the fridge", createdAt: new Date() },
    ] as never);

    const res = await POST(
      reqWith({ items: [{ name: "Potato", type: "ingredient" }] }),
    );
    const body = await res.json();

    expect(body.tips).toEqual({ potato: "cool, dark place — never the fridge" });
    expect(mockedGenerate).not.toHaveBeenCalled();
  });

  it("generates and caches keep tips for food and equipment misses", async () => {
    mockedFindMany.mockResolvedValue([] as never);
    mockedGenerate.mockResolvedValue({
      object: {
        tips: [
          { key: "wok", tip: "dry on the heat, wipe a little oil" },
          { key: "herbs", tip: "stem-down in a glass of water" },
        ],
      },
    } as never);

    const res = await POST(
      reqWith({
        items: [
          { name: "Wok", type: "kitchenware" },
          { name: "Herbs", type: "ingredient" },
        ],
      }),
    );
    const body = await res.json();

    expect(body.tips.wok).toBe("dry on the heat, wipe a little oil");
    expect(body.tips.herbs).toBe("stem-down in a glass of water");
    expect(mockedCreate).toHaveBeenCalledWith({
      data: { key: "wok", tip: "dry on the heat, wipe a little oil" },
    });
  });

  it("negative-caches an out-of-domain item the model rejects (relevance gate)", async () => {
    mockedFindMany.mockResolvedValue([] as never);
    mockedGenerate.mockResolvedValue({
      object: { tips: [{ key: "climbing harness", tip: "" }] },
    } as never);

    const res = await POST(
      reqWith({ items: [{ name: "Climbing harness", type: "kitchenware" }] }),
    );
    const body = await res.json();

    expect(body.tips["climbing harness"]).toBe("");
    expect(mockedCreate).toHaveBeenCalledWith({
      data: { key: "climbing harness", tip: "" },
    });
  });

  it("does not cache a model omission, but still returns an empty tip", async () => {
    mockedFindMany.mockResolvedValue([] as never);
    mockedGenerate.mockResolvedValue({ object: { tips: [] } } as never);

    const res = await POST(
      reqWith({ items: [{ name: "Salt", type: "ingredient" }] }),
    );
    const body = await res.json();

    expect(body.tips.salt).toBe("");
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("passes a name-only key to the model (kind kept out of the key)", async () => {
    // Regression: the kind label must not leak into the prompt's key, or the
    // model echoes "potato (ingredient)" and it never matches the cache key.
    mockedFindMany.mockResolvedValue([] as never);
    mockedGenerate.mockResolvedValue({
      object: { tips: [{ key: "potato", tip: "cool, dark place" }] },
    } as never);

    await POST(reqWith({ items: [{ name: "Potato", type: "ingredient" }] }));

    const prompt = mockedGenerate.mock.calls[0][0].prompt as string;
    expect(prompt).toContain("potato = ingredient");
    expect(prompt).not.toContain("potato (ingredient)");
  });

  it("accepts a large pantry payload (more than 30 items)", async () => {
    mockedFindMany.mockResolvedValue([] as never);
    mockedGenerate.mockResolvedValue({ object: { tips: [] } } as never);

    const items = Array.from({ length: 40 }, (_, i) => ({
      name: `item ${i}`,
      type: "ingredient",
    }));
    const res = await POST(reqWith({ items }));

    expect(res.status).toBe(200);
  });

  it("400s when items is missing", async () => {
    const res = await POST(reqWith({}));
    expect(res.status).toBe(400);
  });
});
