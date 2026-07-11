# Ah Mah's Step Note (CookingMode)

This project does not have a separate, model-authored per-step encouragement/reassurance line in CookingMode, distinct from the existing `step.tip` field.

## Why this is out of scope

Deprioritized during brainstorming for #378, not rejected on the merits: "lets kiv issue 378. i feel its not so important." (2026-07-10)

Before it was shelved, brainstorming surfaced a real design gap worth recording: `step.tip` (`src/lib/recipes/schemas.ts`) already covers sensory doneness cues and failure-mode cautions, per the current `CHAT_SYSTEM_PROMPT` recipe-block instructions (`src/app/api/chat/constants.ts`). The step-note example in the issue — "listen for the sizzle — pull it the moment it's golden" — reads almost identically to what `tip` is already asked to produce. Shipping both fields without resolving that overlap risks the model writing the same content twice on one step.

```ts
// src/lib/recipes/schemas.ts
export const RecipeStepSchema = z.object({
  title: z.string(),
  body: z.string(),
  tip: z.string().optional(),   // already covers sensory/doneness/failure-mode content
  uses: z.array(RecipeStepUseSchema).optional(),
});
```

## When to revisit

Reopen this if the owner decides it's worth the design work again. Whoever picks it up should resolve the overlap first — e.g. by deciding the step note is *pure* encouragement with zero technique content ("you've got this"), or that it replaces `tip` entirely on steps judged "tricky" — before writing any prompt instructions or a visual treatment.

## Prior requests

- #378 — Ah Mah's step note (model-authored, per dish) in CookingMode
