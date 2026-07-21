import { extractRecipeBlocks } from "@/lib/recipes/parseBlocks";
import { PROMPT_FRAGMENTS } from "@/lib/prompts/fragments";
import { ClarifyBlockSchema, RecipeBlockSchema } from "@/lib/recipes/schemas";
import { CHAT_SYSTEM_PROMPT } from "./constants";

// The system prompt carries a worked `recipe` example the model mirrors. If a
// prompt edit (e.g. the step-depth guidance, ADR-0011) drifts that example out
// of `RecipeBlockSchema`, the model is being shown an invalid shape — catch it
// here rather than in production.
describe("CHAT_SYSTEM_PROMPT recipe example", () => {
  it("still parses against RecipeBlockSchema", () => {
    const blocks = extractRecipeBlocks(CHAT_SYSTEM_PROMPT);
    const recipe = blocks.find((b) => b.kind === "recipe");

    expect(recipe).toBeDefined();
    expect(RecipeBlockSchema.safeParse(recipe!.payload).success).toBe(true);
  });

  it("retains the step-depth and no-quantity-in-step-bodies guidance", () => {
    // Cheap guard that the depth guidance survived future edits — both clauses
    // the issue requires must remain in the prompt.
    expect(CHAT_SYSTEM_PROMPT).toContain("Step depth is earned");
    expect(CHAT_SYSTEM_PROMPT).toContain("Never echo absolute quantities into step bodies");
  });

  it("carries the shared comprehensible-voice fragment", () => {
    expect(CHAT_SYSTEM_PROMPT).toContain(PROMPT_FRAGMENTS.comprehensibleVoice);
  });

  it("carries the diagnostic balance-check fragment", () => {
    expect(CHAT_SYSTEM_PROMPT).toContain(PROMPT_FRAGMENTS.balanceCheck);
  });

  it("carries the distilled voice-stance fragment", () => {
    expect(CHAT_SYSTEM_PROMPT).toContain(PROMPT_FRAGMENTS.voiceStance);
  });
});

// Mode 4 (clarify) reopened "never ask" — the model may now ask one tappable
// clarifying question. These guard the worked example's shape and the two
// boundaries that keep the reopening bounded (ADR-0024).
describe("CHAT_SYSTEM_PROMPT clarify mode", () => {
  it("carries a clarify example that parses against ClarifyBlockSchema", () => {
    const blocks = extractRecipeBlocks(CHAT_SYSTEM_PROMPT);
    const clarify = blocks.find((b) => b.kind === "clarify");

    expect(clarify).toBeDefined();
    expect(ClarifyBlockSchema.safeParse(clarify!.payload).success).toBe(true);
  });

  it("retains the dish-vs-parameter governing rule", () => {
    // The line that keeps clarify from stealing suggestions' job: clarify picks
    // a parameter, suggestions picks a dish.
    expect(CHAT_SYSTEM_PROMPT).toContain("parameter");
    expect(CHAT_SYSTEM_PROMPT).toMatch(/clarify picks a \*\*parameter\*\*/i);
  });

  it("keeps the shelf-life / freshness question off-limits (ADR-0008)", () => {
    // Clarify narrows the request, never audits the user's perishables.
    expect(CHAT_SYSTEM_PROMPT).toContain("ADR-0008");
    expect(CHAT_SYSTEM_PROMPT).toMatch(/never.*freshness|freshness.*never/i);
  });
});
