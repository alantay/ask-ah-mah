/**
 * Live routing eval for CHAT_SYSTEM_PROMPT.
 *
 * Hits the real OpenAI model — SLOW, COSTS money, mildly flaky (model
 * nondeterminism). Opt-in, NOT part of CI. Run after touching the chat prompt:
 *
 *   pnpm test:eval
 *
 * Guards the regression that keeps recurring: when a message carries cooking
 * intent, Ah Mah must PRODUCE output (a ```suggestions / ```recipe block) in the
 * same turn — never stop to ask "want me to suggest…?". The negative case proves
 * we did not over-correct into always-suggesting on a bare "I bought X".
 *
 * Assertion is on OUTPUT MODE (block presence/absence), NOT question marks —
 * Ah Mah legitimately ends suggestions with a warm nudge question.
 *
 * TODO (separate, deferred bug): foreign-ingredient `type` misclassification —
 * "gao li cai" (cabbage) gets stored as kitchenware because the model doesn't
 * recognize the romanized name as food. Track + eval that independently.
 */
import { MODEL_HEAVY } from "../src/lib/ai/models";
import { openai } from "@ai-sdk/openai";
import { generateText, stepCountIs, tool } from "ai";
import { readFileSync } from "node:fs";
import { CHAT_SYSTEM_PROMPT } from "../src/app/api/chat/constants";
import { z } from "zod";

// Minimal .env loader so the script runs without extra tooling.
function loadEnv() {
  if (process.env.OPENAI_API_KEY) return;
  try {
    for (const line of readFileSync(".env", "utf8").split("\n")) {
      const m = line.match(/^OPENAI_API_KEY=(.*)$/);
      if (m) process.env.OPENAI_API_KEY = m[1].trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    /* no .env — rely on a real env var */
  }
}

// Canned inventory so getInventory works without a DB.
const FAKE_INVENTORY = {
  ingredientInventory: [
    { name: "chicken thigh", category: "Protein" },
    { name: "rice", category: "Carbs" },
    { name: "garlic", category: "Vegetable" },
    { name: "soy sauce", category: "Condiments" },
    { name: "gao li cai", category: "Vegetable" },
  ],
  kitchenwareInventory: [{ name: "wok" }],
};

const tools = {
  getInventory: tool({
    description: "Check the user's inventory.",
    inputSchema: z.object({}),
    execute: async () => ({
      content: `Current inventory: ${FAKE_INVENTORY.ingredientInventory.length} ingredients, ${FAKE_INVENTORY.kitchenwareInventory.length} kitchenware items`,
      inventory: FAKE_INVENTORY,
    }),
  }),
  addInventoryItem: tool({
    description: "Add items to inventory.",
    inputSchema: z.object({ items: z.any() }),
    execute: async () => ({ content: "Item added to inventory" }),
  }),
  removeInventoryItem: tool({
    description: "Remove items from inventory.",
    inputSchema: z.object({ itemNames: z.array(z.string()) }),
    execute: async () => ({ content: "Items removed from inventory" }),
  }),
};

async function runTurn(userText: string): Promise<string> {
  const { text } = await generateText({
    model: openai(MODEL_HEAVY),
    system: CHAT_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userText }],
    stopWhen: [stepCountIs(5)],
    tools,
  });
  return text;
}

const hasSuggestions = (t: string) => /```suggestions/.test(t);
const hasRecipe = (t: string) => /```recipe/.test(t);
const hasAnyBlock = (t: string) => hasSuggestions(t) || hasRecipe(t);

type Case = { name: string; input: string; expect: (t: string) => boolean };

const CASES: Case[] = [
  {
    // THE reported bug. Cooking intent + "i bought some" must PRODUCE output
    // (a recipe or suggestions) in the same turn — never stop to ask "want me
    // to suggest…?". "make something with [ingredient]" sits on the Mode-1/
    // Mode-2 boundary and the model legitimately picks either; both are correct.
    // The regression is the absence of any block, so we assert on hasAnyBlock.
    name: "produces a block for 'make something with X, i bought some' (no asking)",
    input: "i want to make something with gao li cai. i bought some",
    expect: hasAnyBlock,
  },
  {
    // Strict Mode-1: explicit open-ended "any ideas?" → suggestions, not a recipe.
    name: "suggests (Mode 1) for 'have chicken, any ideas?'",
    input: "have chicken, any ideas?",
    expect: hasSuggestions,
  },
  {
    // Negative case: bare acknowledgment must NOT explode into suggestions.
    name: "does NOT emit a block for bare 'i bought salmon today'",
    input: "i bought salmon today",
    expect: (t) => !hasAnyBlock(t),
  },
  {
    // Mode 2 still works: a named dish (squarely in pantry, unambiguous)
    // yields a full recipe — never suggestions, never a question.
    name: "emits a recipe for named dish 'make me chicken fried rice'",
    input: "make me chicken fried rice",
    expect: hasRecipe,
  },
];

async function main() {
  loadEnv();
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY not found (env or .env). Aborting.");
    process.exit(2);
  }

  let failures = 0;
  for (const c of CASES) {
    try {
      const text = await runTurn(c.input);
      const pass = c.expect(text);
      console.log(`${pass ? "PASS" : "FAIL"}  ${c.name}`);
      if (!pass) {
        failures++;
        console.log(`      input: ${c.input}`);
        console.log(`      got:   ${text.replace(/\n/g, " ").slice(0, 200)}…`);
      }
    } catch (err) {
      failures++;
      console.log(`ERROR ${c.name}: ${(err as Error).message}`);
    }
  }

  console.log(`\n${CASES.length - failures}/${CASES.length} passed`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
