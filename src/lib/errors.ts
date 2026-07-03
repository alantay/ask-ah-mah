export class NotFoundError extends Error {
  readonly statusCode = 404;
  constructor(resource?: string) {
    super(resource ? `${resource} not found` : "Not found");
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends Error {
  readonly statusCode = 401;
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}
