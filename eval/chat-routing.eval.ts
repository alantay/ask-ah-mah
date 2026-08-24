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
import { EFFORT_AGENTIC, MODEL } from "../src/lib/ai/models";
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
    // #492: exact covers for the issue's missing items — `dry sherry` for
    // shaoxing wine, `napa cabbage` for bok choy. A pantry-aware answer leads
    // with these; a generic one buries them in a list of five.
    { name: "dry sherry", category: "Condiments" },
    { name: "napa cabbage", category: "Vegetable" },
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

type TurnResult = { text: string; toolNames: string[] };

async function runTurn(userText: string): Promise<TurnResult> {
  const { text, steps } = await generateText({
    model: openai(MODEL),
    // Must mirror the chat route's effort, not the provider default — the
    // Mode 5 case below is the one that breaks when this drops to `none`.
    providerOptions: EFFORT_AGENTIC,
    system: CHAT_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userText }],
    stopWhen: [stepCountIs(5)],
    tools,
  });
  const toolNames = steps.flatMap((s) => s.toolCalls.map((c) => c.toolName));
  return { text, toolNames };
}

const hasSuggestions = (t: string) => /```suggestions/.test(t);
const hasRecipe = (t: string) => /```recipe/.test(t);
const hasAnyBlock = (t: string) => hasSuggestions(t) || hasRecipe(t);
const hasChecklist = (t: string) => /```checklist/.test(t);
const calledInventory = (r: TurnResult) => r.toolNames.includes("getInventory");

// "Leads with" as a position check: a pantry cover must appear in the opening
// of the reply, not buried after a ranked list of generic swaps — which is
// exactly how #492 presented (it named dry sherry, mid-list, as the fifth
// textbook option). Which cover leads varies run to run: the model follows the
// order the user named the missing items, so bok choy's cover leads as often
// as shaoxing wine's. The check is therefore on the earliest cover, not a
// fixed one. 300 chars is roughly the first paragraph — generous enough for a
// warm opener, tight enough to fail the essay.
const PANTRY_COVERS = ["dry sherry", "napa cabbage", "gao li cai"];
const leadsWithPantry = (t: string) => {
  const lower = t.toLowerCase();
  const positions = PANTRY_COVERS.map((c) => lower.indexOf(c)).filter(
    (i) => i !== -1,
  );
  // The sherry swap is the specific win the issue is about — it must be named
  // somewhere even when the greens happen to lead.
  return (
    positions.length > 0 &&
    Math.min(...positions) < 300 &&
    lower.includes("dry sherry")
  );
};

type Case = { name: string; input: string; expect: (r: TurnResult) => boolean };

const CASES: Case[] = [
  {
    // THE reported bug. Cooking intent + "i bought some" must PRODUCE output
    // (a recipe or suggestions) in the same turn — never stop to ask "want me
    // to suggest…?". "make something with [ingredient]" sits on the Mode-1/
    // Mode-2 boundary and the model legitimately picks either; both are correct.
    // The regression is the absence of any block, so we assert on hasAnyBlock.
    name: "produces a block for 'make something with X, i bought some' (no asking)",
    input: "i want to make something with gao li cai. i bought some",
    expect: ({ text }) => hasAnyBlock(text),
  },
  {
    // Strict Mode-1: explicit open-ended "any ideas?" → suggestions, not a recipe.
    name: "suggests (Mode 1) for 'have chicken, any ideas?'",
    input: "have chicken, any ideas?",
    expect: ({ text }) => hasSuggestions(text),
  },
  {
    // Negative case: bare acknowledgment must NOT explode into suggestions.
    name: "does NOT emit a block for bare 'i bought salmon today'",
    input: "i bought salmon today",
    expect: ({ text }) => !hasAnyBlock(text),
  },
  {
    // Mode 2 still works: a named dish (squarely in pantry, unambiguous)
    // yields a full recipe — never suggestions, never a question.
    name: "emits a recipe for named dish 'make me chicken fried rice'",
    input: "make me chicken fried rice",
    expect: ({ text }) => hasRecipe(text),
  },
  {
    // #492: THE reported bug. The reconcile button sends exactly this string.
    // Zero tool calls was the observed failure — she answered with generic
    // swaps while dry sherry sat on the shelf. `leadsWithPantry` is a
    // deliberate position check: the old reply DID name dry sherry, but buried
    // it mid-list among five alternatives, which is the failure this fixes.
    name: "#492 reconcile ask calls getInventory and leads with the pantry",
    input:
      "I'm missing bok choy, shaoxing wine for the Ginger Chicken. Can you suggest substitutions or alternatives?",
    expect: (r) => calledInventory(r) && leadsWithPantry(r.text),
  },
  {
    // Parity: the typed form of the same question must get the same answer.
    // Scoping the rule to the reconcile message shape was rejected in the
    // spec precisely because it would split these two apart.
    //
    // Position matters here for the same reason it does above: a reply that
    // names dry sherry as its fifth option has not led with the pantry, and a
    // bare `/dry sherry/` test would pass it. Only shaoxing wine is in play,
    // so this checks that one cover's position rather than the earliest of
    // several.
    name: "#492 typed substitute ask calls getInventory and leads with dry sherry",
    input: "what can I use instead of shaoxing wine?",
    expect: (r) => {
      const i = r.text.toLowerCase().indexOf("dry sherry");
      return calledInventory(r) && i !== -1 && i < 300;
    },
  },
  {
    // Negative / regression guard. A prompt edit touches every chat turn: the
    // new routing row must NOT leak into comparisons, which have nothing to
    // replace and so nothing to gain from the pantry.
    name: "#492 knowledge comparison still makes NO tool call",
    input: "what's the difference between baking soda and baking powder?",
    expect: (r) => r.toolNames.length === 0,
  },
  {
    // Mode 5 (Checklist block) — the gate that had NO coverage here at all.
    //
    // Char kway teow's load-bearing items under the name test are flat rice
    // noodles, dark soy and lap cheong / cockles. FAKE_INVENTORY has none of
    // them, and none is makeable in one session, so the makeable fork does not
    // apply — the correct route is a checklist that asks before cooking, never
    // a recipe built on ingredients we have no reason to think she owns.
    //
    // This is also the case that pins `EFFORT_AGENTIC`. At reasoningEffort
    // "none" this gate stops firing entirely (0/4 measured on both luna and
    // terra, answering with a full recipe instead); at "low" and above it is
    // 4/4. The eval passes at "none" without this case, which is exactly how
    // a broken effort setting would have shipped unnoticed.
    name: "emits a checklist (Mode 5) when a named dish's load-bearing items are absent",
    input: "make me char kway teow",
    expect: ({ text }) => hasChecklist(text) && !hasRecipe(text),
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
      const result = await runTurn(c.input);
      const pass = c.expect(result);
      console.log(`${pass ? "PASS" : "FAIL"}  ${c.name}`);
      if (!pass) {
        failures++;
        console.log(`      input: ${c.input}`);
        console.log(`      tools: [${result.toolNames.join(", ")}]`);
        console.log(`      got:   ${result.text.replace(/\n/g, " ").slice(0, 200)}…`);
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
