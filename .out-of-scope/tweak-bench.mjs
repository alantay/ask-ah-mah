import { readFileSync } from "node:fs";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

// load OPENAI_API_KEY from .env
for (const line of readFileSync(".env", "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const recipe = {
  id: "r1",
  title: "Sichuan Mapo Tofu",
  description: "Numbing, spicy, savoury tofu braise in Ah Mah's style.",
  baseServings: 2,
  totalTimeMinutes: 30,
  ingredients: [
    { name: "silken tofu", category: "Protein", amount: "400", unit: "g", note: "cubed" },
    { name: "minced pork", category: "Protein", amount: "150", unit: "g", note: "" },
    { name: "doubanjiang", category: "Condiments", amount: "2", unit: "tbsp", note: "chilli bean paste" },
    { name: "Sichuan peppercorns", category: "Spice", amount: "1", unit: "tsp", note: "toasted, ground" },
    { name: "garlic", category: "Vegetable", amount: "3", unit: "cloves", note: "minced" },
    { name: "ginger", category: "Vegetable", amount: "1", unit: "thumb", note: "minced" },
    { name: "spring onion", category: "Vegetable", amount: "2", unit: "stalks", note: "sliced" },
    { name: "cornstarch", category: "Condiments", amount: "1", unit: "tbsp", note: "slurry" },
  ],
  prep: ["Cube the tofu and blanch in salted water", "Mince aromatics", "Mix cornstarch slurry"],
  steps: [
    { title: "Fry aromatics", body: "Heat oil, fry garlic, ginger, doubanjiang until red and fragrant." },
    { title: "Brown pork", body: "Add minced pork, fry until cooked and slightly crisp." },
    { title: "Braise tofu", body: "Add stock and tofu, simmer gently 5 minutes." },
    { title: "Thicken", body: "Stir in slurry, simmer until glossy." },
    { title: "Finish", body: "Top with Sichuan pepper and spring onion." },
  ],
  tags: ["spicy", "sichuan", "weeknight"],
};

const PATCH_PROMPT = `You are a recipe editor. Apply the instruction to this recipe and return a JSON PATCH with only the fields that changed (whole array if any element changed), plus a "changes" array. No fences.\n\nRECIPE:\n${JSON.stringify(recipe, null, 2)}`;

const WHOLE_PROMPT = `You are a recipe editor. Apply the instruction to this recipe and return the ENTIRE updated recipe as JSON, plus a "changes" array. No fences.\n\nRECIPE:\n${JSON.stringify(recipe, null, 2)}`;

// Faithful copy of the route's buildSystemPrompt shape: TWO recipe copies +
// the full instruction block. workingDraft == original on the first turn.
const CHANGE_KINDS =
  "title_updated, description_updated, ingredient_added, ingredient_removed, ingredient_changed, step_added, step_removed, step_replaced, prep_updated, servings_changed, time_changed, tags_changed";
const REAL_PROMPT = `You are a recipe editor. Apply the user's instruction to the working draft, then return a JSON **patch** describing only what changed.

## Original recipe (the saved cookbook version — change list anchors against this)
\`\`\`json
${JSON.stringify(recipe, null, 2)}
\`\`\`

## Working draft (apply the instruction to this)
\`\`\`json
${JSON.stringify(recipe, null, 2)}
\`\`\`

## Instructions
- Apply the user's instruction as a precise, minimal change to the working draft.
- Return ONLY the fields that changed — do NOT echo unchanged fields.
- Arrays are all-or-nothing: if ANY element changed, return the ENTIRE updated array. If unchanged, OMIT the key.
- To clear an array entirely, return \`[]\`. Omitting a key means "leave unchanged".
- Scalar fields: include only if changed.
- Update the description if the dish character meaningfully changes.
- If the request would produce a wholly different dish, politely refuse in plain text.

## Response format
Return ONLY a valid JSON object. Include only changed fields; \`changes\` is always required:
{
  "ingredients": [ /* WHOLE array, only if changed */ ],
  "changes": [ { "kind": "<one of: ${CHANGE_KINDS}>", "ref": { "type": "ingredient|step", "index": 0, "basis": "original|workingDraft" }, "label": "<narrative label>" } ]
}
The \`changes\` array must list every structural delta against the original recipe.`;

const instruction = "less spicy — cut the doubanjiang and Sichuan pepper down";

async function run(label, system) {
  const t = Date.now();
  const { text, usage, finishReason } = await generateText({
    model: openai("gpt-4.1-mini"),
    system,
    messages: [{ role: "user", content: instruction }],
    maxOutputTokens: 8000,
  });
  const ms = Date.now() - t;
  console.log(
    `${label.padEnd(7)} ${String(ms).padStart(6)}ms  out=${usage.outputTokens} in=${usage.inputTokens} finish=${finishReason} chars=${text.length}`,
  );
  return ms;
}

console.log("instruction:", instruction, "\n");
for (let i = 0; i < 2; i++) {
  await run("REAL", REAL_PROMPT);
  await run("PATCH", PATCH_PROMPT);
  await run("WHOLE", WHOLE_PROMPT);
  console.log("");
}
