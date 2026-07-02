import { getSessionUserId } from "@/lib/session";
import { NextRequest } from "next/server";
import { withAuth, withAuthDynamic } from "./withAuth";

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

const mockedGetSessionUserId = jest.mocked(getSessionUserId);
const makeRequest = () => ({}) as NextRequest;

describe("withAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetSessionUserId.mockResolvedValue("user-123");
  });

  it("returns 401 and does not call handler when unauthenticated", async () => {
    mockedGetSessionUserId.mockResolvedValue(null);
    const handler = jest.fn();
    const route = withAuth(handler);
    const res = await route(makeRequest());
    expect(res.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("calls handler with injected userId when authenticated", async () => {
    const handler = jest.fn().mockResolvedValue(new Response(null, { status: 200 }));
    const route = withAuth(handler);
    await route(makeRequest());
    expect(handler).toHaveBeenCalledWith(expect.anything(), { userId: "user-123" });
  });
});

describe("withAuthDynamic", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetSessionUserId.mockResolvedValue("user-123");
  });

  it("returns 401 and does not call handler when unauthenticated", async () => {
    mockedGetSessionUserId.mockResolvedValue(null);
    const handler = jest.fn();
    const route = withAuthDynamic(handler);
    const params = Promise.resolve({ id: "r1" });
    const res = await route(makeRequest(), { params });
    expect(res.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("calls handler with userId and params when authenticated", async () => {
    const handler = jest.fn().mockResolvedValue(new Response(null, { status: 200 }));
    const route = withAuthDynamic(handler);
    const params = Promise.resolve({ id: "r1" });
    await route(makeRequest(), { params });
    expect(handler).toHaveBeenCalledWith(
      expect.anything(),
      { userId: "user-123", params }
    );
  });
});
