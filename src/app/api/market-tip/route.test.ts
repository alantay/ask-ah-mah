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
    marketTip: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock("ai", () => ({ generateObject: jest.fn() }));
jest.mock("@ai-sdk/openai", () => ({ openai: jest.fn(() => "model") }));
jest.mock("@/lib/session", () => ({ getSessionUserId: jest.fn() }));

const mockedFindMany = jest.mocked(prisma.marketTip.findMany);
const mockedCreate = jest.mocked(prisma.marketTip.create);
const mockedGenerate = jest.mocked(generateObject);
const mockedGetSessionUserId = jest.mocked(getSessionUserId);

const reqWith = (body: unknown) =>
  ({ json: async () => body } as unknown as NextRequest);

beforeEach(() => {
  jest.clearAllMocks();
  mockedCreate.mockResolvedValue({} as never);
  mockedGetSessionUserId.mockResolvedValue("user-123");
});

describe("POST /api/market-tip", () => {
  it("401s when unauthenticated, without calling the model", async () => {
    mockedGetSessionUserId.mockResolvedValue(null);

    const res = await POST(reqWith({ items: [{ name: "Tomato" }] }));

    expect(res.status).toBe(401);
    expect(mockedGenerate).not.toHaveBeenCalled();
    expect(mockedFindMany).not.toHaveBeenCalled();
  });

  it("returns cached tips without calling the model", async () => {
    mockedFindMany.mockResolvedValue([
      { key: "tomato", tip: "deep red, no bruises", createdAt: new Date() },
    ] as never);

    const res = await POST(reqWith({ items: [{ name: "Tomato", category: "Vegetable" }] }));
    const body = await res.json();

    expect(body.tips).toEqual({ tomato: "deep red, no bruises" });
    expect(mockedGenerate).not.toHaveBeenCalled();
  });

  it("generates and caches tips for pickable misses", async () => {
    mockedFindMany.mockResolvedValue([] as never);
    mockedGenerate.mockResolvedValue({
      object: { tips: [{ key: "avocado", tip: "dark, gives slightly = ripe today" }] },
    } as never);

    const res = await POST(reqWith({ items: [{ name: "Avocado", category: "Misc" }] }));
    const body = await res.json();

    expect(body.tips.avocado).toBe("dark, gives slightly = ripe today");
    expect(mockedGenerate).toHaveBeenCalledTimes(1);
    expect(mockedCreate).toHaveBeenCalledWith({
      data: { key: "avocado", tip: "dark, gives slightly = ripe today" },
    });
  });

  it("negative-caches non-pickable staples without a model call", async () => {
    mockedFindMany.mockResolvedValue([] as never);

    const res = await POST(reqWith({ items: [{ name: "Flour", category: "Carbs" }] }));
    const body = await res.json();

    expect(body.tips.flour).toBe("");
    expect(mockedGenerate).not.toHaveBeenCalled();
    expect(mockedCreate).toHaveBeenCalledWith({ data: { key: "flour", tip: "" } });
  });

  it("negative-caches an out-of-domain item the model rejects (relevance gate)", async () => {
    // A non-kitchen item (climbing harness) passes the category pre-filter
    // but the prompt's kitchen-domain rule makes the model return "".
    mockedFindMany.mockResolvedValue([] as never);
    mockedGenerate.mockResolvedValue({
      object: { tips: [{ key: "climbing harness", tip: "" }] },
    } as never);

    const res = await POST(
      reqWith({ items: [{ name: "Climbing harness", category: "Misc" }] }),
    );
    const body = await res.json();

    expect(body.tips["climbing harness"]).toBe("");
    expect(mockedCreate).toHaveBeenCalledWith({
      data: { key: "climbing harness", tip: "" },
    });
  });

  it("400s when items is missing", async () => {
    const res = await POST(reqWith({}));
    expect(res.status).toBe(400);
  });

  it("does not cache a model omission, but still returns an empty tip", async () => {
    mockedFindMany.mockResolvedValue([] as never);
    mockedGenerate.mockResolvedValue({
      object: { tips: [] },
    } as never);

    const res = await POST(reqWith({ items: [{ name: "Avocado", category: "Misc" }] }));
    const body = await res.json();

    expect(body.tips.avocado).toBe("");
    expect(mockedGenerate).toHaveBeenCalledTimes(1);
    expect(mockedCreate).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ key: "avocado" }) }),
    );
  });
});
