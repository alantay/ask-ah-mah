import { GET } from "./route";
import { getMessagePhoto } from "@/lib/messages";
import { getSessionUserId } from "@/lib/session";
import type { NextRequest } from "next/server";

jest.mock("@/lib/messages", () => ({ getMessagePhoto: jest.fn() }));
jest.mock("@/lib/session", () => ({ getSessionUserId: jest.fn() }));
jest.mock("next/server", () => ({
  NextResponse: { json: jest.fn((_body, init) => ({ status: init.status })) },
}));

const request = {} as NextRequest;
const context = { params: Promise.resolve({ id: "photo-1" }) };

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getSessionUserId).mockResolvedValue("owner");
});

it("requires a session before reading any photo", async () => {
  jest.mocked(getSessionUserId).mockResolvedValue(null);
  expect((await GET(request, context)).status).toBe(401);
  expect(getMessagePhoto).not.toHaveBeenCalled();
});

it("returns 404 for missing or foreign photos", async () => {
  jest.mocked(getMessagePhoto).mockResolvedValue(null);
  expect((await GET(request, context)).status).toBe(404);
  expect(getMessagePhoto).toHaveBeenCalledWith("photo-1", "owner");
});

it("returns the JPEG bytes with private caching and nosniff headers", async () => {
  jest.mocked(getMessagePhoto).mockResolvedValue("data:image/jpeg;base64,/9j/2Q==");
  const ResponseClass = global.Response;
  const construct = jest.spyOn(global, "Response").mockImplementation((body, init) => new ResponseClass(body, init));
  try {
    expect((await GET(request, context)).status).toBe(200);
    expect(construct).toHaveBeenCalledWith(Buffer.from([0xff, 0xd8, 0xff, 0xd9]), {
      headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
    });
  } finally {
    construct.mockRestore();
  }
});
