import { extractRecipeBlocks } from "@/lib/recipes/parseBlocks";
import { PROMPT_FRAGMENTS } from "@/lib/prompts/fragments";
import {
  ChecklistBlockSchema,
  ClarifyBlockSchema,
  RecipeBlockSchema,
} from "@/lib/recipes/schemas";
import type { ChecklistBlockData } from "@/lib/recipes/schemas";
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

  it("routes makeable components and basics (not only plated dishes) to a recipe", () => {
    // "how to make mayonnaise?" must emit a `recipe` block, not fall through to
    // prose as a general question. Guards the Mode 2 broadening clause.
    expect(CHAT_SYSTEM_PROMPT).toContain("any concrete edible");
    expect(CHAT_SYSTEM_PROMPT).toMatch(/mayonnaise/i);
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

// Mode 5 (checklist) reopens "never ask" a third time — for a **possession**,
// which ADR-0024 explicitly kept shut. These guard the worked example's shape
// and the boundaries that keep the reopening bounded (ADR-0026).
describe("CHAT_SYSTEM_PROMPT checklist mode", () => {
  it("carries a checklist example that parses against ChecklistBlockSchema", () => {
    const blocks = extractRecipeBlocks(CHAT_SYSTEM_PROMPT);
    const checklist = blocks.find((b) => b.kind === "checklist");

    expect(checklist).toBeDefined();
    expect(ChecklistBlockSchema.safeParse(checklist!.payload).success).toBe(true);
  });

  it("keeps the example within the 1–4 row cap and off the free staples", () => {
    const blocks = extractRecipeBlocks(CHAT_SYSTEM_PROMPT);
    const checklist = blocks.find((b) => b.kind === "checklist");
    const rows = (checklist!.payload as ChecklistBlockData).rows;

    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows.length).toBeLessThanOrEqual(4);
    // Free staples never earn a row — they are never Additions either.
    for (const row of rows) {
      expect(row.label.toLowerCase()).not.toMatch(/^(salt|pepper|water|cooking oil)$/);
    }
    // Every row carries a category, so a tick lands in the right pantry bucket.
    for (const row of rows) expect(row.category).toBeDefined();
  });

  it("retains the possession governing rule that separates the three blocks", () => {
    // The line that stops suggestions / clarify / checklist swallowing each
    // other: dish vs. parameter vs. possession.
    expect(CHAT_SYSTEM_PROMPT).toMatch(/checklist asks about a \*\*possession\*\*/i);
  });

  it("retains the name test — what earns a row is what the name rests on", () => {
    expect(CHAT_SYSTEM_PROMPT).toContain("name test");
    expect(CHAT_SYSTEM_PROMPT).toMatch(/can no longer honestly carry its name/i);
  });

  it("states both sides of the deal up front", () => {
    // The fallback is announced terms, not a later climb-down.
    expect(CHAT_SYSTEM_PROMPT).toMatch(/both sides up front/i);
  });

  it("keeps the name binary and forbids a majority-ticks rename", () => {
    expect(CHAT_SYSTEM_PROMPT).toMatch(/name is binary/i);
    expect(CHAT_SYSTEM_PROMPT).toMatch(/Never keep the name because "most" were ticked/i);
  });

  it("requires the honest name on the fallback, in the recipe title too", () => {
    expect(CHAT_SYSTEM_PROMPT).toMatch(/Honest naming on the fallback/i);
    expect(CHAT_SYSTEM_PROMPT).toMatch(/wear a name it has not earned/i);
  });

  it("scopes the gate per dish and forbids carrying answers between dishes", () => {
    expect(CHAT_SYSTEM_PROMPT).toMatch(/one checklist per dish/i);
    expect(CHAT_SYSTEM_PROMPT).toMatch(/no limit per conversation/i);
    expect(CHAT_SYSTEM_PROMPT).toMatch(
      /Never carry a previous checklist's answers to a different dish/i,
    );
  });

  it("keeps freshness banned through this reopening too (ADR-0008)", () => {
    // Presence is knowable by the user; freshness is not, at any interface.
    expect(CHAT_SYSTEM_PROMPT).toMatch(/Presence, never freshness/i);
    expect(CHAT_SYSTEM_PROMPT).toMatch(
      /NEVER ask whether an item is still good, fresh, unexpired, or safe to eat/i,
    );
  });

  it("treats a buildable component as no gap at all", () => {
    // The worry this guards: a faithful substitute gets a row, and the hard
    // rename rule then strips a name the dish had actually earned. Making a
    // rempah from pantry components is not substituting one — no gap, no ask.
    expect(CHAT_SYSTEM_PROMPT).toMatch(/anything the pantry can already build/i);
    expect(CHAT_SYSTEM_PROMPT).toMatch(
      /making the thing is not substituting the thing/i,
    );
    // And the older, looser form of the same idea stays put.
    expect(CHAT_SYSTEM_PROMPT).toMatch(
      /freely substitutable without touching the name/i,
    );
  });

  it("stops the model re-adding what the ticks already wrote", () => {
    // The reply sentence ("I've got the X and Y.") looks exactly like the
    // "user says they have X" routing rows, which pull toward addInventoryItem.
    // A second, differently-worded add lands a near-duplicate pantry row, so the
    // submitted-checklist row has to win explicitly.
    expect(CHAT_SYSTEM_PROMPT).toMatch(
      /This row wins over the "user says they have X" rows above/i,
    );
    expect(CHAT_SYSTEM_PROMPT).toMatch(/near-duplicate row/i);
  });

  it("never asks back what the user just declared absent", () => {
    // "laksa but I've no paste or coconut milk" answers the card before it is
    // raised — asking it straight back reads as not listening, and it burns the
    // one card the dish gets.
    expect(CHAT_SYSTEM_PROMPT).toMatch(
      /nor anything the user has just told you they do not have/i,
    );
    expect(CHAT_SYSTEM_PROMPT).toMatch(/asking it straight back is not listening/i);
    // And an emptied list is not a card with no rows — it is no card.
    expect(CHAT_SYSTEM_PROMPT).toMatch(/If that empties the list/i);
  });

  it("scopes a confirmed-absent verdict to the cooking, not the conversation", () => {
    // Without this the user who goes to the shops mid-conversation is stuck:
    // asking for the dish again silently re-serves the bent version forever.
    expect(CHAT_SYSTEM_PROMPT).toMatch(/per cooking, not per conversation/i);
    expect(CHAT_SYSTEM_PROMPT).toMatch(
      /binds the dish you cooked, not the rest of the conversation/i,
    );
    expect(CHAT_SYSTEM_PROMPT).toMatch(
      /never silently re-serve the bent dish under the old verdict/i,
    );
  });

  it("forks make-your-own vs. store-bought before asking about possession", () => {
    // Owner's shape: "do you want to make your own paste or buy it?" then "do
    // you have candlenut, dried chilli...". Two existing blocks, chained — the
    // fork is an *effort* parameter (clarify), the follow-up a possession
    // (checklist). Asking about the makings matters because a jar is memorable
    // and loose candlenuts at the back of a cupboard are exactly what the
    // pantry record misses.
    expect(CHAT_SYSTEM_PROMPT).toMatch(/makeable fork/i);
    expect(CHAT_SYSTEM_PROMPT).toMatch(/make in one session/i);
    expect(CHAT_SYSTEM_PROMPT).toMatch(/that route's.*ingredients, never both/i);
  });

  it("bounds the fork so it cannot become a permission question", () => {
    // Long-ferment items have no honest from-scratch route, and a dish she can
    // already cook must never be gated on "how would you like it made?".
    expect(CHAT_SYSTEM_PROMPT).toMatch(/Not makeable in one session/i);
    expect(CHAT_SYSTEM_PROMPT).toMatch(/months of fermentation or culture/i);
    expect(CHAT_SYSTEM_PROMPT).toMatch(
      /Never fork on a dish you can already cook/i,
    );
    expect(CHAT_SYSTEM_PROMPT).toMatch(/a permission question wearing a costume/i);
  });

  it("carries a fork example that parses as a clarify block", () => {
    // The fork rides Mode 4's existing block, so its example must satisfy the
    // same schema — two options, each a complete answer the user would say.
    const clarifies = extractRecipeBlocks(CHAT_SYSTEM_PROMPT).filter(
      (b) => b.kind === "clarify",
    );
    expect(clarifies.length).toBeGreaterThanOrEqual(2);
    for (const block of clarifies) {
      expect(ClarifyBlockSchema.safeParse(block.payload).success).toBe(true);
    }
    const fork = clarifies.find((b) =>
      (b.payload as { options: { id: string }[] }).options.some(
        (o) => o.id === "from-scratch",
      ),
    );
    expect(fork).toBeDefined();
  });

  it("reconciles the mode count and Mode 2's no-gate rule", () => {
    // A stale "four output modes" would leave the model with a mode it is told
    // it does not have.
    expect(CHAT_SYSTEM_PROMPT).toContain("five output modes");
    expect(CHAT_SYSTEM_PROMPT).toMatch(/single exception is Mode 5/i);
  });

  it("keeps the prose 'do you have X?' ban intact", () => {
    // The ban survives verbatim — the checklist is a block, not prose.
    expect(CHAT_SYSTEM_PROMPT).toContain('Never ask "do you have X?" in prose');
  });
});
