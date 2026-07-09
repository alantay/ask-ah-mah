import { NotFoundError } from "@/lib/errors";
import { updateRecipeForUser } from "@/lib/recipes";
import { getSessionUserId } from "@/lib/session";
import { NextRequest } from "next/server";
import { PATCH } from "./route";

jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
    })),
  },
}));

// Identity comes from the verified session, never the request body.
jest.mock("@/lib/session", () => ({
  getSessionUserId: jest.fn(),
}));

jest.mock("@/lib/recipes", () => ({
  updateRecipeForUser: jest.fn(),
}));

const mockedUpdateRecipeForUser = jest.mocked(updateRecipeForUser);
const mockedGetSessionUserId = jest.mocked(getSessionUserId);

const validRecipeBlock = {
  title: "Mapo Tofu",
  baseServings: 2,
  ingredients: [{ name: "tofu", category: "Protein" }],
  steps: [{ title: "Cook", body: "Cook it" }],
};

const makeRequest = (body: unknown) => ({ json: async () => body }) as NextRequest;
const params = Promise.resolve({ id: "recipe-1" });

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
  mockedGetSessionUserId.mockResolvedValue("user-123");
});

afterEach(() => jest.restoreAllMocks());

describe("PATCH /api/recipe/[id]", () => {
  it("returns 401 without touching the db when unauthenticated", async () => {
    mockedGetSessionUserId.mockResolvedValue(null);

    const res = await PATCH(makeRequest({ recipe: validRecipeBlock }), { params });

    expect(res.status).toBe(401);
    expect(mockedUpdateRecipeForUser).not.toHaveBeenCalled();
  });

  it("persists cooked: true when set on the recipe payload", async () => {
    mockedUpdateRecipeForUser.mockResolvedValue({ id: "recipe-1", cooked: true } as never);

    const res = await PATCH(
      makeRequest({ recipe: { ...validRecipeBlock, cooked: true } }),
      { params },
    );

    expect(res.status).toBe(200);
    expect(mockedUpdateRecipeForUser).toHaveBeenCalledWith(
      "recipe-1",
      "user-123",
      expect.objectContaining({ cooked: true }),
    );
  });

  it("persists cooked: false when explicitly set (uncheck)", async () => {
    mockedUpdateRecipeForUser.mockResolvedValue({ id: "recipe-1", cooked: false } as never);

    const res = await PATCH(
      makeRequest({ recipe: { ...validRecipeBlock, cooked: false } }),
      { params },
    );

    expect(res.status).toBe(200);
    expect(mockedUpdateRecipeForUser).toHaveBeenCalledWith(
      "recipe-1",
      "user-123",
      expect.objectContaining({ cooked: false }),
    );
  });

  it("accepts a recipe payload without cooked", async () => {
    mockedUpdateRecipeForUser.mockResolvedValue({ id: "recipe-1" } as never);

    const res = await PATCH(makeRequest({ recipe: validRecipeBlock }), { params });

    expect(res.status).toBe(200);
    const callArg = mockedUpdateRecipeForUser.mock.calls[0][2];
    expect(callArg.cooked).toBeUndefined();
  });

  it("returns 404 when the recipe is not found or not owned by the user", async () => {
    mockedUpdateRecipeForUser.mockRejectedValue(new NotFoundError("Recipe"));

    const res = await PATCH(makeRequest({ recipe: validRecipeBlock }), { params });

    expect(res.status).toBe(404);
  });

  it("returns 400 for an invalid recipe payload", async () => {
    const res = await PATCH(makeRequest({ recipe: { title: "Missing fields" } }), {
      params,
    });

    expect(res.status).toBe(400);
    expect(mockedUpdateRecipeForUser).not.toHaveBeenCalled();
  });
});
