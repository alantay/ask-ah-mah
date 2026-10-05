import type { RecipeBlock } from "@/lib/recipes/schemas";

export const REASONING_EFFORTS = [
  "none",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
] as const;

export type ReasoningEffort = (typeof REASONING_EFFORTS)[number];

export const BENCHMARK_MODELS = ["gpt-5.6-luna", "gpt-5.6-terra", "gpt-6-luna"] as const;

export type BenchmarkModel = (typeof BENCHMARK_MODELS)[number];

export type IngredientExpectation = {
  label: string;
  anyOf: string[];
};

export type TextExpectation = {
  label: string;
  pattern: RegExp;
};

export type BenchmarkInventory = {
  ingredients: Array<{
    name: string;
    category:
      | "Protein"
      | "Carbs"
      | "Vegetable"
      | "Condiments"
      | "Spice"
      | "Misc";
    quantity?: number;
    unit?: string;
  }>;
  kitchenware: string[];
};

export type RecipeBenchmarkCase = {
  id: string;
  category: string;
  prompt: string;
  inventory: BenchmarkInventory;
  reviewFocus: string;
  requiredIngredients?: IngredientExpectation[];
  forbiddenIngredients?: IngredientExpectation[];
  requiredText?: TextExpectation[];
  forbiddenText?: TextExpectation[];
};

export type CheckSeverity = "error" | "warning";

export type CheckResult = {
  id: string;
  label: string;
  passed: boolean;
  severity: CheckSeverity;
  detail?: string;
};

export type RecipeEvaluation = {
  checks: CheckResult[];
  hardPassed: number;
  hardTotal: number;
  warningPassed: number;
  warningTotal: number;
};

export type BenchmarkUsage = {
  inputTokens?: number;
  outputTokens?: number;
  reasoningTokens?: number;
  cachedInputTokens?: number;
  totalTokens?: number;
};

export type BenchmarkSample = {
  blindId: string;
  caseId: string;
  model: BenchmarkModel;
  effort: ReasoningEffort;
  repetition: number;
  status: "ok" | "error";
  latencyMs: number;
  toolNames: string[];
  outputText: string;
  recipe?: RecipeBlock;
  evaluation: RecipeEvaluation;
  usage: BenchmarkUsage;
  error?: string;
};

export type BenchmarkRun = {
  createdAt: string;
  models: BenchmarkModel[];
  efforts: ReasoningEffort[];
  repetitions: number;
  cases: RecipeBenchmarkCase[];
  samples: BenchmarkSample[];
};
