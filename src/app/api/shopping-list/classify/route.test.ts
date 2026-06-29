import { NextRequest } from "next/server";
import { POST } from "./route";
import { classifyPendingAisles } from "@/lib/shoppingList";
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
  classifyPendingAisles: jest.fn(),
}));

jest.mock("@/lib/session", () => ({ getSessionUserId: jest.fn() }));

const mockedClassify = jest.mocked(classifyPendingAisles);
const mockedGetSessionUserId = jest.mocked(getSessionUserId);

const reqWith = (body: unknown) =>
  ({ json: async () => body } as unknown as NextRequest);

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
  mockedGetSessionUserId.mockResolvedValue("user-123");
});

afterEach(() => jest.restoreAllMocks());

describe("POST /api/shopping-list/classify", () => {
  it("classifies the session user's pending rows and reports success", async () => {
    const res = await POST(reqWith({}));
    const body = await res.json();

    expect(mockedClassify).toHaveBeenCalledWith("user-123");
    expect(body).toEqual({ success: true });
  });

  it("401s when unauthenticated", async () => {
    mockedGetSessionUserId.mockResolvedValue(null);
    const res = await POST(reqWith({}));

    expect(res.status).toBe(401);
    expect(mockedClassify).not.toHaveBeenCalled();
  });

  it("ignores a userId in the body and classifies for the session user", async () => {
    await POST(reqWith({ userId: "victim-999" }));

    expect(mockedClassify).toHaveBeenCalledTimes(1);
    expect(mockedClassify).toHaveBeenCalledWith("user-123");
  });

  it("500s when the service throws", async () => {
    mockedClassify.mockRejectedValue(new Error("model down"));

    const res = await POST(reqWith({}));

    expect(res.status).toBe(500);
  });
});
