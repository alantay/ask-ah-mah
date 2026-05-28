import { chatErrorResponse } from "./errors";

describe("chatErrorResponse", () => {
  it("returns 503 status when error message contains '503'", async () => {
    const error = new Error("Service 503 unavailable");
    const response = chatErrorResponse(error);
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.retryable).toBe(true);
    expect(body.error).toContain("unavailable");
  });

  it("returns 500 for generic errors", async () => {
    const error = new Error("Something random broke");
    const response = chatErrorResponse(error);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.retryable).toBe(false);
  });

  it("returns 500 for non-Error thrown values", async () => {
    const response = chatErrorResponse("a string error");
    expect(response.status).toBe(500);
  });

  it("returns a Response object", () => {
    const response = chatErrorResponse(new Error("boom"));
    expect(response).toBeInstanceOf(Response);
  });
});
