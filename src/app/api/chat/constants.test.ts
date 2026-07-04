import { extractRecipeBlocks } from "@/lib/recipes/parseBlocks";
import { PROMPT_FRAGMENTS } from "@/lib/prompts/fragments";
import { RecipeBlockSchema } from "@/lib/recipes/schemas";
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
