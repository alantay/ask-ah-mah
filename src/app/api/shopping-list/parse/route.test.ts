import { NextRequest } from "next/server";
import { POST } from "./route";
import { addShoppingListItems } from "@/lib/shoppingList";
import { parseShoppingListText } from "@/lib/shoppingList/parseText";
import { getSessionUserId } from "@/lib/session";

jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
    })),
  },
}));

jest.mock("@/lib/shoppingList", () => ({
  addShoppingListItems: jest.fn(),
}));

jest.mock("@/lib/shoppingList/parseText", () => ({
  parseShoppingListText: jest.fn(),
}));

jest.mock("@/lib/session", () => ({ getSessionUserId: jest.fn() }));

const mockedParse = jest.mocked(parseShoppingListText);
const mockedAdd = jest.mocked(addShoppingListItems);
const mockedGetSessionUserId = jest.mocked(getSessionUserId);

const reqWith = (body: unknown) =>
  ({ json: async () => body } as unknown as NextRequest);

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
  mockedGetSessionUserId.mockResolvedValue("user-123");
});

afterEach(() => jest.restoreAllMocks());

describe("POST /api/shopping-list/parse", () => {
  it("extracts items from the pasted text and persists them for the session user", async () => {
    const items = [
      { name: "Chipotle paste", category: "Condiments" },
      { name: "Cherry tomatoes", category: "Vegetable" },
    ];
    mockedParse.mockResolvedValue(items);

    const res = await POST(reqWith({ text: "1 tsp chipotle paste\n7 cherry tomatoes" }));
    const body = await res.json();

    expect(mockedParse).toHaveBeenCalledWith("1 tsp chipotle paste\n7 cherry tomatoes");
    expect(mockedAdd).toHaveBeenCalledWith(items, "user-123");
    expect(body).toEqual({
      success: true,
      items,
      message: "Added 2 item(s)",
    });
  });

  it("400s when text is missing", async () => {
    const res = await POST(reqWith({}));

    expect(res.status).toBe(400);
    expect(mockedParse).not.toHaveBeenCalled();
  });

  it("400s when text is blank", async () => {
    const res = await POST(reqWith({ text: "   " }));

    expect(res.status).toBe(400);
    expect(mockedParse).not.toHaveBeenCalled();
  });

  it("401s when unauthenticated", async () => {
    mockedGetSessionUserId.mockResolvedValue(null);

    const res = await POST(reqWith({ text: "milk" }));

    expect(res.status).toBe(401);
    expect(mockedParse).not.toHaveBeenCalled();
  });

  it("500s when the model call throws", async () => {
    mockedParse.mockRejectedValue(new Error("model down"));

    const res = await POST(reqWith({ text: "milk" }));

    expect(res.status).toBe(500);
    expect(mockedAdd).not.toHaveBeenCalled();
  });

  it("500s when persistence throws", async () => {
    mockedParse.mockResolvedValue([{ name: "Milk", category: "Misc" }]);
    mockedAdd.mockRejectedValue(new Error("db down"));

    const res = await POST(reqWith({ text: "milk" }));

    expect(res.status).toBe(500);
  });
});
