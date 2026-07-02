const mockSend = jest.fn();

jest.mock("resend", () => ({
  // Defer the mockSend reference into the call so the hoisted module import
  // (which constructs Resend at load time) doesn't touch it before init.
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: (...args: unknown[]) => mockSend(...args) },
  })),
}));

// The module instantiates Resend at import time, so env must be set first.
const previousApiKey = process.env.RESEND_API_KEY;
const previousFromEmail = process.env.RESEND_FROM_EMAIL;
process.env.RESEND_API_KEY = "test-key";
process.env.RESEND_FROM_EMAIL = "ah-mah@example.com";

import { sendMagicLink } from "./sendMagicLink";

describe("sendMagicLink", () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  afterAll(() => {
    process.env.RESEND_API_KEY = previousApiKey;
    process.env.RESEND_FROM_EMAIL = previousFromEmail;
  });

  it("sends the link to the given address with the branded subject and url", async () => {
    mockSend.mockResolvedValue({ data: { id: "email_1" }, error: null });

    await sendMagicLink({
      email: "cook@example.com",
      url: "https://ahmah.test/verify?token=abc",
    });

    expect(mockSend).toHaveBeenCalledTimes(1);
    const payload = mockSend.mock.calls[0][0];
    expect(payload.to).toBe("cook@example.com");
    expect(payload.from).toBe("ah-mah@example.com");
    expect(payload.subject).toMatch(/Ah Mah/i);
    expect(payload.html).toContain("https://ahmah.test/verify?token=abc");
  });

  it("throws when Resend reports a delivery error", async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: "bad address" } });

    await expect(
      sendMagicLink({ email: "cook@example.com", url: "https://ahmah.test/x" }),
    ).rejects.toThrow(/bad address/);
  });
});
