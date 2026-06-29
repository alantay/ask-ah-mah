import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { getSessionUserId } from "@/lib/session";
import { NextRequest } from "next/server";
import { POST } from "./route";

jest.mock("@ai-sdk/openai", () => ({ openai: jest.fn() }));

jest.mock("ai", () => ({ generateText: jest.fn() }));

// Identity comes from the verified session, not the request body.
jest.mock("@/lib/session", () => ({ getSessionUserId: jest.fn() }));

jest.mock("next/server", () => {
  const NextResponse = jest.fn((body, init) => ({
    kind: "raw",
    text: async () => body,
    status: init?.status ?? 200,
    headers: new Map(Object.entries(init?.headers ?? {})),
  }));
  // @ts-expect-error attach static like the real NextResponse
  NextResponse.json = jest.fn((data: unknown, init?: { status?: number }) => ({
    kind: "json",
    json: async () => data,
    status: init?.status ?? 200,
  }));
  return { NextRequest: jest.fn(), NextResponse };
});

const mockedGenerateText = jest.mocked(generateText);
const mockedOpenai = jest.mocked(openai);
const mockedGetSessionUserId = jest.mocked(getSessionUserId);

const validRecipeBlock = {
  id: "recipe-1",
  title: "Mapo Tofu",
  baseServings: 2,
  ingredients: [{ name: "tofu" }],
  steps: [{ title: "Cook", body: "Cook it" }],
};

// The route passes the model's text through untouched; the client validates the
// patch shape. A representative patch: one changed array + the change list.
const tweakJson = JSON.stringify({
  steps: [{ title: "Cook", body: "Cook it gently, less chili" }],
  changes: [{ kind: "step_replaced", label: "Toned it down" }],
});

const makeRequest = (body: unknown) => ({ json: async () => body }) as NextRequest;
const params = Promise.resolve({ id: "recipe-1" });

const baseBody = {
  instruction: "less spicy",
  originalRecipe: validRecipeBlock,
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
  mockedOpenai.mockReturnValue("mock-model" as unknown as ReturnType<typeof openai>);
  // Default: an authenticated caller. Tests override to simulate no session.
  mockedGetSessionUserId.mockResolvedValue("user-123");
});

afterEach(() => jest.restoreAllMocks());

describe("POST /api/recipe/[id]/tweak", () => {
  it("returns 401 without ever calling the model when unauthenticated", async () => {
    mockedGetSessionUserId.mockResolvedValue(null);

    const res = await POST(makeRequest(baseBody), { params });

    expect(res.status).toBe(401);
    expect(mockedGenerateText).not.toHaveBeenCalled();
  });

  it("requests a generous output token ceiling (not the old 2000 cap)", async () => {
    mockedGenerateText.mockResolvedValue({
      text: tweakJson,
      finishReason: "stop",
    } as unknown as Awaited<ReturnType<typeof generateText>>);

    await POST(makeRequest(baseBody), { params });

    expect(mockedGenerateText).toHaveBeenCalledWith(
      expect.objectContaining({ maxOutputTokens: 8000 }),
    );
  });

  it("returns the generated text with a 200 when generation completes normally", async () => {
    mockedGenerateText.mockResolvedValue({
      text: tweakJson,
      finishReason: "stop",
    } as unknown as Awaited<ReturnType<typeof generateText>>);

    const res = await POST(makeRequest(baseBody), { params });

    expect(res.status).toBe(200);
    expect(await res.text()).toBe(tweakJson);
  });

  it("fails cleanly with a non-2xx when generation is cut off by length", async () => {
    const truncated = tweakJson.slice(0, 40); // half-written, as a token cap would leave it
    mockedGenerateText.mockResolvedValue({
      text: truncated,
      finishReason: "length",
    } as unknown as Awaited<ReturnType<typeof generateText>>);

    const res = await POST(makeRequest(baseBody), { params });

    expect(res.status).toBe(422);
    // The partial/truncated text must never be returned as a successful body
    const payload = await res.json();
    expect(JSON.stringify(payload)).not.toContain(truncated);
    expect(payload).toHaveProperty("error");
  });
});
