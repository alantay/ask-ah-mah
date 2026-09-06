import { renderBenchmarkReport, renderBlindReview } from "./report";
import type { BenchmarkRun } from "./types";

const run: BenchmarkRun = {
  createdAt: "2026-08-30T00:00:00.000Z",
  models: ["gpt-5.6-luna", "gpt-5.6-terra"],
  efforts: ["low"],
  repetitions: 1,
  cases: [
    {
      id: "test-case",
      category: "test",
      prompt: "Make a test recipe",
      inventory: {
        ingredients: [{ name: "tofu", category: "Protein" }],
        kitchenware: ["wok"],
      },
      reviewFocus: "Whether it works",
    },
  ],
  samples: [
    {
      blindId: "A1B2C3D4",
      caseId: "test-case",
      model: "gpt-5.6-luna",
      effort: "low",
      repetition: 1,
      status: "ok",
      latencyMs: 1200,
      toolNames: ["getInventory"],
      outputText: "A recipe",
      evaluation: {
        checks: [
          {
            id: "recipe-block",
            label: "Emits one valid recipe block",
            passed: true,
            severity: "error",
          },
        ],
        hardPassed: 1,
        hardTotal: 1,
        warningPassed: 0,
        warningTotal: 0,
      },
      usage: { inputTokens: 100, outputTokens: 50, reasoningTokens: 20 },
    },
    {
      blindId: "E5F6G7H8",
      caseId: "test-case",
      model: "gpt-5.6-terra",
      effort: "low",
      repetition: 1,
      status: "ok",
      latencyMs: 2400,
      toolNames: ["getInventory"],
      outputText: "Another recipe",
      evaluation: {
        checks: [
          {
            id: "recipe-block",
            label: "Emits one valid recipe block",
            passed: false,
            severity: "error",
          },
        ],
        hardPassed: 0,
        hardTotal: 1,
        warningPassed: 0,
        warningTotal: 0,
      },
      usage: { inputTokens: 200, outputTokens: 80, reasoningTokens: 30 },
    },
  ],
};

describe("recipe benchmark reports", () => {
  it("renders configuration metrics", () => {
    const report = renderBenchmarkReport(run);

    expect(report).toContain(
      "gpt-5.6-luna | low | 1 | 0/1 | 1/1 | 100.0% | 1.20 | 100 | 50 | 20 | 0",
    );
    expect(report).toContain(
      "gpt-5.6-terra | low | 1 | 0/1 | 0/1 | 0.0% | 2.40 | 200 | 80 | 30 | 0",
    );
  });

  it("keeps model and effort out of the blind review", () => {
    const review = renderBlindReview(run);

    expect(review).toContain("Sample A1B2C3D4");
    expect(review).toContain("Make a test recipe");
    expect(review).not.toContain("gpt-5.6-luna");
    expect(review).not.toContain("gpt-5.6-terra");
    expect(review).not.toContain("Effort: low");
  });
});
