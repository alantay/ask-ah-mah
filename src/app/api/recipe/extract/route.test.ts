import { NextRequest } from "next/server";
import { POST } from "./route";
import { getSessionUserId } from "@/lib/session";
import { parseRecipeText } from "@/lib/recipes/parseRecipeText";

jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
    })),
  },
}));

jest.mock("@/lib/recipes/parseRecipeText", () => ({
  parseRecipeText: jest.fn(),
}));
jest.mock("@/lib/session", () => ({ getSessionUserId: jest.fn() }));

const mockedParse = jest.mocked(parseRecipeText);
const mockedGetSessionUserId = jest.mocked(getSessionUserId);

const reqWith = (body: unknown) =>
  ({ json: async () => body } as unknown as NextRequest);

beforeEach(() => {
  jest.clearAllMocks();
  mockedGetSessionUserId.mockResolvedValue("user-123");
});

describe("POST /api/recipe/extract", () => {
  it("401s when unauthenticated, without calling the model", async () => {
    mockedGetSessionUserId.mockResolvedValue(null);

    const res = await POST(reqWith({ text: "1 egg\nfry it" }));

    expect(res.status).toBe(401);
    expect(mockedParse).not.toHaveBeenCalled();
  });

  it("400s when text is missing", async () => {
    const res = await POST(reqWith({}));

    expect(res.status).toBe(400);
    expect(mockedParse).not.toHaveBeenCalled();
  });

  it("returns the parsed block for a valid recipe", async () => {
    const block = {
      ingredients: [{ name: "egg" }],
      steps: ["fry it"],
    };
    mockedParse.mockResolvedValue(block as never);

    const res = await POST(reqWith({ text: "1 egg\nfry it" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(block);
  });

  it("422s when no recipe can be found in the text", async () => {
    mockedParse.mockResolvedValue({ ingredients: [], steps: [] } as never);

    const res = await POST(reqWith({ text: "just some prose" }));

    expect(res.status).toBe(422);
  });
});
