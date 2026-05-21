import "@testing-library/jest-dom";

// Mock better-auth client to avoid ESM parse errors in jsdom
jest.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => ({ data: null, isPending: false }),
    signIn: { social: jest.fn() },
    signOut: jest.fn(),
  },
}));

// Polyfill Web Streams API and Response for ai-sdk in jsdom environment
const { ReadableStream, WritableStream, TransformStream } = require("stream/web");
Object.assign(global, { ReadableStream, WritableStream, TransformStream });
if (typeof global.Response === "undefined") {
  global.Response = class Response {
    status: number;
    private body: string;
    constructor(body: string, init?: { status?: number }) {
      this.body = body;
      this.status = init?.status ?? 200;
    }
    async json() { return JSON.parse(this.body); }
  } as unknown as typeof Response;
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
