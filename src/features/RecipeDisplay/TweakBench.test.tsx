import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { TextDecoder, TextEncoder } from "util";
import type { RecipeWithId } from "@/lib/recipes/schemas";
import { TweakBench } from "./TweakBench";

Object.assign(global, { TextEncoder, TextDecoder });
Element.prototype.scrollIntoView = jest.fn();

const recipe: RecipeWithId = {
  id: "recipe-1",
  userId: "user-123",
  name: "Mapo Tofu",
  instructions: "",
  baseServings: 2,
  ingredients: [{ name: "tofu", category: "Misc", amount: 1, unit: "block" }],
  steps: [{ title: "Cook", body: "Cook it" }],
  tags: ["spicy"],
};

// A Tweak Patch is flat: changed recipe fields sit at the top level alongside
// `changes` (ADR-0010). The schema rejects a `{ recipe: {...} }` wrapper.
const tweakResponse = {
  title: "Mapo Tofu",
  baseServings: 2,
  ingredients: [{ name: "tofu", amount: "1", unit: "block" }],
  steps: [{ title: "Cook", body: "Cook it gently" }],
  tags: ["mild"],
  changes: [
    {
      kind: "step_replaced",
      ref: { type: "step", index: 0, basis: "workingDraft" },
      label: "Toned down the chili",
    },
  ],
};

function streamOf(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
}

const validBody = JSON.stringify(tweakResponse);

function mockTweakBody(body: string) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    body: streamOf(body),
  }) as unknown as typeof fetch;
}

beforeEach(() => {
  mockTweakBody(validBody);
});

afterEach(() => {
  jest.restoreAllMocks();
});

function renderBench(onWorkingDraftChange: jest.Mock = jest.fn()) {
  render(
    <StrictMode>
      <TweakBench
        recipe={recipe}
        userId="user-123"
        onWorkingDraftChange={onWorkingDraftChange}
        onClose={jest.fn()}
        onSave={jest.fn()}
        isSaving={false}
      />
    </StrictMode>,
  );
  return onWorkingDraftChange;
}

const appliedWith = (label: string) =>
  expect.arrayContaining([expect.objectContaining({ label })]);

describe("TweakBench streaming lifecycle (StrictMode)", () => {
  it("clears the streaming state and reveals Save once a tweak completes", async () => {
    renderBench();

    fireEvent.click(screen.getByText("Less spicy"));

    // The assistant turn should render with the change label
    await waitFor(() =>
      expect(screen.getByText("Toned down the chili")).toBeInTheDocument(),
    );

    // And the bench must leave the streaming state, not stay stuck on the dots
    await waitFor(() =>
      expect(screen.queryByText("Ah Mah is rewriting…")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Save to my cookbook")).toBeInTheDocument();
  });
});

describe("TweakBench tolerant response parsing", () => {
  it("applies a bare-JSON response (no regression)", async () => {
    const onChange = renderBench();
    fireEvent.click(screen.getByText("Less spicy"));
    await waitFor(() => expect(screen.getByText("Toned down the chili")).toBeInTheDocument());
    expect(onChange).toHaveBeenCalledWith(expect.anything(), appliedWith("Toned down the chili"));
  });

  it("applies a ```json fenced response", async () => {
    mockTweakBody("```json\n" + validBody + "\n```");
    const onChange = renderBench();
    fireEvent.click(screen.getByText("Less spicy"));
    await waitFor(() => expect(screen.getByText("Toned down the chili")).toBeInTheDocument());
    expect(onChange).toHaveBeenCalledWith(expect.anything(), appliedWith("Toned down the chili"));
    // Raw fence text must never reach the chat
    expect(screen.queryByText(/```json/)).not.toBeInTheDocument();
  });

  it("applies a response prefixed with prose", async () => {
    mockTweakBody("Sure, here's the updated recipe: " + validBody);
    const onChange = renderBench();
    fireEvent.click(screen.getByText("Less spicy"));
    await waitFor(() => expect(screen.getByText("Toned down the chili")).toBeInTheDocument());
    expect(onChange).toHaveBeenCalledWith(expect.anything(), appliedWith("Toned down the chili"));
  });

  it("shows a friendly message (not raw JSON) for a truncated response", async () => {
    mockTweakBody(validBody.slice(0, 80)); // cut off mid-object, as a token cap would
    const onChange = renderBench();
    fireEvent.click(screen.getByText("Less spicy"));
    await waitFor(() =>
      expect(screen.getByText("Aiyah, that tweak came back muddled. Try again?")).toBeInTheDocument(),
    );
    expect(screen.queryByText(/"recipe"/)).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalledWith(expect.anything(), appliedWith("Toned down the chili"));
    // Streaming state still clears (the #254 fix stays intact)
    expect(screen.queryByText("Ah Mah is rewriting…")).not.toBeInTheDocument();
  });

  it("surfaces a plain-text refusal from the model verbatim", async () => {
    mockTweakBody("Aiyah, that would be a totally different dish, not a tweak.");
    const onChange = renderBench();
    fireEvent.click(screen.getByText("Less spicy"));
    await waitFor(() =>
      expect(
        screen.getByText("Aiyah, that would be a totally different dish, not a tweak."),
      ).toBeInTheDocument(),
    );
    expect(onChange).not.toHaveBeenCalledWith(expect.anything(), appliedWith("Toned down the chili"));
  });
});
