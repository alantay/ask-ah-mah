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

const tweakResponse = {
  recipe: {
    title: "Mapo Tofu",
    baseServings: 2,
    ingredients: [{ name: "tofu", amount: "1", unit: "block" }],
    steps: [{ title: "Cook", body: "Cook it gently" }],
    tags: ["mild"],
  },
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

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    body: streamOf(JSON.stringify(tweakResponse)),
  }) as unknown as typeof fetch;
});

afterEach(() => {
  jest.restoreAllMocks();
});

function renderBench() {
  return render(
    <StrictMode>
      <TweakBench
        recipe={recipe}
        userId="user-123"
        onWorkingDraftChange={jest.fn()}
        onClose={jest.fn()}
        onSave={jest.fn()}
        isSaving={false}
      />
    </StrictMode>,
  );
}

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
