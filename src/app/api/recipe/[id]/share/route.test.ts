import { NotFoundError } from "@/lib/errors";
import { mintShareToken } from "@/lib/recipes";
import { getSessionUserId } from "@/lib/session";
import { NextRequest } from "next/server";
import { POST } from "./route";

jest.mock("@/lib/recipes", () => ({ mintShareToken: jest.fn() }));

// Identity comes from the verified session, never the request body.
jest.mock("@/lib/session", () => ({ getSessionUserId: jest.fn() }));

jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status ?? 200,
    })),
  },
}));

const mockedMint = jest.mocked(mintShareToken);
const mockedGetSessionUserId = jest.mocked(getSessionUserId);

const makeRequest = (body?: unknown) =>
  ({ json: async () => body ?? {} }) as NextRequest;
const params = Promise.resolve({ id: "recipe-1" });

describe("POST /api/recipe/[id]/share", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: an authenticated caller. Tests override to simulate no session.
    mockedGetSessionUserId.mockResolvedValue("user-123");
  });

  it("mints a token for the owner and returns it", async () => {
    mockedMint.mockResolvedValue("tok_abc");

    const res = await POST(makeRequest(), { params });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ token: "tok_abc" });
    expect(mockedMint).toHaveBeenCalledWith("recipe-1", "user-123");
  });

  it("returns 401 without minting when unauthenticated", async () => {
    mockedGetSessionUserId.mockResolvedValue(null);

    const res = await POST(makeRequest(), { params });

    expect(res.status).toBe(401);
    expect(mockedMint).not.toHaveBeenCalled();
  });

  it("ignores a userId in the body and mints as the session user", async () => {
    mockedMint.mockResolvedValue("tok_abc");

    await POST(makeRequest({ userId: "victim-999" }), { params });

    expect(mockedMint).toHaveBeenCalledTimes(1);
    expect(mockedMint).toHaveBeenCalledWith("recipe-1", "user-123");
  });

  it("returns 404 when the recipe is not the caller's (mint throws NotFoundError)", async () => {
    mockedMint.mockRejectedValue(new NotFoundError("Recipe"));

    const res = await POST(makeRequest(), { params });

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Recipe not found" });
  });
});
