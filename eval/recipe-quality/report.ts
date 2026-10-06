import type {
  BenchmarkRun,
  BenchmarkModel,
  BenchmarkSample,
  ReasoningEffort,
  RecipeBenchmarkCase,
} from "./types";

function average(values: Array<number | undefined>): number | undefined {
  const present = values.filter((value): value is number => value !== undefined);
  if (present.length === 0) return undefined;
  return present.reduce((sum, value) => sum + value, 0) / present.length;
}

function formatNumber(value: number | undefined, digits = 0): string {
  return value === undefined ? "—" : value.toFixed(digits);
}

function samplesForConfiguration(
  samples: BenchmarkSample[],
  model: BenchmarkModel,
  effort: ReasoningEffort,
): BenchmarkSample[] {
  return samples.filter((sample) => sample.model === model && sample.effort === effort);
}

function averageHardScore(samples: BenchmarkSample[]): number | undefined {
  return average(
    samples.map((sample) =>
      sample.evaluation.hardTotal === 0
        ? undefined
        : sample.evaluation.hardPassed / sample.evaluation.hardTotal,
    ),
  );
}

function formatScore(value: number | undefined): string {
  return value === undefined ? "—" : `${(value * 100).toFixed(1)}%`;
}

function hasValidRecipeBlock(sample: BenchmarkSample): boolean {
  return Boolean(
    sample.recipe &&
      sample.evaluation.checks.find((check) => check.id === "recipe-block")?.passed,
  );
}

function passesEveryHardCheck(sample: BenchmarkSample): boolean {
  return (
    sample.evaluation.hardTotal > 0 &&
    sample.evaluation.hardPassed === sample.evaluation.hardTotal
  );
}

function summaryRows(run: BenchmarkRun): string[] {
  return run.models.flatMap((model) =>
    run.efforts.map((effort) => {
      const samples = samplesForConfiguration(run.samples, model, effort);
      const valid = samples.filter(hasValidRecipeBlock).length;
      const allHard = samples.filter(passesEveryHardCheck).length;
      return [
        model,
        effort,
        samples.length,
        `${valid}/${samples.length}`,
        `${allHard}/${samples.length}`,
        formatScore(averageHardScore(samples)),
        formatNumber(average(samples.map((sample) => sample.latencyMs / 1000)), 2),
        formatNumber(average(samples.map((sample) => sample.usage.inputTokens))),
        formatNumber(average(samples.map((sample) => sample.usage.outputTokens))),
        formatNumber(average(samples.map((sample) => sample.usage.reasoningTokens))),
        samples.filter((sample) => sample.status === "error").length,
      ].join(" | ");
    }),
  );
}

function caseRows(run: BenchmarkRun): string[] {
  return run.cases.flatMap((benchmarkCase) =>
    run.models.flatMap((model) =>
      run.efforts.map((effort) => {
        const samples = run.samples.filter(
          (sample) =>
            sample.caseId === benchmarkCase.id &&
            sample.model === model &&
            sample.effort === effort,
        );
        return [
          benchmarkCase.id,
          model,
          effort,
          `${samples.filter(hasValidRecipeBlock).length}/${samples.length}`,
          `${samples.filter(passesEveryHardCheck).length}/${samples.length}`,
          formatScore(averageHardScore(samples)),
          formatNumber(average(samples.map((sample) => sample.latencyMs / 1000)), 2),
        ].join(" | ");
      }),
    ),
  );
}

function failureDetails(samples: BenchmarkSample[]): string {
  const failures = samples.flatMap((sample) =>
    sample.evaluation.checks
      .filter((check) => check.severity === "error" && !check.passed)
      .map(
        (check) =>
          `- **${sample.blindId}** · ${sample.caseId} · ${sample.model} · ${sample.effort}: ${check.label}${
            check.detail ? ` — ${check.detail}` : ""
          }`,
      ),
  );
  return failures.length > 0 ? failures.join("\n") : "No deterministic hard-check failures.";
}

export function renderBenchmarkReport(run: BenchmarkRun): string {
  return `# Recipe quality benchmark

Generated: ${run.createdAt}  
Models: ${run.models.join(", ")}  
Cases: ${run.cases.length}  
Repetitions per arm: ${run.repetitions}  
Total samples: ${run.samples.length}

The deterministic checks cover structure and fixture-specific constraints. They do **not** measure flavour, culinary judgment, or whether a person would enjoy cooking the recipe. Use the blind-review packet for those decisions.

## Configuration summary

Model | Effort | Samples | Valid recipe block | All hard checks | Avg hard score | Avg latency (s) | Avg input tokens | Avg output tokens | Avg reasoning tokens | API errors
--- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---:
${summaryRows(run).join("\n")}

## Case breakdown

Case | Model | Effort | Valid recipe block | All hard checks | Avg hard score | Avg latency (s)
--- | --- | --- | ---: | ---: | ---: | ---:
${caseRows(run).join("\n")}

## Deterministic failures

${failureDetails(run.samples)}

## How to decide

Prefer the lowest-effort arm whose blind human scores and hard-check rate are practically tied with the best arm. Treat latency and reasoning-token increases as costs, not evidence of quality by themselves.
`;
}

function inventoryLine(benchmarkCase: RecipeBenchmarkCase): string {
  const ingredients = benchmarkCase.inventory.ingredients
    .map((ingredient) => ingredient.name)
    .join(", ");
  const kitchenware = benchmarkCase.inventory.kitchenware.join(", ");
  return `Ingredients: ${ingredients}\n\nKitchenware: ${kitchenware}`;
}

function reviewSample(sample: BenchmarkSample): string {
  return `### Sample ${sample.blindId}

Score each dimension from 1 (unacceptable) to 5 (excellent):

- Safety and correctness:
- Technique and sequencing:
- Likely flavour and balance:
- Clarity and cookability:
- Constraint fit:
- Overall preference:

Notes:

<details>
<summary>Recipe output</summary>

${sample.outputText || `Generation failed: ${sample.error ?? "unknown error"}`}

</details>`;
}

export function renderBlindReview(run: BenchmarkRun): string {
  const sections = run.cases.map((benchmarkCase) => {
    const samples = run.samples
      .filter((sample) => sample.caseId === benchmarkCase.id)
      .sort((a, b) => a.blindId.localeCompare(b.blindId));
    return `## ${benchmarkCase.id}

**Request:** ${benchmarkCase.prompt}

**Pantry**  
${inventoryLine(benchmarkCase)}

**Review focus:** ${benchmarkCase.reviewFocus}

${samples.map(reviewSample).join("\n\n")}`;
  });

  return `# Blind recipe review

The model configuration is intentionally hidden. Review recipes on their own merits before opening the analytical report or results JSON.

${sections.join("\n\n")}
`;
}
