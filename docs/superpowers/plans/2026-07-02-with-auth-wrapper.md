# withAuth Route Wrapper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract repeated auth boilerplate from every API route into two wrapper functions — `withAuth` (static routes) and `withAuthDynamic` (dynamic routes with URL params).

**Architecture:** A new `src/lib/withAuth.ts` exports two HOFs. Each calls `getSessionUserId` and returns `unauthorized()` on null, then forwards the verified `userId` to the handler. Existing route tests continue to work unchanged — they already mock `getSessionUserId`, which the wrapper calls internally.

**Tech Stack:** Next.js App Router, TypeScript, Jest + Testing Library

## Global Constraints

- Use `pnpm` (not npm)
- Commit style: `type(scope): description`
- Never touch `src/app/api/auth/[...all]/route.ts` — it is the auth provider
- Import `withAuth`/`withAuthDynamic` from `@/lib/withAuth`

---

### Task 1: Create `withAuth` and `withAuthDynamic` with tests

**Files:**
- Create: `src/lib/withAuth.ts`
- Create: `src/lib/withAuth.test.ts`

**Interfaces:**
- Produces:
  - `withAuth(handler: (req: NextRequest, ctx: { userId: string }) => Promise<Response>): (req: NextRequest) => Promise<Response>`
  - `withAuthDynamic<P extends Record<string, string>>(handler: (req: NextRequest, ctx: { userId: string; params: Promise<P> }) => Promise<Response>): (req: NextRequest, routeCtx: { params: Promise<P> }) => Promise<Response>`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/withAuth.test.ts`:

```ts
import { getSessionUserId } from "@/lib/session";
import { NextRequest } from "next/server";
import { withAuth, withAuthDynamic } from "./withAuth";

jest.mock("@/lib/session", () => ({ getSessionUserId: jest.fn() }));
jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status ?? 200,
    })),
  },
}));

const mockedGetSessionUserId = jest.mocked(getSessionUserId);
const makeRequest = () => ({}) as NextRequest;

describe("withAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetSessionUserId.mockResolvedValue("user-123");
  });

  it("returns 401 and does not call handler when unauthenticated", async () => {
    mockedGetSessionUserId.mockResolvedValue(null);
    const handler = jest.fn();
    const route = withAuth(handler);
    const res = await route(makeRequest());
    expect(res.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("calls handler with injected userId when authenticated", async () => {
    const handler = jest.fn().mockResolvedValue(new Response(null, { status: 200 }));
    const route = withAuth(handler);
    await route(makeRequest());
    expect(handler).toHaveBeenCalledWith(expect.anything(), { userId: "user-123" });
  });
});

describe("withAuthDynamic", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetSessionUserId.mockResolvedValue("user-123");
  });

  it("returns 401 and does not call handler when unauthenticated", async () => {
    mockedGetSessionUserId.mockResolvedValue(null);
    const handler = jest.fn();
    const route = withAuthDynamic(handler);
    const params = Promise.resolve({ id: "r1" });
    const res = await route(makeRequest(), { params });
    expect(res.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("calls handler with userId and params when authenticated", async () => {
    const handler = jest.fn().mockResolvedValue(new Response(null, { status: 200 }));
    const route = withAuthDynamic(handler);
    const params = Promise.resolve({ id: "r1" });
    await route(makeRequest(), { params });
    expect(handler).toHaveBeenCalledWith(
      expect.anything(),
      { userId: "user-123", params }
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test src/lib/withAuth.test.ts
```

Expected: FAIL — `withAuth` and `withAuthDynamic` are not defined yet.

- [ ] **Step 3: Implement `src/lib/withAuth.ts`**

```ts
import { unauthorized } from "@/lib/http";
import { getSessionUserId } from "@/lib/session";
import { NextRequest } from "next/server";

export function withAuth(
  handler: (req: NextRequest, ctx: { userId: string }) => Promise<Response>,
): (req: NextRequest) => Promise<Response> {
  return async (req: NextRequest) => {
    const userId = await getSessionUserId(req);
    if (!userId) return unauthorized();
    return handler(req, { userId });
  };
}

export function withAuthDynamic<P extends Record<string, string>>(
  handler: (req: NextRequest, ctx: { userId: string; params: Promise<P> }) => Promise<Response>,
): (req: NextRequest, routeCtx: { params: Promise<P> }) => Promise<Response> {
  return async (req: NextRequest, routeCtx: { params: Promise<P> }) => {
    const userId = await getSessionUserId(req);
    if (!userId) return unauthorized();
    return handler(req, { userId, params: routeCtx.params });
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test src/lib/withAuth.test.ts
```

Expected: PASS — 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/withAuth.ts src/lib/withAuth.test.ts
git commit -m "feat(auth): add withAuth and withAuthDynamic route wrappers"
```

---

### Task 2: Migrate static routes to `withAuth`

**Files:**
- Modify: `src/app/api/chat/route.ts`
- Modify: `src/app/api/conversation/route.ts`
- Modify: `src/app/api/inventory/route.ts`
- Modify: `src/app/api/inventory/parse/route.ts`
- Modify: `src/app/api/inventory/seed/route.ts`
- Modify: `src/app/api/market-tip/route.ts`
- Modify: `src/app/api/message/route.ts`
- Modify: `src/app/api/recipe/route.ts`
- Modify: `src/app/api/recipe/extract/route.ts`
- Modify: `src/app/api/shopping-list/route.ts`
- Modify: `src/app/api/shopping-list/classify/route.ts`
- Modify: `src/app/api/storage-tip/route.ts`

**Interfaces:**
- Consumes: `withAuth` from `@/lib/withAuth` (Task 1)

- [ ] **Step 1: Run existing route tests to establish baseline**

```bash
pnpm test src/app/api
```

Expected: all pass. Note the count — it should be the same after migration.

- [ ] **Step 2: Migrate `src/app/api/chat/route.ts`**

Replace the file content with:

```ts
import { captureMentionedInventory } from "@/lib/chat/captureInventory";
import { loadConversationContext } from "@/lib/chat/context";
import { chatErrorResponse } from "@/lib/chat/errors";
import { latestUserText } from "@/lib/chat/messageText";
import { buildChatTools } from "@/lib/chat/tools";
import { withAuth } from "@/lib/withAuth";
import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  UIMessage,
} from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CHAT_SYSTEM_PROMPT } from "./constants";

const UIMessageSchema = z
  .object({ id: z.string(), role: z.string(), parts: z.array(z.unknown()) })
  .passthrough();

const PostSchema = z.object({
  conversationId: z.string().min(1).max(100),
  messages: z.array(UIMessageSchema).max(100),
});

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const body = PostSchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const { conversationId, messages: rawMessages } = body.data;
    const messages = rawMessages as unknown as UIMessage[];

    // Deterministically capture any pantry items the user mentions BEFORE the
    // chat model runs, so a subsequent getInventory call reflects them. Gated
    // by a keyword heuristic; the model's addInventoryItem tool is the fallback
    // for phrasings the gate misses. Failures here are swallowed (non-fatal).
    const captured = await captureMentionedInventory(latestUserText(messages), userId);

    const validatedMessages = await loadConversationContext(
      conversationId,
      messages,
      userId
    );

    const stream = createUIMessageStream({
      execute: ({ writer }) => {
        // Tell the client what we captured server-side so it can toast and
        // refresh the pantry — the model never fired a tool for these, so the
        // client's tool-call handler would otherwise miss them.
        if (captured.length > 0) {
          writer.write({
            type: "data-capturedInventory",
            data: { items: captured.map((item) => item.name) },
          });
        }

        // Tell the model what we already captured this turn so it doesn't
        // redundantly call addInventoryItem for the same items (the client
        // also dedupes, but this avoids a wasted tool step + upsert).
        const captureNote =
          captured.length > 0
            ? `\n\n# Already added this turn\nThese items are ALREADY in the pantry (just added for you): ${captured
                .map((item) => item.name)
                .join(", ")}. Do NOT call addInventoryItem for them again — acknowledge naturally and continue.`
            : "";

        const result = streamText({
          model: openai("gpt-5-mini"),
          messages: convertToModelMessages(validatedMessages),
          system: CHAT_SYSTEM_PROMPT + captureNote,
          stopWhen: [stepCountIs(5)],
          tools: buildChatTools(userId),
        });

        writer.merge(result.toUIMessageStream());
      },
    });

    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    return chatErrorResponse(error);
  }
});
```

- [ ] **Step 3: Migrate `src/app/api/conversation/route.ts`**

```ts
import {
  getOrCreateEmptyConversation,
  listConversations,
} from "@/lib/conversations";
import { withAuth } from "@/lib/withAuth";
import { NextResponse } from "next/server";

export const GET = withAuth(async (_req, { userId }) => {
  const conversations = await listConversations(userId);
  return NextResponse.json({ conversations });
});

export const POST = withAuth(async (_req, { userId }) => {
  const conversation = await getOrCreateEmptyConversation(userId);
  return NextResponse.json({ conversation });
});
```

- [ ] **Step 4: Migrate `src/app/api/inventory/route.ts`**

```ts
import {
  addInventoryItem,
  getInventory,
  removeInventoryItem,
} from "@/lib/inventory/Inventory";
import { withAuth } from "@/lib/withAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAuth(async (_req, { userId }) => {
  try {
    const inventory = await getInventory(userId);
    return NextResponse.json(inventory, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Failed to fetch inventory", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const { items } = await req.json();
    await addInventoryItem(items, userId);
    return NextResponse.json({ success: true, message: "Inventory updated" });
  } catch (error) {
    console.error("Failed to update inventory", error);
    return NextResponse.json(
      { error: "Failed to update inventory" },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const { itemNames } = await req.json();
    await removeInventoryItem(itemNames, userId);
    return NextResponse.json({ success: true, message: "Inventory updated" });
  } catch (error) {
    console.error("Failed to update inventory", error);
    return NextResponse.json(
      { error: "Failed to update inventory" },
      { status: 500 }
    );
  }
});
```

- [ ] **Step 5: Migrate `src/app/api/inventory/parse/route.ts`**

```ts
import { addInventoryItem } from "@/lib/inventory/Inventory";
import { AddInventoryItemSchema } from "@/lib/inventory/schemas";
import { PROMPT_FRAGMENTS } from "@/lib/prompts/fragments";
import { withAuth } from "@/lib/withAuth";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ParseSchema = z.object({
  items: z.array(AddInventoryItemSchema),
});

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const { object } = await generateObject({
      model: openai("gpt-5-mini"),
      schema: ParseSchema,
      temperature: 0.1,
      prompt: `Parse the following freeform inventory entry into structured items. The user is dumping what they just bought or what they have on hand.

RULES:
- Each item gets: name, type ("ingredient" | "kitchenware"), and OPTIONAL quantity + unit.
- ONLY set quantity/unit when the user explicitly states an amount (e.g., "200g chicken" → quantity=200, unit="g"; "2 chicken breasts" → quantity=2, unit="pieces"). If they say "some bok choy" or just "eggs", LEAVE quantity AND unit UNSET — unset means "they have it, amount unlimited".
- type rules: kitchenware = pots, pans, utensils, appliances. Everything edible = ingredient.
- category rules (REQUIRED for type=ingredient, OMIT for type=kitchenware):
${PROMPT_FRAGMENTS.categoryRules}
- Normalize names to singular, title case where natural ("chicken breasts" → "Chicken breast", "bok choy" → "Bok choy").
- unit MUST come from this allowlist if used: g, kg, oz, lb, ml, l, cup, tbsp, tsp, piece, pieces, clove, cloves, bottle, bottles, can, cans, pack, packs, bunch, bunches, pinch, dash, slice, slices.

USER ENTRY:
${text}`,
    });

    await addInventoryItem(object.items, userId);
    return NextResponse.json({
      success: true,
      items: object.items,
      message: `Added ${object.items.length} item(s)`,
    });
  } catch (error) {
    console.error("Failed to parse inventory entry", error);
    return NextResponse.json(
      { error: "Failed to parse inventory entry" },
      { status: 500 },
    );
  }
});
```

- [ ] **Step 6: Migrate `src/app/api/inventory/seed/route.ts`**

```ts
import { seedDefaultInventory } from "@/lib/inventory/Inventory";
import { withAuth } from "@/lib/withAuth";
import { NextResponse } from "next/server";

export const POST = withAuth(async (_req, { userId }) => {
  try {
    await seedDefaultInventory(userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to seed inventory", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
});
```

- [ ] **Step 7: Migrate `src/app/api/market-tip/route.ts`**

```ts
import { prisma } from "@/lib/db";
import { canonicalTipKey } from "@/lib/marketTips/canonicalKey";
import { isPickableCategory } from "@/lib/marketTips/pickable";
import { KITCHEN_DOMAIN_RULE } from "@/lib/marketTips/relevance";
import { PROMPT_FRAGMENTS } from "@/lib/prompts/fragments";
import { withAuth } from "@/lib/withAuth";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

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

const TipGenSchema = z.object({
  tips: z.array(z.object({ key: z.string(), tip: z.string() })),
});

// Model-calling endpoint — gated on a verified session so anonymous callers
// can't loop it and burn token budget. Anonymous visitors still carry a
// session cookie, so the app's own calls are unaffected.
export const POST = withAuth(async (req: NextRequest, { userId: _userId }) => {
  try {
    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = RequestSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid items payload" }, { status: 400 });
    }

    const wanted = new Map<string, { name: string; pickable: boolean }>();
    for (const item of parsed.data.items) {
      const key = canonicalTipKey(item.name);
      if (!key || wanted.has(key)) continue;
      wanted.set(key, {
        name: item.name.trim(),
        pickable: isPickableCategory(item.category),
      });
    }

    const keys = [...wanted.keys()];
    const cached = await prisma.marketTip.findMany({ where: { key: { in: keys } } });
    const result: Record<string, string> = Object.create(null);
    for (const row of cached) result[row.key] = row.tip;

    const misses = keys.filter(
      (k) => !Object.prototype.hasOwnProperty.call(result, k),
    );
    const toGenerate = misses.filter((k) => wanted.get(k)!.pickable);
    const staples = misses.filter((k) => !wanted.get(k)!.pickable);

    for (const k of staples) {
      result[k] = "";
      await prisma.marketTip
        .create({ data: { key: k, tip: "" } })
        .catch((e) => console.warn("market-tip cache write failed", k, e));
    }

    if (toGenerate.length > 0) {
      const list = toGenerate.map((k) => `- ${k}`).join("\n");
      const { object } = await generateObject({
        model: openai("gpt-5-mini"),
        schema: TipGenSchema,
        temperature: 0.4,
        prompt: `You are Ah Mah, a warm Singaporean grandmother at the wet market. For each item, give ONE short tip on how to PICK a good fresh one at the shop — what to look for, feel for, or smell.

${PROMPT_FRAGMENTS.comprehensibleVoice}

RULES:
- Return exactly one entry per item, using the EXACT given item text as "key".
- "tip": max 12 words, plain imperative. NO "to pick a good X" preamble. e.g. "firm, deep red, no soft spots".
- If quality does NOT meaningfully vary at the shop (dry goods, canned, bottled, salt, sugar, flour), return tip as an empty string "".
- ${KITCHEN_DOMAIN_RULE}
- Warm and practical, but keep it SHORT.

ITEMS:
${list}`,
      });

      const generated = new Map(
        object.tips.map((t) => [canonicalTipKey(t.key), t.tip.trim()]),
      );
      for (const k of toGenerate) {
        if (generated.has(k)) {
          const tip = generated.get(k)!;
          result[k] = tip;
          await prisma.marketTip
            .create({ data: { key: k, tip } })
            .catch((e) => console.warn("market-tip cache write failed", k, e));
        } else {
          result[k] = "";
        }
      }
    }

    return NextResponse.json({ tips: result });
  } catch (error) {
    console.error("Failed to fetch market tips", error);
    return NextResponse.json(
      { error: "Failed to fetch market tips" },
      { status: 500 },
    );
  }
});
```

- [ ] **Step 8: Migrate `src/app/api/message/route.ts`**

```ts
import { maybeAutoTitleConversation } from "@/lib/conversations";
import { createMessage, getMessages } from "@/lib/messages";
import { withAuth } from "@/lib/withAuth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const PostSchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().min(1),
  role: z.enum(["user", "assistant"]),
});

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const conversationId = req.nextUrl.searchParams.get("conversationId");
  if (!conversationId) {
    return NextResponse.json(
      { error: "conversationId is required" },
      { status: 400 }
    );
  }
  const messages = await getMessages(conversationId, userId);
  return NextResponse.json(messages);
});

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = PostSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { conversationId, content, role } = parsed.data;

  try {
    const message = await createMessage(conversationId, userId, content, role);

    if (role === "assistant") {
      void maybeAutoTitleConversation(conversationId);
    }

    return NextResponse.json({ message });
  } catch (error) {
    if (error instanceof Error && error.message === "Conversation not found") {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }
    throw error;
  }
});
```

- [ ] **Step 9: Migrate `src/app/api/recipe/route.ts`**

```ts
import { deleteRecipeForUser, getRecipes, saveRecipe, saveRecipeFromBlock } from "@/lib/recipes";
import { processRecipe } from "@/lib/recipes/recipeProcessor";
import { normalizeTags } from "@/lib/recipes/normalizeTags";
import { fetchRecipePhoto } from "@/lib/pexels/fetchPhoto";
import { withAuth } from "@/lib/withAuth";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAuth(async (_req, { userId }) => {
  const recipes = await getRecipes(userId);
  return NextResponse.json(recipes);
});

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const body = await req.json();
  const { recipeId } = body;

  if (body.recipe) {
    const recipe = await saveRecipeFromBlock(body.recipe, userId, recipeId ?? undefined);
    return NextResponse.json(recipe);
  }

  const { name, instructions } = body;
  let metadata;
  try {
    metadata = await processRecipe(name, instructions);
  } catch (error) {
    console.error("processRecipe failed, saving without metadata:", error);
    metadata = { tags: [], baseServings: 2, ingredients: [], description: "", prep: [], notes: [] };
  }

  const tags = normalizeTags(metadata.tags ?? []);
  const photo = await fetchRecipePhoto(name, tags);
  const recipe = await saveRecipe(
    {
      userId,
      name,
      instructions,
      tags,
      recipeId,
      baseServings: metadata.baseServings,
      ingredients: metadata.ingredients,
      prep: metadata.prep,
      notes: metadata.notes,
      description: metadata.description,
      totalTimeMinutes: metadata.totalTimeMinutes,
    },
    photo,
  );

  return NextResponse.json(recipe);
});

export const DELETE = withAuth(async (req: NextRequest, { userId }) => {
  const { recipeId } = await req.json();
  if (!recipeId) return NextResponse.json({ error: "recipeId is required" }, { status: 400 });
  try {
    await deleteRecipeForUser(recipeId, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }
    throw error;
  }
});
```

- [ ] **Step 10: Migrate `src/app/api/recipe/extract/route.ts`**

```ts
import { parseRecipeText } from "@/lib/recipes/parseRecipeText";
import { withAuth } from "@/lib/withAuth";
import { NextRequest, NextResponse } from "next/server";

// Model-calling endpoint — gated on a verified session so anonymous callers
// can't loop it and burn token budget. Anonymous visitors still carry a
// session cookie, so the app's own calls are unaffected.
export const POST = withAuth(async (req: NextRequest, { userId: _userId }) => {
  const body = await req.json();
  const { text } = body;

  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  try {
    const block = await parseRecipeText(text.trim());

    if (!block.ingredients.length || !block.steps.length) {
      return NextResponse.json(
        { error: "Hmm, couldn't find a recipe in that text. Try cleaning it up?" },
        { status: 422 },
      );
    }

    return NextResponse.json(block);
  } catch {
    return NextResponse.json(
      { error: "Couldn't read that as a recipe. Try again?" },
      { status: 422 },
    );
  }
});
```

- [ ] **Step 11: Migrate `src/app/api/shopping-list/route.ts`**

```ts
import {
  addShoppingListItems,
  clearBoughtItems,
  getShoppingList,
  removeShoppingListItem,
  setBought,
} from "@/lib/shoppingList";
import { AddShoppingListItemsSchema } from "@/lib/shoppingList/schemas";
import { withAuth } from "@/lib/withAuth";
import { NextRequest, NextResponse } from "next/server";

async function readJson(req: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    return (await req.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export const GET = withAuth(async (_req, { userId }) => {
  try {
    const items = await getShoppingList(userId);
    return NextResponse.json(
      { items },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  } catch (error) {
    console.error("Failed to fetch shopping list", error);
    return NextResponse.json(
      { error: "Failed to fetch shopping list" },
      { status: 500 },
    );
  }
});

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const payload = await readJson(req);
    if (!payload) return badRequest("Invalid shopping list payload");

    const parsed = AddShoppingListItemsSchema.safeParse(payload);
    if (!parsed.success) return badRequest("Invalid shopping list payload");

    await addShoppingListItems(parsed.data.items, userId);
    return NextResponse.json({ success: true, message: "Shopping list updated" });
  } catch (error) {
    console.error("Failed to update shopping list", error);
    return NextResponse.json(
      { error: "Failed to update shopping list" },
      { status: 500 },
    );
  }
});

export const PATCH = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const payload = await readJson(req);
    if (!payload) return badRequest("Invalid shopping list payload");

    const { id, bought } = payload;
    if (typeof id !== "string" || typeof bought !== "boolean") {
      return badRequest("id (string) and bought (boolean) are required");
    }

    await setBought(userId, id, bought);
    return NextResponse.json({ success: true, message: "Shopping list updated" });
  } catch (error) {
    console.error("Failed to update shopping list", error);
    return NextResponse.json(
      { error: "Failed to update shopping list" },
      { status: 500 },
    );
  }
});

export const DELETE = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const payload = await readJson(req);
    if (!payload) return badRequest("Invalid shopping list payload");

    const { id, clearBought } = payload;

    if (typeof id === "string") {
      await removeShoppingListItem(userId, id);
    } else if (clearBought === true) {
      await clearBoughtItems(userId);
    } else {
      return badRequest("Provide an item id or clearBought: true");
    }

    return NextResponse.json({ success: true, message: "Shopping list updated" });
  } catch (error) {
    console.error("Failed to update shopping list", error);
    return NextResponse.json(
      { error: "Failed to update shopping list" },
      { status: 500 },
    );
  }
});
```

- [ ] **Step 12: Migrate `src/app/api/shopping-list/classify/route.ts`**

```ts
import { classifyPendingAisles } from "@/lib/shoppingList";
import { withAuth } from "@/lib/withAuth";
import { NextResponse } from "next/server";

export const POST = withAuth(async (_req, { userId }) => {
  try {
    await classifyPendingAisles(userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to classify shopping list aisles", error);
    return NextResponse.json(
      { error: "Failed to classify shopping list aisles" },
      { status: 500 },
    );
  }
});
```

- [ ] **Step 13: Migrate `src/app/api/storage-tip/route.ts`**

```ts
import { prisma } from "@/lib/db";
import { canonicalTipKey } from "@/lib/marketTips/canonicalKey";
import { KITCHEN_DOMAIN_RULE } from "@/lib/marketTips/relevance";
import { PROMPT_FRAGMENTS } from "@/lib/prompts/fragments";
import { withAuth } from "@/lib/withAuth";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const RequestSchema = z.object({
  items: z
    .array(
      z.object({
        name: z.string().min(1),
        type: z.string().nullish(),
      }),
    )
    .min(1)
    .max(200),
});

const TipGenSchema = z.object({
  tips: z.array(z.object({ key: z.string(), tip: z.string() })),
});

// Model-calling endpoint — gated on a verified session so anonymous callers
// can't loop it and burn token budget. Anonymous visitors still carry a
// session cookie, so the app's own calls are unaffected.
export const POST = withAuth(async (req: NextRequest, { userId: _userId }) => {
  try {
    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = RequestSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid items payload" },
        { status: 400 },
      );
    }

    const wanted = new Map<string, { name: string; type: string }>();
    for (const item of parsed.data.items) {
      const key = canonicalTipKey(item.name);
      if (!key || wanted.has(key)) continue;
      wanted.set(key, {
        name: item.name.trim(),
        type: item.type === "kitchenware" ? "kitchenware" : "ingredient",
      });
    }

    const keys = [...wanted.keys()];
    const cached = await prisma.storageTip.findMany({
      where: { key: { in: keys } },
    });
    const result: Record<string, string> = Object.create(null);
    for (const row of cached) result[row.key] = row.tip;

    const misses = keys.filter(
      (k) => !Object.prototype.hasOwnProperty.call(result, k),
    );

    if (misses.length > 0) {
      const list = misses
        .map((k) => `${k} = ${wanted.get(k)!.type}`)
        .join("\n");
      const { object } = await generateObject({
        model: openai("gpt-5-mini"),
        schema: TipGenSchema,
        temperature: 0.4,
        prompt: `You are Ah Mah, a warm Singaporean grandmother. For each kitchen item, give ONE short tip on how to KEEP it well at home — for food, how to store it so it lasts (where, how, what to avoid); for equipment, how to care for it so it lasts.

${PROMPT_FRAGMENTS.comprehensibleVoice}

Each item below is written as "name = kind".

RULES:
- Return exactly one entry per item. Set "key" to the NAME only — the text to the LEFT of " = " — copied EXACTLY. Never include the kind in the key.
- Use the kind (right of " = "): "ingredient" means food, "kitchenware" means equipment — advise accordingly.
- "tip": max 12 words, plain imperative. NO "to store X" preamble. e.g. "cool, dark place — never the fridge".
- ${KITCHEN_DOMAIN_RULE}
- If there is no meaningful way to keep it better (it just sits in the cupboard), return tip as an empty string "".
- Warm and practical, but keep it SHORT.

ITEMS:
${list}`,
      });

      const generated = new Map(
        object.tips.map((t) => [canonicalTipKey(t.key), t.tip.trim()]),
      );
      for (const k of misses) {
        if (generated.has(k)) {
          const tip = generated.get(k)!;
          result[k] = tip;
          await prisma.storageTip
            .create({ data: { key: k, tip } })
            .catch((e) => console.warn("storage-tip cache write failed", k, e));
        } else {
          result[k] = "";
        }
      }
    }

    return NextResponse.json({ tips: result });
  } catch (error) {
    console.error("Failed to fetch storage tips", error);
    return NextResponse.json(
      { error: "Failed to fetch storage tips" },
      { status: 500 },
    );
  }
});
```

- [ ] **Step 14: Run all route tests to confirm no regressions**

```bash
pnpm test src/app/api
```

Expected: same count as baseline, all pass.

- [ ] **Step 15: Commit**

```bash
git add src/app/api/chat/route.ts \
  src/app/api/conversation/route.ts \
  src/app/api/inventory/route.ts \
  src/app/api/inventory/parse/route.ts \
  src/app/api/inventory/seed/route.ts \
  src/app/api/market-tip/route.ts \
  src/app/api/message/route.ts \
  src/app/api/recipe/route.ts \
  src/app/api/recipe/extract/route.ts \
  src/app/api/shopping-list/route.ts \
  src/app/api/shopping-list/classify/route.ts \
  src/app/api/storage-tip/route.ts
git commit -m "refactor(auth): migrate static routes to withAuth wrapper"
```

---

### Task 3: Migrate dynamic routes to `withAuthDynamic`

**Files:**
- Modify: `src/app/api/conversation/[id]/route.ts`
- Modify: `src/app/api/recipe/[id]/route.ts`
- Modify: `src/app/api/recipe/[id]/share/route.ts`
- Modify: `src/app/api/recipe/[id]/tweak/route.ts`

**Interfaces:**
- Consumes: `withAuthDynamic` from `@/lib/withAuth` (Task 1)

- [ ] **Step 1: Migrate `src/app/api/conversation/[id]/route.ts`**

```ts
import {
  autoTitleIfNull,
  deleteConversation,
  renameConversation,
} from "@/lib/conversations";
import { withAuthDynamic } from "@/lib/withAuth";
import { NextRequest, NextResponse } from "next/server";

export const PATCH = withAuthDynamic<{ id: string }>(async (req: NextRequest, { userId, params }) => {
  const { id } = await params;
  const { title, autoTitle } = await req.json();

  if (typeof title === "string") {
    try {
      if (autoTitle) {
        const conversation = await autoTitleIfNull(id, title, userId);
        if (!conversation) {
          return new NextResponse(null, { status: 204 });
        }
        return NextResponse.json({ conversation });
      }
      const conversation = await renameConversation(id, title, userId);
      return NextResponse.json({ conversation });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Conversation not found"
      ) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }
      throw error;
    }
  }

  return NextResponse.json(
    { error: "title is required" },
    { status: 400 }
  );
});

export const DELETE = withAuthDynamic<{ id: string }>(async (_req, { userId, params }) => {
  const { id } = await params;

  try {
    await deleteConversation(id, userId);
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof Error && error.message === "Conversation not found") {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    throw error;
  }
});
```

- [ ] **Step 2: Migrate `src/app/api/recipe/[id]/route.ts`**

```ts
import { updateRecipeForUser } from "@/lib/recipes";
import { RecipeBlockSchema } from "@/lib/recipes/schemas";
import { withAuthDynamic } from "@/lib/withAuth";
import { NextRequest, NextResponse } from "next/server";

export const PATCH = withAuthDynamic<{ id: string }>(async (req: NextRequest, { userId, params }) => {
  const { id } = await params;

  try {
    const body = await req.json();
    const { recipe } = body;

    const parsed = RecipeBlockSchema.safeParse(recipe);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid recipe payload" }, { status: 400 });
    }

    const updated = await updateRecipeForUser(id, userId, parsed.data);
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }
    if (err instanceof Error && err.message === "not found") {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
```

- [ ] **Step 3: Migrate `src/app/api/recipe/[id]/share/route.ts`**

```ts
import { mintShareToken } from "@/lib/recipes";
import { withAuthDynamic } from "@/lib/withAuth";
import { NextResponse } from "next/server";

export const POST = withAuthDynamic<{ id: string }>(async (_req, { userId, params }) => {
  const { id } = await params;

  try {
    const token = await mintShareToken(id, userId);
    return NextResponse.json({ token });
  } catch (err) {
    if (err instanceof Error && err.message === "not found") {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
```

- [ ] **Step 4: Migrate `src/app/api/recipe/[id]/tweak/route.ts`**

Replace the file, keeping all the helpers and prompt functions unchanged, only updating the export:

```ts
import { ChangeKindSchema, RecipeBlockSchema } from "@/lib/recipes/schemas";
import { withAuthDynamic } from "@/lib/withAuth";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const RecipeBlockWithIdSchema = RecipeBlockSchema.extend({ id: z.string() });
type RecipeBlockWithId = z.infer<typeof RecipeBlockWithIdSchema>;

const MAX_INSTRUCTION_LENGTH = 500;
const MAX_OUTPUT_TOKENS = 8000;
const CHANGE_KINDS = ChangeKindSchema.options.join(", ");

function buildSystemPrompt(originalRecipe: RecipeBlockWithId, workingDraft: RecipeBlockWithId): string {
  return `You are a recipe editor. Apply the user's instruction to the working draft, then return a JSON **patch** describing only what changed.

## Original recipe (the saved cookbook version — change list anchors against this)
\`\`\`json
${JSON.stringify(originalRecipe, null, 2)}
\`\`\`

## Working draft (apply the instruction to this)
\`\`\`json
${JSON.stringify(workingDraft, null, 2)}
\`\`\`

## Instructions
- Apply the user's instruction as a precise, minimal change to the working draft.
- Return ONLY the fields that changed — do NOT echo unchanged fields. Output size should reflect how much changed, not the size of the recipe.
- Arrays (\`ingredients\`, \`steps\`, \`prep\`, \`tags\`) are all-or-nothing: if ANY element of an array changed, return the ENTIRE updated array (every element, in order). If an array is unchanged, OMIT the key.
- When an ingredient is added, removed, or renamed, check \`steps\` and \`prep\` for literal mentions of the old ingredient name and update that wording too — an ingredient swap is not "done" until every step that names it agrees. If any step or prep text changes as a result, include that whole array in the patch per the rule above.
- To clear an array entirely (e.g. drop all tags), return it as \`[]\`. Omitting a key means "leave unchanged"; \`[]\` means "make empty" — they are different.
- Scalar fields (\`title\`, \`description\`, \`baseServings\`, \`totalTimeMinutes\`): include only if changed.
- Update the \`description\` ("Ah Mah's note") if the dish character meaningfully changes (e.g. protein swap, cuisine shift). Include a \`description_updated\` change entry when you do.
- If the request would produce a wholly different dish unrelated to the current recipe, politely refuse in plain text (not JSON) and explain why.

## Response format
Return ONLY a valid JSON object — no markdown fences, no surrounding text. Include only the recipe fields that changed; \`changes\` is always required:
\`\`\`
{
  // any subset of: title, description, baseServings, totalTimeMinutes, ingredients, steps, prep, tags
  "ingredients": [ /* the WHOLE array, only if it changed */ ],
  "changes": [
    {
      "kind": "<one of: ${CHANGE_KINDS}>",
      "ref": { "type": "ingredient|step", "index": 0, "basis": "original|workingDraft" },
      "label": "<narrative label>"
    }
  ]
}
\`\`\`

The \`changes\` array must list **every structural delta against the original recipe** (not against the working draft). Each entry needs:
- \`kind\`: the type of change
- \`ref\`: omit for recipe-level changes (title, description, tags, servings, time) and for \`prep_updated\`. Use it only for ingredient/step row changes, as a structural locator with:
  - \`type\`: "ingredient" or "step"
  - \`index\`: a 0-based row index
  - \`basis\`: "workingDraft" for rows visible in the returned recipe (\`ingredient_added\`, \`ingredient_changed\`, \`step_added\`, \`step_replaced\`); "original" for removed rows (\`ingredient_removed\`, \`step_removed\`)
- \`label\`: a short narrative label in Ah Mah's voice (e.g. "Added cornstarch to velvet the chicken")`;
}

export const POST = withAuthDynamic<{ id: string }>(async (req: NextRequest, { userId: _userId, params }) => {
  const { id } = await params;

  try {
    const body: {
      instruction?: string;
      originalRecipe?: unknown;
      workingDraft?: unknown;
    } = await req.json();

    const { originalRecipe: originalRecipeRaw, workingDraft: workingDraftRaw } = body;
    let { instruction } = body;

    if (!instruction) {
      return NextResponse.json({ error: "instruction is required" }, { status: 400 });
    }

    instruction = instruction.trim().slice(0, MAX_INSTRUCTION_LENGTH);
    if (!instruction) {
      return NextResponse.json({ error: "instruction is required" }, { status: 400 });
    }

    if (!originalRecipeRaw) {
      return NextResponse.json({ error: "originalRecipe is required" }, { status: 400 });
    }

    const parsedOriginal = RecipeBlockWithIdSchema.safeParse(originalRecipeRaw);
    if (!parsedOriginal.success) {
      return NextResponse.json(
        { error: "Invalid originalRecipe payload", details: parsedOriginal.error.flatten() },
        { status: 400 }
      );
    }

    if (parsedOriginal.data.id !== id) {
      return NextResponse.json({ error: "recipe id mismatch" }, { status: 400 });
    }

    let workingDraft = parsedOriginal.data;
    if (workingDraftRaw !== undefined) {
      const parsedDraft = RecipeBlockWithIdSchema.safeParse(workingDraftRaw);
      if (!parsedDraft.success) {
        return NextResponse.json(
          { error: "Invalid workingDraft payload", details: parsedDraft.error.flatten() },
          { status: 400 }
        );
      }
      if (parsedDraft.data.id !== id) {
        return NextResponse.json({ error: "workingDraft id mismatch" }, { status: 400 });
      }
      workingDraft = parsedDraft.data;
    }

    const { text, finishReason } = await generateText({
      model: openai("gpt-5-mini"),
      system: buildSystemPrompt(parsedOriginal.data, workingDraft),
      messages: [{ role: "user", content: instruction }],
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    });

    if (finishReason === "length") {
      return NextResponse.json(
        { error: "Tweak response was too long to complete." },
        { status: 422 }
      );
    }

    return new NextResponse(text, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("[/api/recipe/[id]/tweak]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
```

- [ ] **Step 5: Run all route tests**

```bash
pnpm test src/app/api
```

Expected: all pass, same count as Task 2 baseline.

- [ ] **Step 6: Run full test suite**

```bash
pnpm test
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add "src/app/api/conversation/[id]/route.ts" \
  "src/app/api/recipe/[id]/route.ts" \
  "src/app/api/recipe/[id]/share/route.ts" \
  "src/app/api/recipe/[id]/tweak/route.ts"
git commit -m "refactor(auth): migrate dynamic routes to withAuthDynamic wrapper"
```

---

### Task 4: Update `docs/progress.md`

**Files:**
- Modify: `docs/progress.md`

- [ ] **Step 1: Add entry to `docs/progress.md`**

Under the "Infrastructure / Auth" section (or the nearest equivalent section), add:

```text
- Extracted repeated auth boilerplate into `withAuth` / `withAuthDynamic` wrappers (`src/lib/withAuth.ts`). All API routes now use the wrapper — one seam to audit, no per-route auth lines.
```

- [ ] **Step 2: Commit**

```bash
git add docs/progress.md
git commit -m "docs: update progress for withAuth wrapper (issue #364)"
```
