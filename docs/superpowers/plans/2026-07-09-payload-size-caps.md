# Payload Size Caps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `.max()` bounds to every free-text/array input identified in issue #395 that currently has no upper bound before reaching Postgres or an LLM prompt, returning 400 past the cap with no model call.

**Architecture:** Same pattern as the #360 precedent (`c99ad6a`): tighten existing Zod schemas with `.max()` on strings and arrays, validated via `.safeParse` before any DB write or `generateText`/`generateObject`/`streamText` call. `POST /api/chat`'s `parts` field is `z.array(z.unknown())` (heterogeneous, so no per-field schema applies) — bound it with a `.refine()` checking each part's serialized size. One additional gap found while implementing this (not in the issue's original list, but required for the schema bounds to actually bind): `POST /api/recipe`'s `body.recipe` is passed to `saveRecipeFromBlock` with **zero validation** — no `RecipeBlockSchema.safeParse` at all, so this write path bypasses the new bounds entirely unless it's added there too.

**Tech Stack:** Next.js route handlers, Zod, Jest + Testing Library.

## Global Constraints

- Every new bound returns HTTP 400 before any DB write or model call (`streamText`/`generateText`/`generateObject`/`saveRecipeFromBlock`).
- Every new bound gets a test asserting `status === 400` AND that the guarded expensive call was never invoked — follow the exact pattern from commit `c99ad6a` (message/chat route tests).
- Bound values (from the issue's proposal, "sized generously against real data"): message content ~4-8k chars → use 8000; recipe strings "a few hundred chars" → use the per-field values in Task 3; steps/ingredients arrays ~50; tip batches ~50 items; chat parts get a per-part serialized-size cap.
- `docs/progress.md` gets one new entry following the `### <Title> — Shipped (#395)` heading format used for `### Write-route input validation hardened — Shipped (#360)`.

---

### Task 1: Cap `POST /api/message` content length

**Files:**
- Modify: `src/app/api/message/route.ts:8-12`
- Test: `src/app/api/message/route.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing new (schema-only change, no exported signature changes).

- [ ] **Step 1: Add the bound to the schema**

In `src/app/api/message/route.ts`, replace:

```ts
const PostSchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().min(1),
  role: z.enum(["user", "assistant"]),
});
```

with:

```ts
const PostSchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().min(1).max(8000),
  role: z.enum(["user", "assistant"]),
});
```

- [ ] **Step 2: Write the failing test**

Add to the `describe("POST /api/message ...")` block in `src/app/api/message/route.test.ts` (place it next to the existing `"rejects role values outside user|assistant enum"` test):

```ts
    it("returns 400 when content exceeds 8000 characters", async () => {
      const request = createMockRequest("http://localhost:3000/api/message", {
        method: "POST",
        body: JSON.stringify({
          conversationId: "conv-123",
          content: "x".repeat(8001),
          role: "user",
        }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      expect(mockedCreateMessage).not.toHaveBeenCalled();
    });
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm test src/app/api/message/route.test.ts`
Expected: FAIL (content not yet capped, request currently succeeds with 200).

- [ ] **Step 4: Verify the test passes after Step 1's change**

Run: `pnpm test src/app/api/message/route.test.ts`
Expected: PASS, all tests in the file green.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/message/route.ts src/app/api/message/route.test.ts
git commit -m "fix(message): cap content length at 8000 chars"
```

---

### Task 2: Cap `POST /api/chat` per-part payload size

**Files:**
- Modify: `src/app/api/chat/route.ts:20-27`
- Test: `src/app/api/chat/route.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `MAX_PART_SIZE` constant (local to this file, not exported — no other task needs it).

- [ ] **Step 1: Add the per-part size bound**

In `src/app/api/chat/route.ts`, replace:

```ts
const UIMessageSchema = z
  .object({ id: z.string(), role: z.string(), parts: z.array(z.unknown()) })
  .passthrough();

const PostSchema = z.object({
  conversationId: z.string().min(1).max(100),
  messages: z.array(UIMessageSchema).max(100),
});
```

with:

```ts
// Parts are heterogeneous (text, tool-call, tool-result, ...) so no per-shape
// schema applies uniformly — bound the serialized size of each part instead.
const MAX_PART_SIZE = 20_000;

const UIMessageSchema = z
  .object({
    id: z.string(),
    role: z.string(),
    parts: z
      .array(z.unknown())
      .refine(
        (parts) => parts.every((part) => JSON.stringify(part).length <= MAX_PART_SIZE),
        { message: `Each message part must serialize to at most ${MAX_PART_SIZE} characters` },
      ),
  })
  .passthrough();

const PostSchema = z.object({
  conversationId: z.string().min(1).max(100),
  messages: z.array(UIMessageSchema).max(100),
});
```

- [ ] **Step 2: Write the failing test**

Add to the `describe("Chat API Route", ...)` block in `src/app/api/chat/route.test.ts`, next to the existing `"returns 400 when messages array exceeds 100 items"` test (same `createMockRequest` helper already defined in that file):

```ts
    it("returns 400 when a message part exceeds the per-part size cap", async () => {
      const request = createMockRequest({
        conversationId: "conv-123",
        messages: [
          {
            id: "msg-1",
            role: "user",
            parts: [{ type: "text", text: "x".repeat(20_001) }],
          },
        ],
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      expect(mockedStreamText).not.toHaveBeenCalled();
    });
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm test src/app/api/chat/route.test.ts`
Expected: FAIL (no per-part bound yet, oversized part currently passes validation).

- [ ] **Step 4: Verify the test passes after Step 1's change**

Run: `pnpm test src/app/api/chat/route.test.ts`
Expected: PASS, all tests in the file green.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/chat/route.ts src/app/api/chat/route.test.ts
git commit -m "fix(chat): cap per-part message payload size at 20000 chars"
```

---

### Task 3: Bound every string/array field on `RecipeBlockSchema`

**Files:**
- Modify: `src/lib/recipes/schemas.ts:4-54`
- Test: `src/lib/recipes/schemas.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `RecipeIngredientModelSchema`, `RecipeStepSchema`, `RecipeBlockSchema` — same exported names and shapes, now with `.max()` bounds. Task 4 and Task 5 rely on this schema (imported as-is, no signature change) to reject oversized payloads via their existing `.safeParse` calls.

This is the single choke point: `RecipeBlockSchema` is used by `parseRecipeText.ts` (model structured-output schema), `parseBlocks.ts` (parsing `\`\`\`recipe` fenced blocks from chat), `/api/recipe/[id]/route.ts` (PATCH validation), and `/api/recipe/[id]/tweak/route.ts` (via `RecipeBlockWithIdSchema = RecipeBlockSchema.extend(...)`, serialized into the tweak prompt). Bounding it here covers all four call sites in one change.

- [ ] **Step 1: Add bounds to `RecipeStepSchema`**

Replace:

```ts
// Step in a structured recipe
export const RecipeStepSchema = z.object({
  title: z.string(),
  body: z.string(),
  tip: z.string().optional(),
});
```

with:

```ts
// Step in a structured recipe
export const RecipeStepSchema = z.object({
  title: z.string().max(100),
  body: z.string().max(2000),
  tip: z.string().max(500).optional(),
});
```

- [ ] **Step 2: Add bounds to `RecipeIngredientModelSchema`**

Replace:

```ts
// Ingredient as emitted by the model (amounts as strings for scaling)
export const RecipeIngredientModelSchema = z.object({
  name: z.string(),
  category: CategorySchema.nullish().transform((v) => v ?? undefined),
  amount: z.string().nullish().transform((v) => v ?? undefined),   // string so "1 1/2" works
  unit: z.string().nullish().transform((v) => v ?? undefined),
  note: z.string().nullish().transform((v) => v ?? undefined),
});
```

with:

```ts
// Ingredient as emitted by the model (amounts as strings for scaling)
export const RecipeIngredientModelSchema = z.object({
  name: z.string().max(200),
  category: CategorySchema.nullish().transform((v) => v ?? undefined),
  amount: z.string().max(20).nullish().transform((v) => v ?? undefined),   // string so "1 1/2" works
  unit: z.string().max(20).nullish().transform((v) => v ?? undefined),
  note: z.string().max(300).nullish().transform((v) => v ?? undefined),
});
```

- [ ] **Step 3: Add bounds to `RecipeBlockSchema`**

Replace:

```ts
// Full structured recipe block (```recipe fenced JSON)
export const RecipeBlockSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  totalTimeMinutes: z.number().optional(),
  baseServings: z.number(),
  ingredients: z.array(RecipeIngredientModelSchema),
  prep: z.array(z.string()).optional(),
  steps: z.array(RecipeStepSchema),
  // Whole-dish asides (make-ahead, storage, serving, pantry-independent
  // technique fallbacks). NOT pantry substitutions — those live on the
  // ingredient `note` and the "Ask Ah Mah for substitutions" affordance.
  notes: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  // Set by the model in Cook With What You Have (Mode 3) responses only.
  // "close" = 0–2 additions (UI: "Right now"); "stretch" = 3–4 additions (UI: "Worth a small trip").
  closeness: z.enum(["close", "stretch"]).optional(),
  // Explicit "I made this" marker (ADR-0020) — a recall flag, never inferred or scored.
  // Carried here only so saved recipes round-trip through updates; the create
  // path (saveRecipeFromBlock) ignores it, so a model-streamed block can never
  // stamp a recipe.
  cooked: z.boolean().optional(),
});
```

with:

```ts
// Full structured recipe block (```recipe fenced JSON)
export const RecipeBlockSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  totalTimeMinutes: z.number().optional(),
  baseServings: z.number(),
  ingredients: z.array(RecipeIngredientModelSchema).max(50),
  prep: z.array(z.string().max(300)).max(50).optional(),
  steps: z.array(RecipeStepSchema).max(50),
  // Whole-dish asides (make-ahead, storage, serving, pantry-independent
  // technique fallbacks). NOT pantry substitutions — those live on the
  // ingredient `note` and the "Ask Ah Mah for substitutions" affordance.
  notes: z.array(z.string().max(500)).max(20).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  // Set by the model in Cook With What You Have (Mode 3) responses only.
  // "close" = 0–2 additions (UI: "Right now"); "stretch" = 3–4 additions (UI: "Worth a small trip").
  closeness: z.enum(["close", "stretch"]).optional(),
  // Explicit "I made this" marker (ADR-0020) — a recall flag, never inferred or scored.
  // Carried here only so saved recipes round-trip through updates; the create
  // path (saveRecipeFromBlock) ignores it, so a model-streamed block can never
  // stamp a recipe.
  cooked: z.boolean().optional(),
});
```

- [ ] **Step 4: Write failing tests**

Add a new `describe` block to `src/lib/recipes/schemas.test.ts` (the file already imports `RecipeBlockSchema`, `RecipeIngredientModelSchema`, and `RecipeStepSchema` — no new imports needed):

```ts
describe("RecipeBlockSchema size bounds", () => {
  const baseBlock = {
    title: "Test",
    baseServings: 2,
    ingredients: [{ name: "salt" }],
    steps: [{ title: "Cook", body: "Cook it" }],
  };

  it("rejects a title over 200 characters", () => {
    const result = RecipeBlockSchema.safeParse({ ...baseBlock, title: "x".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("rejects a description over 500 characters", () => {
    const result = RecipeBlockSchema.safeParse({
      ...baseBlock,
      description: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 50 ingredients", () => {
    const result = RecipeBlockSchema.safeParse({
      ...baseBlock,
      ingredients: Array.from({ length: 51 }, (_, i) => ({ name: `item-${i}` })),
    });
    expect(result.success).toBe(false);
  });

  it("rejects an ingredient name over 200 characters", () => {
    const result = RecipeIngredientModelSchema.safeParse({ name: "x".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("rejects more than 50 steps", () => {
    const result = RecipeBlockSchema.safeParse({
      ...baseBlock,
      steps: Array.from({ length: 51 }, (_, i) => ({ title: `Step ${i}`, body: "do it" })),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a step body over 2000 characters", () => {
    const result = RecipeStepSchema.safeParse({ title: "Cook", body: "x".repeat(2001) });
    expect(result.success).toBe(false);
  });

  it("rejects more than 20 tags", () => {
    const result = RecipeBlockSchema.safeParse({
      ...baseBlock,
      tags: Array.from({ length: 21 }, (_, i) => `tag-${i}`),
    });
    expect(result.success).toBe(false);
  });

  it("still accepts a recipe block within all bounds", () => {
    const result = RecipeBlockSchema.safeParse(baseBlock);
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 5: Run the tests to verify they fail**

Run: `pnpm test src/lib/recipes/schemas.test.ts`
Expected: FAIL on every `rejects ...` case (bounds not yet added), PASS on the "still accepts" case.

- [ ] **Step 6: Verify all tests pass after Steps 1-3's changes**

Run: `pnpm test src/lib/recipes/schemas.test.ts`
Expected: PASS, all tests in the file green.

- [ ] **Step 7: Commit**

```bash
git add src/lib/recipes/schemas.ts src/lib/recipes/schemas.test.ts
git commit -m "fix(recipes): bound RecipeBlockSchema string and array fields"
```

---

### Task 4: Enforce validation on `POST /api/recipe`'s untyped `body.recipe`

**Files:**
- Modify: `src/app/api/recipe/route.ts:1-27`
- Test: `src/app/api/recipe/route.test.ts`

**Interfaces:**
- Consumes: `RecipeBlockSchema` from `@/lib/recipes/schemas` (bounded in Task 3).
- Produces: nothing new for later tasks.

Currently `body.recipe` flows straight into `saveRecipeFromBlock(body.recipe, ...)` with **no validation at all** — not even a shape check, let alone the new size bounds. This is the actual DB-write path Task 3's bounds are meant to protect; without this task, a client can still POST an unbounded recipe block directly and it reaches Postgres unchecked.

- [ ] **Step 1: Add `RecipeBlockSchema` import and validation**

In `src/app/api/recipe/route.ts`, replace the import block:

```ts
import { deleteRecipeForUser, getRecipes, saveRecipe, saveRecipeFromBlock } from "@/lib/recipes";
import { processRecipe } from "@/lib/recipes/recipeProcessor";
import { normalizeTags } from "@/lib/recipes/normalizeTags";
import { fetchRecipePhoto } from "@/lib/pexels/fetchPhoto";
import { NotFoundError } from "@/lib/errors";
import { withAuth } from "@/lib/withAuth";
import { NextRequest, NextResponse } from "next/server";
```

with:

```ts
import { deleteRecipeForUser, getRecipes, saveRecipe, saveRecipeFromBlock } from "@/lib/recipes";
import { processRecipe } from "@/lib/recipes/recipeProcessor";
import { normalizeTags } from "@/lib/recipes/normalizeTags";
import { RecipeBlockSchema } from "@/lib/recipes/schemas";
import { fetchRecipePhoto } from "@/lib/pexels/fetchPhoto";
import { NotFoundError } from "@/lib/errors";
import { withAuth } from "@/lib/withAuth";
import { NextRequest, NextResponse } from "next/server";
```

Then replace the start of the `POST` handler:

```ts
export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const body = await req.json();
  const { recipeId } = body;

  if (body.recipe) {
    // `cooked` rides beside the block, never inside it — the block is
    // model-streamed and must not be able to set the marker (ADR-0020).
    const recipe = await saveRecipeFromBlock(
      body.recipe,
      userId,
      recipeId ?? undefined,
      body.cooked === true,
    );
    return NextResponse.json(recipe);
  }
```

with:

```ts
export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const body = await req.json();
  const { recipeId } = body;

  if (body.recipe) {
    const parsed = RecipeBlockSchema.safeParse(body.recipe);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid recipe payload" }, { status: 400 });
    }

    // `cooked` rides beside the block, never inside it — the block is
    // model-streamed and must not be able to set the marker (ADR-0020).
    const recipe = await saveRecipeFromBlock(
      parsed.data,
      userId,
      recipeId ?? undefined,
      body.cooked === true,
    );
    return NextResponse.json(recipe);
  }
```

- [ ] **Step 2: Write the failing test**

Add to the `describe("POST /api/recipe", ...)` block in `src/app/api/recipe/route.test.ts`, next to the existing structured-payload test (the file already has `createMockRequest` and `mockedSaveRecipeFromBlock` defined):

```ts
    it("returns 400 for a recipe payload with a title over 200 characters", async () => {
      const request = createMockRequest("http://localhost:3000/api/recipe", {
        method: "POST",
        body: JSON.stringify({
          userId: "user-123",
          recipe: {
            title: "x".repeat(201),
            ingredients: [],
            steps: [],
            tags: [],
            baseServings: 2,
          },
        }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      expect(mockedSaveRecipeFromBlock).not.toHaveBeenCalled();
    });
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm test src/app/api/recipe/route.test.ts`
Expected: FAIL (no validation yet, `saveRecipeFromBlock` currently gets called with the oversized title).

- [ ] **Step 4: Verify all tests pass after Step 1's change**

Run: `pnpm test src/app/api/recipe/route.test.ts`
Expected: PASS, all tests in the file green — including the pre-existing structured-payload tests, since their fixture recipe blocks are all within the new bounds.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/recipe/route.ts src/app/api/recipe/route.test.ts
git commit -m "fix(recipe): validate body.recipe against RecipeBlockSchema before saving"
```

---

### Task 5: Confirm the tweak route now rejects oversized recipe payloads

**Files:**
- Test: `src/app/api/recipe/[id]/tweak/route.test.ts`

**Interfaces:**
- Consumes: `RecipeBlockWithIdSchema` (unchanged code — it's `RecipeBlockSchema.extend({ id: z.string() })`, so Task 3's bounds already apply here automatically).
- Produces: nothing new.

No production code change — `route.ts` already calls `RecipeBlockWithIdSchema.safeParse(originalRecipeRaw)` before calling `generateText`. This task only adds regression coverage confirming Task 3's bounds are enforced on this path too, per the issue's explicit call-out ("`/api/recipe/[id]/tweak` serializes the whole recipe into its system prompt").

- [ ] **Step 1: Write the test**

Add to `src/app/api/recipe/[id]/tweak/route.test.ts`, in the `describe` block that covers `originalRecipe` validation (the file already defines `validRecipeBlock`, `makeRequest`, and `params`):

```ts
    it("returns 400 when originalRecipe has a step over 2000 characters", async () => {
      const request = makeRequest({
        instruction: "make it spicier",
        originalRecipe: {
          ...validRecipeBlock,
          steps: [{ title: "Cook", body: "x".repeat(2001) }],
        },
      });

      const response = await POST(request, { params });
      expect(response.status).toBe(400);
      expect(mockedGenerateText).not.toHaveBeenCalled();
    });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test "src/app/api/recipe/[id]/tweak/route.test.ts"`
Expected: FAIL before Task 3 lands (or PASS immediately if Task 3 already merged first — if so, skip to Step 3 without expecting a red run; the plan executes tasks in order so Task 3 is already committed by the time this task runs).

- [ ] **Step 3: Verify the test passes**

Run: `pnpm test "src/app/api/recipe/[id]/tweak/route.test.ts"`
Expected: PASS, all tests in the file green.

- [ ] **Step 4: Commit**

```bash
git add "src/app/api/recipe/[id]/tweak/route.test.ts"
git commit -m "test(recipe): cover tweak route rejecting oversized recipe payloads"
```

---

### Task 6: Reduce and bound `storage-tip` / `market-tip` item batches

**Files:**
- Modify: `src/app/api/storage-tip/route.ts:11-22`
- Modify: `src/app/api/market-tip/route.ts:11-22`
- Test: `src/app/api/storage-tip/route.test.ts`
- Test: `src/app/api/market-tip/route.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing new.

- [ ] **Step 1: Bound `storage-tip`'s schema**

In `src/app/api/storage-tip/route.ts`, replace:

```ts
const RequestSchema = z.object({
  items: z
    .array(
      z.object({
        name: z.string().min(1),
        // "ingredient" | "kitchenware" — steers food-vs-equipment advice.
        type: z.string().nullish(),
      }),
    )
    .min(1)
    .max(200),
});
```

with:

```ts
const RequestSchema = z.object({
  items: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        // "ingredient" | "kitchenware" — steers food-vs-equipment advice.
        type: z.string().nullish(),
      }),
    )
    .min(1)
    .max(50),
});
```

- [ ] **Step 2: Bound `market-tip`'s schema**

In `src/app/api/market-tip/route.ts`, replace:

```ts
const RequestSchema = z.object({
  items: z
    .array(
      z.object({
        name: z.string().min(1),
        category: z.string().nullish(),
      }),
    )
    .min(1)
    .max(200),
});
```

with:

```ts
const RequestSchema = z.object({
  items: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        category: z.string().nullish(),
      }),
    )
    .min(1)
    .max(50),
});
```

- [ ] **Step 3: Write the failing tests**

Add to `src/app/api/storage-tip/route.test.ts` (the file already defines `reqWith` and `mockedGenerate`):

```ts
  it("returns 400 when items exceeds 50 entries", async () => {
    const req = reqWith({
      items: Array.from({ length: 51 }, (_, i) => ({ name: `item-${i}` })),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    expect(mockedGenerate).not.toHaveBeenCalled();
  });

  it("returns 400 when an item name exceeds 200 characters", async () => {
    const req = reqWith({ items: [{ name: "x".repeat(201) }] });

    const response = await POST(req);
    expect(response.status).toBe(400);
    expect(mockedGenerate).not.toHaveBeenCalled();
  });
```

Add the same two tests (same shapes, same helper names) to `src/app/api/market-tip/route.test.ts`.

- [ ] **Step 4: Run the tests to verify they fail**

Run: `pnpm test src/app/api/storage-tip/route.test.ts src/app/api/market-tip/route.test.ts`
Expected: FAIL on the new "exceeds 50 entries" cases (cap is currently 200); the "exceeds 200 characters" cases may already fail differently or pass depending on current schema — confirm both go red for the right reason (no `.max()` on `name` yet, no reduced array cap yet) before Step 1/2's changes land.

- [ ] **Step 5: Verify all tests pass after Steps 1-2's changes**

Run: `pnpm test src/app/api/storage-tip/route.test.ts src/app/api/market-tip/route.test.ts`
Expected: PASS, all tests in both files green.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/storage-tip/route.ts src/app/api/storage-tip/route.test.ts src/app/api/market-tip/route.ts src/app/api/market-tip/route.test.ts
git commit -m "fix(tips): reduce item batch cap to 50 and bound item name length"
```

---

### Task 7: Docs — progress.md entry, full test suite, typecheck

**Files:**
- Modify: `docs/progress.md`

- [ ] **Step 1: Add a progress.md entry**

Read `docs/progress.md` first to find the `### Write-route input validation hardened — Shipped (#360)` section (this is the precedent entry to match in tone/format), then add a new section directly after it:

```markdown
### Payload size caps — Shipped (#395)

- **`POST /api/message`**: `content` capped at 8000 characters (was unbounded).
- **`POST /api/chat`**: each message `part` capped at 20,000 serialized characters via a `.refine()` (parts are heterogeneous — `z.unknown()` — so no per-shape schema applies uniformly).
- **`RecipeBlockSchema`** (`src/lib/recipes/schemas.ts`): every string and array field bounded (title ≤200 chars, description ≤500, ingredients/steps ≤50 entries, ingredient name ≤200, step body ≤2000, notes/tags ≤20 entries). This is the single choke point for `parseRecipeText`, `parseBlocks`, `/api/recipe/[id]` PATCH, and `/api/recipe/[id]/tweak` (which serializes the whole recipe into its system prompt) — bounding it here covers all four.
- **`POST /api/recipe`**: found mid-implementation that `body.recipe` had **no validation at all** before reaching `saveRecipeFromBlock` — not even a shape check. Added `RecipeBlockSchema.safeParse` so the new bounds actually apply to this write path.
- **`POST /api/market-tip` / `/api/storage-tip`**: item batch cap reduced from 200 to 50 (pantry-sized batches are far smaller); item `name` capped at 200 characters.
- Tests updated across all six routes/schema file, following the #360 pattern: assert 400 status and that the guarded model/DB call was never invoked.
```

- [ ] **Step 2: Run the full test suite**

Run: `pnpm test`
Expected: All tests pass, including every test added in Tasks 1-6.

- [ ] **Step 3: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: No errors introduced by this branch (pre-existing unrelated errors on `main`, if any, are not this branch's concern — confirm by comparing against a clean checkout of `main` if anything shows up).

- [ ] **Step 4: Commit**

```bash
git add docs/progress.md
git commit -m "docs: add progress.md entry for payload size caps (#395)"
```

---
