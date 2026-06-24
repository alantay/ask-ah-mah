import { NextRequest } from "next/server";
import { GET, POST } from "./route";
import { addShoppingListItems, getShoppingList } from "@/lib/shoppingList";

jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
      headers: new Map(Object.entries(init?.headers || {})),
    })),
  },
}));

jest.mock("@/lib/shoppingList", () => ({
  addShoppingListItems: jest.fn(),
  getShoppingList: jest.fn(),
}));

const mockedGet = jest.mocked(getShoppingList);
const mockedAdd = jest.mocked(addShoppingListItems);

const createMockRequest = (url: string, options: RequestInit = {}) => {
  const parsedUrl = new URL(url);
  return {
    nextUrl: { searchParams: parsedUrl.searchParams },
    json: async () => (options.body ? JSON.parse(options.body as string) : {}),
  } as NextRequest;
};

const base = "http://localhost:3000/api/shopping-list";

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe("GET /api/shopping-list", () => {
  it("returns the list for a valid userId", async () => {
    const rows = [{ id: "1", name: "Apples", bought: false }];
    mockedGet.mockResolvedValue(rows as never);

    const res = await GET(createMockRequest(`${base}?userId=u1`));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ items: rows });
    expect(mockedGet).toHaveBeenCalledWith("u1");
  });

  it("400s when userId is missing", async () => {
    const res = await GET(createMockRequest(base));
    expect(res.status).toBe(400);
    expect(mockedGet).not.toHaveBeenCalled();
  });

  it("500s when the service throws", async () => {
    mockedGet.mockRejectedValue(new Error("db down"));
    const res = await GET(createMockRequest(`${base}?userId=u1`));
    expect(res.status).toBe(500);
  });
});

describe("POST /api/shopping-list", () => {
  it("adds items for a valid payload", async () => {
    mockedAdd.mockResolvedValue(undefined);
    const items = [{ name: "Apples", category: "Fruit" }];

    const res = await POST(
      createMockRequest(base, { body: JSON.stringify({ userId: "u1", items }) }),
    );

    expect(res.status).toBe(200);
    expect(mockedAdd).toHaveBeenCalledWith(items, "u1");
  });

  it("400s when userId is missing", async () => {
    const res = await POST(
      createMockRequest(base, {
        body: JSON.stringify({ items: [{ name: "Apples" }] }),
      }),
    );
    expect(res.status).toBe(400);
    expect(mockedAdd).not.toHaveBeenCalled();
  });

  it("400s when items is not an array", async () => {
    const res = await POST(
      createMockRequest(base, {
        body: JSON.stringify({ userId: "u1", items: "nope" }),
      }),
    );
    expect(res.status).toBe(400);
    expect(mockedAdd).not.toHaveBeenCalled();
  });

  it("400s when items is an empty array", async () => {
    const res = await POST(
      createMockRequest(base, {
        body: JSON.stringify({ userId: "u1", items: [] }),
      }),
    );
    expect(res.status).toBe(400);
    expect(mockedAdd).not.toHaveBeenCalled();
  });

  it("400s when the body is malformed JSON", async () => {
    const req = {
      nextUrl: { searchParams: new URL(base).searchParams },
      json: async () => {
        throw new SyntaxError("Unexpected token");
      },
    } as unknown as NextRequest;

    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(mockedAdd).not.toHaveBeenCalled();
  });

  it("400s when an item has no name", async () => {
    const res = await POST(
      createMockRequest(base, {
        body: JSON.stringify({ userId: "u1", items: [{ category: "Fruit" }] }),
      }),
    );
    expect(res.status).toBe(400);
    expect(mockedAdd).not.toHaveBeenCalled();
  });

  it("500s when the service throws", async () => {
    mockedAdd.mockRejectedValue(new Error("db down"));
    const res = await POST(
      createMockRequest(base, {
        body: JSON.stringify({ userId: "u1", items: [{ name: "Apples" }] }),
      }),
    );
    expect(res.status).toBe(500);
  });
});
