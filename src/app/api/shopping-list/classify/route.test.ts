import { NextRequest } from "next/server";
import { POST } from "./route";
import { classifyPendingAisles } from "@/lib/shoppingList";

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

const mockedClassify = jest.mocked(classifyPendingAisles);

const reqWith = (body: unknown) =>
  ({ json: async () => body } as unknown as NextRequest);

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe("POST /api/shopping-list/classify", () => {
  it("classifies the user's pending rows and reports success", async () => {
    const res = await POST(reqWith({ userId: "u1" }));
    const body = await res.json();

    expect(mockedClassify).toHaveBeenCalledWith("u1");
    expect(body).toEqual({ success: true });
  });

  it("400s when userId is missing", async () => {
    const res = await POST(reqWith({}));

    expect(res.status).toBe(400);
    expect(mockedClassify).not.toHaveBeenCalled();
  });

  it("500s when the service throws", async () => {
    mockedClassify.mockRejectedValue(new Error("model down"));

    const res = await POST(reqWith({ userId: "u1" }));

    expect(res.status).toBe(500);
  });
});
