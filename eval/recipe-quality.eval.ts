/**
 * Opt-in live benchmark for recipe quality across supported Luna/Terra models and reasoning efforts.
 *
 * Dry-run the full matrix (no API calls):
 *   pnpm benchmark:recipes
 *
 * Run a two-case, two-effort smoke benchmark:
 *   pnpm benchmark:recipes -- --smoke --run
 *
 * Run the full benchmark:
 *   pnpm benchmark:recipes -- --run
 *
 * Results are written under .scratch/recipe-benchmarks/ and are never committed.
 */
import { openai } from "@ai-sdk/openai";
import { generateText, stepCountIs, tool } from "ai";
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { CHAT_SYSTEM_PROMPT } from "../src/app/api/chat/constants";
import { MODEL } from "../src/lib/ai/models";
import { evaluateRecipeOutput, missingRecipeEvaluation } from "./recipe-quality/checks";
import { RECIPE_QUALITY_CASES } from "./recipe-quality/cases";
import { renderBenchmarkReport, renderBlindReview } from "./recipe-quality/report";
import {
  BENCHMARK_MODELS,
  REASONING_EFFORTS,
  type BenchmarkModel,
  type BenchmarkRun,
  type BenchmarkSample,
  type ReasoningEffort,
  type RecipeBenchmarkCase,
} from "./recipe-quality/types";

type CliOptions = {
  shouldRun: boolean;
  models: BenchmarkModel[];
  efforts: ReasoningEffort[];
  repetitions: number;
  caseIds?: string[];
  limit?: number;
  showHelp: boolean;
};

function valueAfter(args: string[], index: number, flag: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${flag} requires a value`);
  return value;
}

export function parseCliOptions(args: string[]): CliOptions {
  const smoke = args.includes("--smoke");
  const options: CliOptions = {
    shouldRun: false,
    models: [MODEL],
    efforts: smoke ? ["low", "medium"] : ["low", "medium", "high"],
    repetitions: smoke ? 1 : 3,
    limit: smoke ? 2 : undefined,
    showHelp: false,
  };

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--") continue;
    if (arg === "--smoke") continue;
    if (arg === "--run") {
      options.shouldRun = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      options.showHelp = true;
      continue;
    }

    const [flag, inlineValue] = arg.split("=", 2);
    if (flag === "--models") {
      const raw = inlineValue ?? valueAfter(args, index, flag);
      if (!inlineValue) index++;
      const models = raw.split(",").filter(Boolean);
      const invalid = models.filter(
        (model) => !BENCHMARK_MODELS.includes(model as BenchmarkModel),
      );
      if (models.length === 0 || invalid.length > 0) {
        throw new Error(
          `Invalid model${invalid.length === 1 ? "" : "s"}: ${invalid.join(", ")}`,
        );
      }
      options.models = models as BenchmarkModel[];
      continue;
    }
    if (flag === "--efforts") {
      const raw = inlineValue ?? valueAfter(args, index, flag);
      if (!inlineValue) index++;
      const efforts = raw.split(",").filter(Boolean);
      const invalid = efforts.filter(
        (effort) => !REASONING_EFFORTS.includes(effort as ReasoningEffort),
      );
      if (efforts.length === 0 || invalid.length > 0) {
        throw new Error(
          `Invalid effort${invalid.length === 1 ? "" : "s"}: ${invalid.join(", ")}`,
        );
      }
      options.efforts = efforts as ReasoningEffort[];
      continue;
    }
    if (flag === "--reps") {
      const raw = inlineValue ?? valueAfter(args, index, flag);
      if (!inlineValue) index++;
      const repetitions = Number(raw);
      if (!Number.isInteger(repetitions) || repetitions < 1 || repetitions > 20) {
        throw new Error("--reps must be an integer from 1 to 20");
      }
      options.repetitions = repetitions;
      continue;
    }
    if (flag === "--cases") {
      const raw = inlineValue ?? valueAfter(args, index, flag);
      if (!inlineValue) index++;
      options.caseIds = raw.split(",").filter(Boolean);
      continue;
    }
    if (flag === "--limit") {
      const raw = inlineValue ?? valueAfter(args, index, flag);
      if (!inlineValue) index++;
      const limit = Number(raw);
      if (!Number.isInteger(limit) || limit < 1) {
        throw new Error("--limit must be a positive integer");
      }
      options.limit = limit;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function helpText(): string {
  return `Recipe quality benchmark

Usage:
  pnpm benchmark:recipes                         # dry-run the default matrix
  pnpm benchmark:recipes -- --smoke --run        # 2 cases × low/medium × 1 rep
  pnpm benchmark:recipes -- --run                # all cases × low/medium/high × 3 reps
  pnpm benchmark:recipes -- --models gpt-5.6-luna,gpt-5.6-terra --efforts low --reps 1 --run

Options:
  --run                    Make live API calls; omitted means dry-run only
  --smoke                  Default to 2 cases, low/medium, 1 repetition
  --models model-a,model-b Any of gpt-5.6-luna, gpt-5.6-terra, gpt-6-luna
  --efforts low,medium     Choose reasoning efforts
  --reps 3                 Repetitions per case/configuration (1–20)
  --cases case-a,case-b    Run only the named fixture IDs
  --limit 4                Run only the first N selected fixtures
  --help                   Show this help
`;
}

function loadEnv(): void {
  if (process.env.OPENAI_API_KEY) return;
  try {
    for (const line of readFileSync(".env", "utf8").split("\n")) {
      const match = line.match(/^OPENAI_API_KEY=(.*)$/);
      if (match) {
        process.env.OPENAI_API_KEY = match[1].trim().replace(/^["']|["']$/g, "");
        return;
      }
    }
  } catch {
    // Rely on a real environment variable when .env is absent.
  }
}

function selectCases(options: CliOptions): RecipeBenchmarkCase[] {
  const selected = options.caseIds
    ? options.caseIds.map((id) => {
        const benchmarkCase = RECIPE_QUALITY_CASES.find((item) => item.id === id);
        if (!benchmarkCase) throw new Error(`Unknown recipe benchmark case: ${id}`);
        return benchmarkCase;
      })
    : RECIPE_QUALITY_CASES;
  return options.limit ? selected.slice(0, options.limit) : selected;
}

function benchmarkTools(benchmarkCase: RecipeBenchmarkCase) {
  const inventory = {
    ingredientInventory: benchmarkCase.inventory.ingredients.map((ingredient) => ({
      ...ingredient,
      type: "ingredient" as const,
    })),
    kitchenwareInventory: benchmarkCase.inventory.kitchenware.map((name) => ({
      name,
      type: "kitchenware" as const,
    })),
  };

  return {
    getInventory: tool({
      description:
        "Check what ingredients and kitchenware the user currently has in their inventory. Use this BEFORE suggesting recipes to see what they can cook with.",
      inputSchema: z.object({}),
      execute: async () => ({
        content: `Current inventory: ${inventory.ingredientInventory.length} ingredients, ${inventory.kitchenwareInventory.length} kitchenware items`,
        inventory,
      }),
    }),
    addInventoryItem: tool({
      description:
        "Add items to the user's inventory. Benchmark fixture inventories are fixed; this call is recorded but does not mutate them.",
      inputSchema: z.object({ items: z.array(z.unknown()) }),
      execute: async () => ({ content: "Benchmark inventory is fixed" }),
    }),
    removeInventoryItem: tool({
      description:
        "Remove items from inventory. Benchmark fixture inventories are fixed; this call is recorded but does not mutate them.",
      inputSchema: z.object({ itemNames: z.array(z.string()) }),
      execute: async () => ({ content: "Benchmark inventory is fixed" }),
    }),
  };
}

async function runSample(
  benchmarkCase: RecipeBenchmarkCase,
  model: BenchmarkModel,
  effort: ReasoningEffort,
  repetition: number,
): Promise<BenchmarkSample> {
  const blindId = randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  const startedAt = performance.now();

  try {
    const result = await generateText({
      model: openai(model),
      providerOptions: { openai: { reasoningEffort: effort } },
      system: CHAT_SYSTEM_PROMPT,
      messages: [{ role: "user", content: benchmarkCase.prompt }],
      stopWhen: [stepCountIs(5)],
      tools: benchmarkTools(benchmarkCase),
    });
    const latencyMs = performance.now() - startedAt;
    const { recipe, evaluation } = evaluateRecipeOutput(result.text, benchmarkCase);
    const toolNames = result.steps.flatMap((step) =>
      step.toolCalls.map((call) => call.toolName),
    );

    return {
      blindId,
      caseId: benchmarkCase.id,
      model,
      effort,
      repetition,
      status: "ok",
      latencyMs,
      toolNames,
      outputText: result.text,
      recipe,
      evaluation,
      usage: {
        inputTokens: result.totalUsage.inputTokens,
        outputTokens: result.totalUsage.outputTokens,
        reasoningTokens: result.totalUsage.reasoningTokens,
        cachedInputTokens: result.totalUsage.cachedInputTokens,
        totalTokens: result.totalUsage.totalTokens,
      },
    };
  } catch (error) {
    return {
      blindId,
      caseId: benchmarkCase.id,
      model,
      effort,
      repetition,
      status: "error",
      latencyMs: performance.now() - startedAt,
      toolNames: [],
      outputText: "",
      evaluation: missingRecipeEvaluation(),
      usage: {},
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function outputDirectory(createdAt: string): string {
  return join(
    ".scratch",
    "recipe-benchmarks",
    createdAt.replace(/[:.]/g, "-"),
  );
}

function serializeRun(run: BenchmarkRun): string {
  return JSON.stringify(
    run,
    (_key, value) =>
      value instanceof RegExp ? { source: value.source, flags: value.flags } : value,
    2,
  );
}

async function main(): Promise<void> {
  const options = parseCliOptions(process.argv.slice(2));
  if (options.showHelp) {
    console.log(helpText());
    return;
  }

  const cases = selectCases(options);
  const sampleCount =
    cases.length * options.models.length * options.efforts.length * options.repetitions;
  console.log(`Models: ${options.models.join(", ")}`);
  console.log(`Cases: ${cases.length} (${cases.map((item) => item.id).join(", ")})`);
  console.log(`Efforts: ${options.efforts.join(", ")}`);
  console.log(`Repetitions: ${options.repetitions}`);
  console.log(`Live API calls: ${sampleCount}`);

  if (!options.shouldRun) {
    console.log("\nDry run only. Add --run to make these API calls.");
    return;
  }

  loadEnv();
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not found in the environment or .env");
  }

  const samples: BenchmarkSample[] = [];
  for (const [caseIndex, benchmarkCase] of cases.entries()) {
    for (let repetition = 1; repetition <= options.repetitions; repetition++) {
      const shouldReverseModels = (caseIndex + repetition - 1) % 2 === 1;
      const modelOrder = shouldReverseModels ? [...options.models].reverse() : options.models;
      for (const model of modelOrder) {
        for (const effort of options.efforts) {
          console.log(
            `[${samples.length + 1}/${sampleCount}] ${benchmarkCase.id} · ${model} · ${effort} · rep ${repetition}`,
          );
          const sample = await runSample(benchmarkCase, model, effort, repetition);
          samples.push(sample);
          const hard = `${sample.evaluation.hardPassed}/${sample.evaluation.hardTotal}`;
          console.log(
            `  ${sample.status.toUpperCase()} · recipe ${sample.recipe ? "yes" : "no"} · hard ${hard} · ${(sample.latencyMs / 1000).toFixed(2)}s`,
          );
        }
      }
    }
  }

  const createdAt = new Date().toISOString();
  const run: BenchmarkRun = {
    createdAt,
    models: options.models,
    efforts: options.efforts,
    repetitions: options.repetitions,
    cases,
    samples,
  };
  const directory = outputDirectory(createdAt);
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, "results.json"), `${serializeRun(run)}\n`);
  writeFileSync(join(directory, "report.md"), renderBenchmarkReport(run));
  writeFileSync(join(directory, "blind-review.md"), renderBlindReview(run));
  console.log(`\nResults: ${directory}`);

  if (samples.some((sample) => sample.status === "error")) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
