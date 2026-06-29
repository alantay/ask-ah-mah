import { getSessionUserId } from "./session";
import { auth } from "@/lib/auth";

jest.mock("@/lib/auth", () => ({
  auth: { api: { getSession: jest.fn() } },
}));

const getSession = auth.api.getSession as unknown as jest.Mock;

// The helper only reads `req.headers`, so a minimal stub stands in for a real
// Request (which isn't a global in the jsdom test environment).
function fakeRequest(headers: Record<string, string> = {}): Request {
  return { headers } as unknown as Request;
}

describe("getSessionUserId", () => {
  afterEach(() => jest.clearAllMocks());

  it("returns the verified user id from the session", async () => {
    getSession.mockResolvedValue({ user: { id: "user-123" } });

    await expect(getSessionUserId(fakeRequest())).resolves.toBe("user-123");
  });

  it("returns null when there is no session", async () => {
    getSession.mockResolvedValue(null);

    await expect(getSessionUserId(fakeRequest())).resolves.toBeNull();
  });

  it("passes the request headers through to better-auth", async () => {
    getSession.mockResolvedValue({ user: { id: "user-123" } });
    const req = fakeRequest({ cookie: "better-auth.session_token=abc" });

    await getSessionUserId(req);

    expect(getSession).toHaveBeenCalledWith({ headers: req.headers });
  });
});
