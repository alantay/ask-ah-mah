import { NotFoundError, UnauthorizedError } from "./errors";

describe("NotFoundError", () => {
  it("carries statusCode 404", () => {
    expect(new NotFoundError().statusCode).toBe(404);
  });

  it("builds a readable message from the resource name", () => {
    expect(new NotFoundError("Recipe").message).toBe("Recipe not found");
  });

  it("falls back to a generic message when no resource is given", () => {
    expect(new NotFoundError().message).toBe("Not found");
  });

  it("is instanceof Error", () => {
    expect(new NotFoundError()).toBeInstanceOf(Error);
  });
});

describe("UnauthorizedError", () => {
  it("carries statusCode 401", () => {
    expect(new UnauthorizedError().statusCode).toBe(401);
  });

  it("has message Unauthorized", () => {
    expect(new UnauthorizedError().message).toBe("Unauthorized");
  });

  it("is instanceof Error", () => {
    expect(new UnauthorizedError()).toBeInstanceOf(Error);
  });
});
