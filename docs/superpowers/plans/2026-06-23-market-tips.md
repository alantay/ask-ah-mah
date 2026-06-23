# Market Tips Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface Ah Mah's "how to pick a good one" market wisdom on a recipe's shopping list — inline per missing item and folded into the copied list.

**Architecture:** A new shared `MarketTip` table caches tips keyed by canonical item name (no `userId`). A thin `POST /api/market-tip` route resolves a batch of missing ingredients: cache hits return immediately; pickable misses are generated in one `generateObject` call (in Ah Mah's voice) and cached; non-pickable staples cache as an empty string (negative cache). The `RecipeLetter` shortfall card fetches tips via a `useMarketTips` SWR hook, reveals them inline on tap, and `copyShoppingList` appends them to the copied text.

**Tech Stack:** Next.js (App Router) API routes, Prisma + PostgreSQL, Vercel AI SDK (`ai` ^5, `@ai-sdk/openai` ^2, `generateObject`), SWR ^2, Zod, Jest + Testing Library (jsdom).

## Global Constraints

- Package manager is **pnpm** (never npm).
- Prisma client is imported via **`@/lib/db`** (`import { prisma } from "@/lib/db"`) — never `@prisma/client`.
- LLM calls use **`openai("gpt-5-mini")`** via `generateObject` from `ai`, matching `src/app/api/inventory/parse/route.ts`.
- The `MarketTip` table is **shared** — it has **no `userId` column**.
- Tip copy is **≤ 12 words**, plain imperative, no "to pick a good X" preamble (ADR-0013).
- Commit style: `type(scope): description` (`feat`, `fix`, `chore`, `docs`, `test`). End commit messages with the `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` trailer.
- Single-test runs: `npx jest <path>`. Full suite: `pnpm test`. Lint: `pnpm lint`.
- Spec references: `CONTEXT.md` ("Market Tip"), `docs/adr/0013-market-tips-are-llm-generated-and-shared.md`.

---

### Task 1: `MarketTip` Prisma model + DB sync

**Files:**
- Modify: `prisma/schema.prisma` (add model after the `InventoryItem` block, ~line 24)

**Interfaces:**
- Produces: Prisma model `MarketTip { key: string; tip: string; createdAt: Date }`, table `market_tips`. Used by Task 5 via `prisma.marketTip.findMany` / `.create`.

- [ ] **Step 1: Add the model to the schema**

Add this block to `prisma/schema.prisma` (place it directly after the closing `}` of `model InventoryItem`):

```prisma
// Shared corpus of "how to pick a good one" tips, keyed by canonical
// (lowercased, trimmed) item name. No userId — tips are universal.
// An empty `tip` is a negative-cache marker: "no meaningful picking tip".
model MarketTip {
  key       String   @id
  tip       String
  createdAt DateTime @default(now())

  @@map("market_tips")
}
```

- [ ] **Step 2: Validate the schema**

Run: `npx prisma validate`
Expected: `The schema at prisma/schema.prisma is valid 🚀`

- [ ] **Step 3: Generate the client + push the table**

Run: `pnpm db:local`
Expected: `prisma generate` regenerates `src/generated/prisma`, then `prisma db push` reports the `market_tips` table created (or "already in sync"). Requires `DATABASE_URL` to be set in the environment.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma src/generated/prisma
git commit -m "$(cat <<'EOF'
feat(db): add shared MarketTip table for picking tips

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: `canonicalTipKey` pure helper

**Files:**
- Create: `src/lib/marketTips/canonicalKey.ts`
- Test: `src/lib/marketTips/canonicalKey.test.ts`

**Interfaces:**
- Produces: `canonicalTipKey(name: string): string` — lowercases, trims, collapses internal whitespace. Used by Tasks 4, 5, 6, 7 to derive the cache key from an ingredient name.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/marketTips/canonicalKey.test.ts
import { canonicalTipKey } from "./canonicalKey";

describe("canonicalTipKey", () => {
  it("lowercases and trims", () => {
    expect(canonicalTipKey("  Tomato ")).toBe("tomato");
  });

  it("collapses internal whitespace", () => {
    expect(canonicalTipKey("Cherry   Tomatoes")).toBe("cherry tomatoes");
  });

  it("is stable for already-canonical input", () => {
    expect(canonicalTipKey("avocado")).toBe("avocado");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/lib/marketTips/canonicalKey.test.ts`
Expected: FAIL — `Cannot find module './canonicalKey'`

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/marketTips/canonicalKey.ts
/** Canonical cache key for a Market Tip: lowercased, trimmed, single-spaced. */
export function canonicalTipKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/lib/marketTips/canonicalKey.test.ts`
Expected: PASS (3 passing)

- [ ] **Step 5: Commit**

```bash
git add src/lib/marketTips/canonicalKey.ts src/lib/marketTips/canonicalKey.test.ts
git commit -m "$(cat <<'EOF'
feat(market-tips): add canonicalTipKey helper

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: `isPickableCategory` gate

**Files:**
- Create: `src/lib/marketTips/pickable.ts`
- Test: `src/lib/marketTips/pickable.test.ts`

**Interfaces:**
- Consumes: `Category` type from `@/lib/inventory/schemas` (values: `"Protein" | "Carbs" | "Vegetable" | "Condiments" | "Spice" | "Misc"`).
- Produces: `isPickableCategory(category?: string | null): boolean` — `false` for `Carbs`/`Condiments`/`Spice`; `true` for everything else (including `undefined`/`null`, so the model gets a chance to decide). Used by Tasks 5 and 6.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/marketTips/pickable.test.ts
import { isPickableCategory } from "./pickable";

describe("isPickableCategory", () => {
  it("treats fresh categories as pickable", () => {
    expect(isPickableCategory("Vegetable")).toBe(true);
    expect(isPickableCategory("Protein")).toBe(true);
    expect(isPickableCategory("Misc")).toBe(true);
  });

  it("treats dry-goods categories as not pickable", () => {
    expect(isPickableCategory("Carbs")).toBe(false);
    expect(isPickableCategory("Condiments")).toBe(false);
    expect(isPickableCategory("Spice")).toBe(false);
  });

  it("defaults unknown/empty category to pickable (model decides)", () => {
    expect(isPickableCategory(undefined)).toBe(true);
    expect(isPickableCategory(null)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/lib/marketTips/pickable.test.ts`
Expected: FAIL — `Cannot find module './pickable'`

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/marketTips/pickable.ts
// Categories whose quality does not vary meaningfully at the shop —
// no picking tip worth showing. Mirrors the taxonomy in CONTEXT.md.
const NON_PICKABLE: ReadonlySet<string> = new Set(["Carbs", "Condiments", "Spice"]);

/** True when an item is fresh enough that "how to pick it" is useful. */
export function isPickableCategory(category?: string | null): boolean {
  if (!category) return true; // unknown → let the model decide
  return !NON_PICKABLE.has(category);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/lib/marketTips/pickable.test.ts`
Expected: PASS (3 passing)

- [ ] **Step 5: Commit**

```bash
git add src/lib/marketTips/pickable.ts src/lib/marketTips/pickable.test.ts
git commit -m "$(cat <<'EOF'
feat(market-tips): add isPickableCategory gate

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: `formatShoppingList` — copied-list text with tips

**Files:**
- Create: `src/lib/marketTips/formatShoppingList.ts`
- Test: `src/lib/marketTips/formatShoppingList.test.ts`

**Interfaces:**
- Consumes: `canonicalTipKey` (Task 2).
- Produces:
  - `interface ShoppingListItem { name: string; amount?: string; unit?: string }`
  - `formatShoppingList(items: ShoppingListItem[], tips: Record<string, string>): string` — one line per item, `"<amount> <unit> <name>"` (amount/unit omitted when absent), with `" — <tip>"` appended when a non-empty tip exists for the item's canonical key. Used by Task 7 to replace the inline copy logic.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/marketTips/formatShoppingList.test.ts
import { formatShoppingList } from "./formatShoppingList";

describe("formatShoppingList", () => {
  it("appends a tip when present, keyed by canonical name", () => {
    const out = formatShoppingList(
      [{ name: "Tomato", amount: "2" }],
      { tomato: "firm, deep red, no bruises" },
    );
    expect(out).toBe("2 Tomato — firm, deep red, no bruises");
  });

  it("includes the unit when present", () => {
    const out = formatShoppingList(
      [{ name: "Prawns", amount: "300", unit: "g" }],
      { prawns: "shells tight, smell of the sea not ammonia" },
    );
    expect(out).toBe("300 g Prawns — shells tight, smell of the sea not ammonia");
  });

  it("omits the dash when there is no tip, and amount when absent", () => {
    const out = formatShoppingList(
      [{ name: "Tofu" }],
      {},
    );
    expect(out).toBe("Tofu");
  });

  it("treats an empty-string tip as no tip", () => {
    const out = formatShoppingList([{ name: "Flour" }], { flour: "" });
    expect(out).toBe("Flour");
  });

  it("joins multiple items with newlines", () => {
    const out = formatShoppingList(
      [{ name: "Tomato" }, { name: "Tofu" }],
      { tomato: "deep red" },
    );
    expect(out).toBe("Tomato — deep red\nTofu");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/lib/marketTips/formatShoppingList.test.ts`
Expected: FAIL — `Cannot find module './formatShoppingList'`

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/marketTips/formatShoppingList.ts
import { canonicalTipKey } from "./canonicalKey";

export interface ShoppingListItem {
  name: string;
  amount?: string;
  unit?: string;
}

/**
 * Build the plain-text shopping list that gets copied to the clipboard.
 * Each line is "<amount> <unit> <name>" (parts omitted when absent), with
 * Ah Mah's picking tip appended after " — " when one exists for the item.
 */
export function formatShoppingList(
  items: ShoppingListItem[],
  tips: Record<string, string>,
): string {
  return items
    .map((item) => {
      const lead = item.amount
        ? `${item.amount}${item.unit ? ` ${item.unit}` : ""} ${item.name}`
        : item.name;
      const tip = tips[canonicalTipKey(item.name)];
      return tip ? `${lead} — ${tip}` : lead;
    })
    .join("\n");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/lib/marketTips/formatShoppingList.test.ts`
Expected: PASS (5 passing)

- [ ] **Step 5: Commit**

```bash
git add src/lib/marketTips/formatShoppingList.ts src/lib/marketTips/formatShoppingList.test.ts
git commit -m "$(cat <<'EOF'
feat(market-tips): add formatShoppingList helper

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: `POST /api/market-tip` route (cache + gate + generate)

**Files:**
- Create: `src/app/api/market-tip/route.ts`
- Test: `src/app/api/market-tip/route.test.ts`

**Interfaces:**
- Consumes: `prisma` from `@/lib/db` (`marketTip.findMany`, `marketTip.create`); `canonicalTipKey` (Task 2); `isPickableCategory` (Task 3); `generateObject` from `ai`; `openai` from `@ai-sdk/openai`.
- Produces: `POST` handler. Request body `{ items: { name: string; category?: string | null }[] }`. Response `{ tips: Record<string, string> }` (canonical key → tip; `""` means "no tip"). Used by Task 6.

- [ ] **Step 1: Write the failing test**

```ts
// src/app/api/market-tip/route.test.ts
import { NextRequest } from "next/server";
import { POST } from "./route";
import { prisma } from "@/lib/db";
import { generateObject } from "ai";

jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
    })),
  },
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    marketTip: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock("ai", () => ({ generateObject: jest.fn() }));
jest.mock("@ai-sdk/openai", () => ({ openai: jest.fn(() => "model") }));

const mockedFindMany = jest.mocked(prisma.marketTip.findMany);
const mockedCreate = jest.mocked(prisma.marketTip.create);
const mockedGenerate = jest.mocked(generateObject);

const reqWith = (body: unknown) =>
  ({ json: async () => body } as unknown as NextRequest);

beforeEach(() => {
  jest.clearAllMocks();
  mockedCreate.mockResolvedValue({} as never);
});

describe("POST /api/market-tip", () => {
  it("returns cached tips without calling the model", async () => {
    mockedFindMany.mockResolvedValue([
      { key: "tomato", tip: "deep red, no bruises", createdAt: new Date() },
    ] as never);

    const res = await POST(reqWith({ items: [{ name: "Tomato", category: "Vegetable" }] }));
    const body = await res.json();

    expect(body.tips).toEqual({ tomato: "deep red, no bruises" });
    expect(mockedGenerate).not.toHaveBeenCalled();
  });

  it("generates and caches tips for pickable misses", async () => {
    mockedFindMany.mockResolvedValue([] as never);
    mockedGenerate.mockResolvedValue({
      object: { tips: [{ key: "avocado", tip: "dark, gives slightly = ripe today" }] },
    } as never);

    const res = await POST(reqWith({ items: [{ name: "Avocado", category: "Misc" }] }));
    const body = await res.json();

    expect(body.tips.avocado).toBe("dark, gives slightly = ripe today");
    expect(mockedGenerate).toHaveBeenCalledTimes(1);
    expect(mockedCreate).toHaveBeenCalledWith({
      data: { key: "avocado", tip: "dark, gives slightly = ripe today" },
    });
  });

  it("negative-caches non-pickable staples without a model call", async () => {
    mockedFindMany.mockResolvedValue([] as never);

    const res = await POST(reqWith({ items: [{ name: "Flour", category: "Carbs" }] }));
    const body = await res.json();

    expect(body.tips.flour).toBe("");
    expect(mockedGenerate).not.toHaveBeenCalled();
    expect(mockedCreate).toHaveBeenCalledWith({ data: { key: "flour", tip: "" } });
  });

  it("400s when items is missing", async () => {
    const res = await POST(reqWith({}));
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/app/api/market-tip/route.test.ts`
Expected: FAIL — `Cannot find module './route'`

- [ ] **Step 3: Write minimal implementation**

```ts
// src/app/api/market-tip/route.ts
import { prisma } from "@/lib/db";
import { canonicalTipKey } from "@/lib/marketTips/canonicalKey";
import { isPickableCategory } from "@/lib/marketTips/pickable";
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
    .min(1),
});

const TipGenSchema = z.object({
  tips: z.array(z.object({ key: z.string(), tip: z.string() })),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = RequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "items is required" }, { status: 400 });
    }

    // Canonicalize + dedupe; track a display name + pickability per key.
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
    const result: Record<string, string> = {};
    for (const row of cached) result[row.key] = row.tip;

    const misses = keys.filter((k) => !(k in result));
    const toGenerate = misses.filter((k) => wanted.get(k)!.pickable);
    const staples = misses.filter((k) => !wanted.get(k)!.pickable);

    // Negative-cache staples: no model call, never a tip.
    for (const k of staples) {
      result[k] = "";
      await prisma.marketTip.create({ data: { key: k, tip: "" } }).catch(() => {});
    }

    if (toGenerate.length > 0) {
      const list = toGenerate.map((k) => `- ${k}`).join("\n");
      const { object } = await generateObject({
        model: openai("gpt-5-mini"),
        schema: TipGenSchema,
        temperature: 0.4,
        prompt: `You are Ah Mah, a warm Singaporean grandmother at the wet market. For each item, give ONE short tip on how to PICK a good fresh one at the shop — what to look for, feel for, or smell.

RULES:
- Return exactly one entry per item, using the EXACT given item text as "key".
- "tip": max 12 words, plain imperative. NO "to pick a good X" preamble. e.g. "firm, deep red, no soft spots".
- If quality does NOT meaningfully vary at the shop (dry goods, canned, bottled, salt, sugar, flour), return tip as an empty string "".
- Warm and practical, but keep it SHORT.

ITEMS:
${list}`,
      });

      const generated = new Map(
        object.tips.map((t) => [canonicalTipKey(t.key), t.tip.trim()]),
      );
      for (const k of toGenerate) {
        const tip = generated.get(k) ?? "";
        result[k] = tip;
        await prisma.marketTip.create({ data: { key: k, tip } }).catch(() => {});
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
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/app/api/market-tip/route.test.ts`
Expected: PASS (4 passing)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/market-tip/route.ts src/app/api/market-tip/route.test.ts
git commit -m "$(cat <<'EOF'
feat(market-tips): add /api/market-tip cache-and-generate route

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: `useMarketTips` client hook

**Files:**
- Create: `src/features/Chat/components/recipe/useMarketTips.ts`

**Interfaces:**
- Consumes: `isPickableCategory` (Task 3); the `POST /api/market-tip` route (Task 5); `useSWR`.
- Produces: `useMarketTips(items: { name: string; category?: string | null }[]): Record<string, string>` — returns a canonical-key → tip map (empty until loaded). Used by Task 7.

- [ ] **Step 1: Write the hook**

```ts
// src/features/Chat/components/recipe/useMarketTips.ts
"use client";

import { isPickableCategory } from "@/lib/marketTips/pickable";
import useSWR from "swr";

interface TipItem {
  name: string;
  category?: string | null;
}

/**
 * Fetches Ah Mah's picking tips for a set of (missing) ingredients.
 * Only pickable items are requested; the SWR key is the sorted canonical
 * names, so identical lists dedupe and tips are cached for an hour.
 * Returns a canonical-key → tip map ("" means no tip).
 */
export function useMarketTips(items: TipItem[]): Record<string, string> {
  const pickable = items.filter((i) => isPickableCategory(i.category));
  const swrKey = pickable.length
    ? `market-tip:${pickable
        .map((i) => i.name.trim().toLowerCase())
        .sort()
        .join("|")}`
    : null;

  const { data } = useSWR<{ tips: Record<string, string> }>(
    swrKey,
    async () => {
      const res = await fetch("/api/market-tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: pickable }),
      });
      if (!res.ok) throw new Error("market-tip fetch failed");
      return res.json();
    },
    { revalidateOnFocus: false, dedupingInterval: 1000 * 60 * 60 },
  );

  return data?.tips ?? {};
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit 2>&1 | grep useMarketTips`
Expected: no output (no type errors in this file).

- [ ] **Step 3: Commit**

```bash
git add src/features/Chat/components/recipe/useMarketTips.ts
git commit -m "$(cat <<'EOF'
feat(market-tips): add useMarketTips client hook

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Wire tips into the `RecipeLetter` shortfall card

**Files:**
- Modify: `src/features/Chat/components/recipe/RecipeLetter.tsx`

**Interfaces:**
- Consumes: `useMarketTips` (Task 6); `canonicalTipKey` (Task 2); `formatShoppingList` (Task 4).
- Produces: no new exports — UI behavior only (inline tip reveal + enriched copied list).

- [ ] **Step 1: Add imports**

At the top of `RecipeLetter.tsx`, alongside the existing imports, add:

```ts
import { useMarketTips } from "./useMarketTips";
import { canonicalTipKey } from "@/lib/marketTips/canonicalKey";
import { formatShoppingList } from "@/lib/marketTips/formatShoppingList";
```

- [ ] **Step 2: Call the hook + add reveal state**

In `RecipeLetter`, immediately after the `missingIngredients` declaration (currently `RecipeLetter.tsx:148-150`), add — note this must sit above the `if (cooking)` early return so hook order stays stable:

```ts
  const tips = useMarketTips(
    missingIngredients.map((ing) => ({ name: ing.name, category: ing.category })),
  );
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
```

- [ ] **Step 3: Replace `copyShoppingList` with the tip-aware formatter**

Replace the existing `copyShoppingList` (currently `RecipeLetter.tsx:159-171`) with:

```ts
  const copyShoppingList = () => {
    const text = formatShoppingList(
      missingIngredients.map((ing) => ({
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
      })),
      tips,
    );
    navigator.clipboard.writeText(text).then(
      () => toast.success("Shopping list copied — go get them!"),
      () => toast.error("Aiyah, couldn't copy — select and copy by hand?"),
    );
  };
```

- [ ] **Step 4: Make the "Still need" names tappable + render the revealed tip**

Replace the "Still need" paragraph in the shortfall card (currently `RecipeLetter.tsx:275-280`) with:

```tsx
          <p className="font-display text-sm text-foreground mb-0.5 leading-snug">
            Still need:{" "}
            {missingIngredients.map((ing, i) => {
              const key = canonicalTipKey(ing.name);
              const tip = tips[key];
              const isLast = i === missingIngredients.length - 1;
              return (
                <span key={key}>
                  {tip ? (
                    <button
                      type="button"
                      onClick={() =>
                        setRevealedKey(revealedKey === key ? null : key)
                      }
                      aria-expanded={revealedKey === key}
                      className="font-semibold underline decoration-dotted underline-offset-2 hover:text-primary transition-colors cursor-pointer"
                    >
                      {ing.name}
                    </button>
                  ) : (
                    <span className="font-semibold">{ing.name}</span>
                  )}
                  {!isLast ? ", " : ""}
                </span>
              );
            })}
          </p>
          {revealedKey && tips[revealedKey] && (
            <p className="font-display italic text-xs text-muted-foreground mt-1.5 leading-snug">
              Ah Mah says: {tips[revealedKey]}
            </p>
          )}
```

- [ ] **Step 5: Verify type-check and lint**

Run: `npx tsc --noEmit 2>&1 | grep RecipeLetter` and `pnpm lint`
Expected: no `RecipeLetter` type errors; lint clean. (Pre-existing unrelated test-file type errors in other files may remain — confirm none are in `RecipeLetter.tsx`.)

- [ ] **Step 6: Manual verification**

Run: `pnpm dev`, then in the app:
1. Ensure the pantry holds ≥50% of a recipe's ingredients with at least one fresh item missing (e.g. tomato), so the shortfall card renders.
2. Confirm missing fresh items appear as dotted-underline buttons; tapping one reveals "Ah Mah says: …" below.
3. Confirm a missing staple (e.g. flour) renders as plain text with no tip.
4. Click "Copy shopping list", paste elsewhere, confirm tips are appended after " — " on tipped items.

- [ ] **Step 7: Commit**

```bash
git add src/features/Chat/components/recipe/RecipeLetter.tsx
git commit -m "$(cat <<'EOF'
feat(market-tips): reveal picking tips on the recipe shortfall card

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Update progress doc

**Files:**
- Modify: `docs/progress.md`

**Interfaces:** none.

- [ ] **Step 1: Add a Market Tips entry**

Add a short entry to `docs/progress.md` under the current-state section describing the shipped feature: Ah Mah's picking tips on the recipe shopping list, LLM-generated and cached in the shared `MarketTip` table, surfaced inline on the shortfall card and in the copied list. Reference `CONTEXT.md` ("Market Tip") and ADR-0013. Match the file's existing entry style.

- [ ] **Step 2: Commit**

```bash
git add docs/progress.md
git commit -m "$(cat <<'EOF'
docs(progress): record Market Tips feature

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review

**Spec coverage** (against `CONTEXT.md` "Market Tip" + ADR-0013):
- LLM-generated, shared cache, keyed by canonical name → Tasks 1, 2, 5. ✓
- No `userId` → Task 1 (model has no userId). ✓
- Only fresh/pickable items; staples return "none" → Tasks 3, 5 (gate + negative cache). ✓
- Surfaces on the recipe shopping list (Additions / shortfall card) → Task 7. ✓
- Inline tap-to-reveal → Task 7 Step 4. ✓
- Folded into copied list → Tasks 4, 7 Step 3. ✓
- Canonical key normalization → Task 2, used everywhere. ✓
- Deferred: standalone persisted shopping list → not in plan (correctly out of scope). ✓
- Flagged in ADR: "≥50% gate is narrow" → left as-is for this iteration; tips attach to the existing card only. Acceptable for v1; a follow-up could broaden the surface.

**Placeholder scan:** No TBD/TODO; every code step shows complete code. ✓

**Type consistency:** `canonicalTipKey(name: string): string`, `isPickableCategory(category?: string | null): boolean`, `formatShoppingList(items, tips)`, `useMarketTips(items): Record<string,string>`, route response `{ tips: Record<string,string> }` — names/shapes match across Tasks 2–7. The `tips` map is canonical-key → string throughout. ✓
