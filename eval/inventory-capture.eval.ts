/**
 * Opt-in live naming eval for #487. Costs model calls; never writes to a DB.
 * pnpm eval:inventory --run
 * Without --run, lists the cases only. Results go to ignored .scratch/.
 */
import { openai } from "@ai-sdk/openai";
import { generateObject, generateText, stepCountIs, tool } from "ai";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { z } from "zod";
import { CHAT_SYSTEM_PROMPT } from "../src/app/api/chat/constants";
import { EFFORT_AGENTIC, EFFORT_MECHANICAL, MODEL } from "../src/lib/ai/models";
import {
  ADD_INVENTORY_TOOL_DESCRIPTION,
  buildInventoryCapturePrompt,
  buildInventoryParsePrompt,
} from "../src/lib/inventory/prompts";
import { AddInventoryItemSchemaObj, type AddInventoryItem } from "../src/lib/inventory/schemas";

type CaptureCase = {
  id: string;
  text: string;
  names: string[];
  amount?: { name: string; quantity: number; units: string[] };
};

type CaptureResult = {
  id: string;
  path: string;
  items?: AddInventoryItem[];
  errors: string[];
};

const cases: CaptureCase[] = [
  { id: "fish-examples", text: "I have fresh firm fish (mackerel, snapper, barramundi).", names: ["Fish"] },
  { id: "specific-fish", text: "I bought 200g mackerel (ask the fishmonger to clean and scale it).", names: ["Mackerel"], amount: { name: "Mackerel", quantity: 200, units: ["g"] } },
  { id: "distinct-meats", text: "I have minced beef and minced pork.", names: ["Minced beef", "Minced pork"] },
  { id: "dried-and-fresh", text: "I have dried chilli and fresh chilli.", names: ["Dried chilli", "Chilli"] },
  { id: "unowned-alternatives", text: "I have fish (mackerel or snapper would also work); I don't have eggs and I might buy tofu tomorrow.", names: ["Fish"] },
  { id: "no-possession", text: "I don't have fish; should I buy mackerel?", names: [] },
  { id: "prep-instructions", text: "I bought chicken thighs, boneless, skinless, cut into bite-size pieces.", names: ["Chicken thigh"] },
  { id: "quantity-and-kitchenware", text: "I have 2 eggs and a wok.", names: ["Egg", "Wok"], amount: { name: "Egg", quantity: 2, units: ["piece", "pieces"] } },
];

const normalize = (name: string) => name.trim().toLowerCase();

function evaluateItems(c: CaptureCase, items: AddInventoryItem[]): string[] {
  const errors: string[] = [];
  const names = items.map(i => normalize(i.name)).sort();
  if (JSON.stringify(names) !== JSON.stringify(c.names.map(normalize).sort())) errors.push("names differ");
  for (const item of items) {
    if (item.type !== (normalize(item.name) === "wok" ? "kitchenware" : "ingredient")) errors.push(`wrong type: ${item.name}`);
    if (item.type === "ingredient" && !item.category) errors.push(`missing category: ${item.name}`);
    if (item.type === "kitchenware" && item.category) errors.push(`unexpected category: ${item.name}`);
    if (c.amount && normalize(item.name) === normalize(c.amount.name)) {
      if (item.quantity !== c.amount.quantity || !c.amount.units.includes(item.unit ?? "")) errors.push(`wrong amount: ${item.name}`);
    } else if (item.quantity != null || item.unit != null) errors.push(`invented amount: ${item.name}`);
  }
  return errors;
}

async function runTool(text: string): Promise<AddInventoryItem[]> {
  const captured: AddInventoryItem[] = [];
  await generateText({
    model: openai(MODEL),
    providerOptions: EFFORT_AGENTIC,
    system: CHAT_SYSTEM_PROMPT,
    messages: [{ role: "user", content: text }],
    stopWhen: stepCountIs(5),
    tools: {
      addInventoryItem: tool({
        description: ADD_INVENTORY_TOOL_DESCRIPTION,
        inputSchema: AddInventoryItemSchemaObj,
        execute: async ({ items }) => {
          captured.push(...items);
          return { content: "Item added to inventory" };
        },
      }),
      getInventory: tool({
        description: "Check what ingredients and kitchenware the user currently has in their inventory.",
        inputSchema: z.object({}),
        execute: async () => ({
          inventory: {
            ingredientInventory: captured.filter(i => i.type === "ingredient"),
            kitchenwareInventory: captured.filter(i => i.type === "kitchenware"),
          },
        }),
      }),
      removeInventoryItem: tool({
        description: "Remove items from inventory by their names.",
        inputSchema: z.object({ itemNames: z.array(z.string()) }),
        execute: async () => ({ content: "No persisted inventory in this eval" }),
      }),
    },
  });
  return captured;
}

async function main() {
  const rescoreIndex = process.argv.indexOf("--rescore");
  if (rescoreIndex !== -1) {
    const file = process.argv[rescoreIndex + 1];
    if (!file) throw new Error("--rescore requires a saved run JSON path");
    const saved: { results: CaptureResult[] } = JSON.parse(readFileSync(file, "utf8"));
    let passed = 0;
    for (const result of saved.results) {
      const c = cases.find(c => c.id === result.id);
      if (!c) throw new Error(`Unknown saved case: ${result.id}`);
      const errors = result.items ? evaluateItems(c, result.items) : result.errors;
      if (!errors.length) passed++;
      console.log(`${errors.length ? "FAIL" : "PASS"} ${result.id}/${result.path}${errors.length ? ` — ${errors.join("; ")}` : ""}`);
    }
    console.log(`${passed}/${saved.results.length} passed (re-scored ${file}; no model calls)`);
    if (passed !== saved.results.length) process.exitCode = 1;
    return;
  }
  if (!process.argv.includes("--run")) {
    console.log(`${cases.length} cases × 3 paths = ${cases.length * 3} evaluations on ${MODEL} (tool turns can make multiple calls). Add --run to execute.`);
    console.log(cases.map(c => c.id).join("\n"));
    return;
  }
  if (!process.env.OPENAI_API_KEY) {
    // Match the existing eval loader; never print environment values.
    for (const line of readFileSync(".env", "utf8").split("\n")) {
      const match = line.match(/^OPENAI_API_KEY=(.*)$/);
      if (match) process.env.OPENAI_API_KEY = match[1].trim().replace(/^["']|["']$/g, "");
    }
  }
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required");

  const results: CaptureResult[] = [];
  for (const c of cases) {
    for (const path of ["parse", "capture", "tool"] as const) {
      try {
        const items = path === "tool" ? await runTool(c.text) : (await generateObject({
          model: openai(MODEL),
          providerOptions: EFFORT_MECHANICAL,
          schema: AddInventoryItemSchemaObj,
          prompt: path === "parse" ? buildInventoryParsePrompt(c.text) : buildInventoryCapturePrompt(c.text),
        })).object.items;
        const errors = evaluateItems(c, items);
        results.push({ id: c.id, path, items, errors });
        console.log(`${errors.length ? "FAIL" : "PASS"} ${c.id}/${path}: ${items.map(i => i.name).join(", ") || "(nothing)"}${errors.length ? ` — ${errors.join("; ")}` : ""}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        results.push({ id: c.id, path, errors: [message] });
        console.log(`ERROR ${c.id}/${path}: ${message}`);
      }
    }
  }
  mkdirSync(".scratch/inventory-capture", { recursive: true });
  const file = `.scratch/inventory-capture/${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  writeFileSync(file, JSON.stringify({
    model: MODEL,
    effort: { extraction: EFFORT_MECHANICAL, tool: EFFORT_AGENTIC },
    prompts: {
      parse: buildInventoryParsePrompt("<user entry>"),
      capture: buildInventoryCapturePrompt("<user message>"),
      toolDescription: ADD_INVENTORY_TOOL_DESCRIPTION,
      chatSystem: CHAT_SYSTEM_PROMPT,
    },
    cases,
    results,
  }, null, 2));
  const passed = results.filter(r => r.errors.length === 0).length;
  console.log(`${passed}/${results.length} passed; saved ${file}`);
  if (passed !== results.length) process.exitCode = 1;
}

main().catch(error => { console.error(error); process.exitCode = 1; });
