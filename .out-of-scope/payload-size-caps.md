# Payload Size Caps

This project does not enforce upper-bound length/size validation on free-text inputs (message content, recipe fields, tip batches) before they reach the database or an LLM prompt.

## Why this is out of scope

A full implementation was proposed in PR #411 — bounded `content` on the message-create route, per-string/per-array caps on `RecipeBlockSchema`, a per-part size bound on chat message parts, and reduced market-tip/storage-tip batch sizes, all with test coverage and passing CI. The owner closed the PR without merging: "i do not like this payload size cap." The specific objection wasn't elaborated beyond that — not a quality complaint about the implementation, a disagreement with the approach itself.

```ts
// src/lib/recipes/schemas.ts — RecipeBlockSchema strings/arrays are
// currently unbounded; PR #411's caps here were the part rejected.
export const RecipeBlockSchema = z.object({
  title: z.string(),
  ingredients: z.array(RecipeIngredientModelSchema),
  steps: z.array(RecipeStepSchema),
  // ...
});
```

## When to revisit

Reopen this if:

- The owner articulates a specific alternative approach to bounding input size (e.g. rate-limiting instead of per-field caps, or bounding at a different layer)
- A real incident occurs where an oversized payload causes a DB or LLM cost problem

Until then, don't re-attempt the per-field Zod `.max()` approach from PR #411 without first asking what specifically didn't work about it.

## Prior requests

- #395 — security: cap payload sizes on inputs that feed the DB and LLM prompts (PR #411, closed unmerged)
