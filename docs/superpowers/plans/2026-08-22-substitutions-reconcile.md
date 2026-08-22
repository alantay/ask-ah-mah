# Substitutions Reconcile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "Ask Ah Mah for substitutions" composer-seeding nudge with a reconcile mode that turns the recipe's ingredient grid into checkboxes, corrects the pantry in both directions on submit, then sends the ask naming only what is genuinely missing.

**Architecture:** All decision logic lives in a new pure module `reconcile.ts` (no React, no network) so it can be unit-tested directly. `RecipeLetter` gains one boolean of local state and renders the existing "What to gather" grid in two modes. Submit awaits the pantry writes before it sends the chat message, because the chat turn calls `getInventory` and would otherwise race the corrections.

**Tech Stack:** Next.js App Router, React 19, TypeScript, SWR, Zod, Jest + Testing Library (jsdom), Tailwind, sonner (toasts).

**Spec:** `docs/superpowers/specs/2026-08-22-substitutions-reconcile-design.md` — read it before Task 1.

## Global Constraints

- Package manager is **`pnpm`**, never `npm`.
- Test command: `pnpm test`. Type check: `pnpm typecheck`. Lint: `pnpm lint`.
- Commit style: `type(scope): description` — `feat`, `fix`, `refactor`, `docs`, `test`, `chore`.
- Prisma client is imported **only** via `@/lib/db`, never `@prisma/client`. (No task here touches Prisma.)
- Same-feature imports are relative; cross-feature imports use `@/...`.
- Styling uses Tailwind utility classes and project tokens. Inline styles only for dynamic values.
- Long class stacks are consolidated into local constants inside the component (`RecipeLetter` already does this with `secondaryAction`).
- **Do not touch `src/features/Inventory/`.** Pantry's role is a deliberately open question.
- **Do not change `src/lib/recipes/matchIngredient.ts`.** Its over-permissive matching is filed as issue #491 and is worked around here, not fixed.
- **Do not add free-staples filtering.** Filed as issue #490.
- Item names sent to `/api/inventory` for deletion must be the **matched pantry item's** name, never the recipe's ingredient name.

---

### Task 1: Pure reconcile logic

**Files:**
- Create: `src/features/Chat/components/recipe/reconcile.ts`
- Test: `src/features/Chat/components/recipe/reconcile.test.ts`

**Interfaces:**
- Consumes: `ingredientMatches` from `@/lib/recipes/matchIngredient`; `InventoryItem`, `AddInventoryItem` from `@/lib/inventory/schemas`; `RecipeIngredientModel` from `@/lib/recipes/schemas`.
- Produces:
  - `matchingPantryItems(ingredientName: string, inventoryItems: InventoryItem[]): InventoryItem[]`
  - `type ReconcilePlan = { adds: AddInventoryItem[]; deletes: string[]; stillMissing: RecipeIngredientModel[] }`
  - `buildReconcilePlan(ingredients: RecipeIngredientModel[], inventoryItems: InventoryItem[], ticked: Set<string>): ReconcilePlan`

- [ ] **Step 1: Write the failing test**

Create `src/features/Chat/components/recipe/reconcile.test.ts`:

```ts
import { buildReconcilePlan, matchingPantryItems } from './reconcile';
import type { InventoryItem } from '@/lib/inventory/schemas';
import type { RecipeIngredientModel } from '@/lib/recipes/schemas';

const inv = (name: string, category?: InventoryItem['category']): InventoryItem => ({
  id: name,
  name,
  type: 'ingredient',
  category,
  dateAdded: new Date().toISOString(),
  lastUpdated: new Date().toISOString(),
});

const ing = (
  name: string,
  category?: RecipeIngredientModel['category'],
): RecipeIngredientModel => ({ name, category });

describe('matchingPantryItems', () => {
  it('returns every pantry item sharing a token with the ingredient', () => {
    const items = [inv('fish sauce'), inv('dark soy sauce'), inv('galangal')];
    expect(matchingPantryItems('soy sauce', items).map(i => i.name)).toEqual([
      'fish sauce',
      'dark soy sauce',
    ]);
  });

  it('returns an empty array when nothing matches', () => {
    expect(matchingPantryItems('candlenut', [inv('galangal')])).toEqual([]);
  });
});

describe('buildReconcilePlan', () => {
  it('adds a ticked ingredient that was not in the pantry', () => {
    const plan = buildReconcilePlan(
      [ing('galangal', 'Spice')],
      [],
      new Set(['galangal']),
    );
    expect(plan.adds).toEqual([
      { name: 'galangal', type: 'ingredient', category: 'Spice' },
    ]);
    expect(plan.deletes).toEqual([]);
    expect(plan.stillMissing).toEqual([]);
  });

  it('omits category from the add payload when the ingredient has none', () => {
    const plan = buildReconcilePlan([ing('galangal')], [], new Set(['galangal']));
    expect(plan.adds).toEqual([{ name: 'galangal', type: 'ingredient' }]);
  });

  it('deletes the MATCHED pantry name, not the ingredient name', () => {
    const plan = buildReconcilePlan(
      [ing('fresh galangal')],
      [inv('galangal')],
      new Set(),
    );
    expect(plan.deletes).toEqual(['galangal']);
  });

  it('skips the delete when two pantry items match', () => {
    const plan = buildReconcilePlan(
      [ing('dark soy sauce')],
      [inv('fish sauce'), inv('soy sauce')],
      new Set(),
    );
    expect(plan.deletes).toEqual([]);
  });

  it('still reports an ambiguous unticked ingredient as missing', () => {
    const plan = buildReconcilePlan(
      [ing('dark soy sauce')],
      [inv('fish sauce'), inv('soy sauce')],
      new Set(),
    );
    expect(plan.stillMissing.map(i => i.name)).toEqual(['dark soy sauce']);
  });

  it('reports every unticked ingredient as missing, pantry or not', () => {
    const plan = buildReconcilePlan(
      [ing('chicken thigh'), ing('galangal')],
      [inv('chicken thigh')],
      new Set(),
    );
    expect(plan.stillMissing.map(i => i.name)).toEqual([
      'chicken thigh',
      'galangal',
    ]);
  });

  it('writes nothing when the ticks agree with the pantry', () => {
    const plan = buildReconcilePlan(
      [ing('chicken thigh'), ing('galangal')],
      [inv('chicken thigh')],
      new Set(['chicken thigh']),
    );
    expect(plan.adds).toEqual([]);
    expect(plan.deletes).toEqual([]);
    expect(plan.stillMissing.map(i => i.name)).toEqual(['galangal']);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/features/Chat/components/recipe/reconcile.test.ts`
Expected: FAIL — `Cannot find module './reconcile'`.

- [ ] **Step 3: Write the implementation**

Create `src/features/Chat/components/recipe/reconcile.ts`:

```ts
import type { AddInventoryItem, InventoryItem } from '@/lib/inventory/schemas';
import { ingredientMatches } from '@/lib/recipes/matchIngredient';
import type { RecipeIngredientModel } from '@/lib/recipes/schemas';

// Every pantry item the loose token matcher considers the same thing as this
// ingredient. `ingredientMatches` matches on ANY shared token, so this can
// legitimately return several unrelated items ("dark soy sauce" hits both
// "fish sauce" and "soy sauce" via "sauce") — see issue #491.
export function matchingPantryItems(
  ingredientName: string,
  inventoryItems: InventoryItem[],
): InventoryItem[] {
  return inventoryItems.filter((item) =>
    ingredientMatches(ingredientName, [item.name]),
  );
}

export type ReconcilePlan = {
  adds: AddInventoryItem[];
  deletes: string[];
  stillMissing: RecipeIngredientModel[];
};

// Turns the user's ticks into the two pantry writes and the list that goes into
// the substitutions ask. A tick means "I have this"; `ticked` holds ingredient
// names, which are unique within a recipe.
//
// The two directions are deliberately asymmetric. An add uses the recipe's own
// name — a bad match there costs one spare pantry row. A delete removes the
// MATCHED pantry item, and only when exactly one item matched: under the loose
// matcher, deleting on an ambiguous match would remove the wrong ingredient.
// An ambiguous unticked item is simply absent for this dish, which is the
// transient confirmed-absence ADR-0026 §5 already sanctions.
export function buildReconcilePlan(
  ingredients: RecipeIngredientModel[],
  inventoryItems: InventoryItem[],
  ticked: Set<string>,
): ReconcilePlan {
  const adds: AddInventoryItem[] = [];
  const deletes: string[] = [];
  const stillMissing: RecipeIngredientModel[] = [];

  for (const ing of ingredients) {
    const matches = matchingPantryItems(ing.name, inventoryItems);
    const isTicked = ticked.has(ing.name);

    if (isTicked && matches.length === 0) {
      adds.push({
        name: ing.name,
        type: 'ingredient',
        ...(ing.category && { category: ing.category }),
      });
    }

    if (!isTicked) {
      if (matches.length === 1) deletes.push(matches[0].name);
      stillMissing.push(ing);
    }
  }

  return { adds, deletes, stillMissing };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test src/features/Chat/components/recipe/reconcile.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Type check and commit**

```bash
pnpm typecheck
git add src/features/Chat/components/recipe/reconcile.ts src/features/Chat/components/recipe/reconcile.test.ts
git commit -m "feat(recipe): pure reconcile plan for pantry corrections"
```

---

### Task 2: Reconcile mode on the ingredient grid

**Files:**
- Modify: `src/features/Chat/components/recipe/RecipeLetter.tsx`
- Modify: `src/features/Chat/components/MessageList.tsx:574` (swap `onDraft={onDraft}` for `onSend={onSend}` on the `RecipeLetter` element)
- Test: `src/features/Chat/components/recipe/RecipeLetter.test.tsx`

**Interfaces:**
- Consumes: `buildReconcilePlan` from Task 1 (only in Task 3 — this task needs `matchingPantryItems` for the row's pantry-name caption).
- Produces: `RecipeLetterProps.onSend?: (text: string) => void` replacing `onDraft`. Task 3 uses the `reconciling` state and the `ticked` state this task introduces.

**Note on scope:** this task renders the mode and rewires the prop. Submit does nothing yet beyond leaving reconcile mode — Task 3 makes it write and send. The app stays working throughout: `MessageList` already receives `onSend` and passes it to every other block.

- [ ] **Step 1: Write the failing tests**

In `src/features/Chat/components/recipe/RecipeLetter.test.tsx`, **replace** the whole `describe('Substitutions relocated to the action bar', ...)` block with:

```tsx
describe('Substitutions opens reconcile mode', () => {
  const mockOnSend = jest.fn();

  beforeEach(() => {
    mockOnSend.mockReset();
    mockUseSessionContext.mockReturnValue({ userId: 'user-123' });
    mockUseSWR.mockReturnValue({ data: INVENTORY_WITH_CHICKEN });
  });

  const openReconcile = () =>
    fireEvent.click(
      screen.getByRole('button', { name: /Ask Ah Mah for substitutions/ }),
    );

  it('offers the nudge when a pantry is tracked', () => {
    render(<RecipeLetter recipe={RECIPE} onSend={mockOnSend} />);
    expect(
      screen.getByRole('button', { name: /Ask Ah Mah for substitutions/ }),
    ).toBeInTheDocument();
  });

  it('still offers the nudge when the pantry says nothing is missing', () => {
    mockUseSWR.mockReturnValue({
      data: {
        ingredientInventory: [
          { id: '1', name: 'chicken thigh', type: 'ingredient' as const, category: 'Protein' as const, dateAdded: new Date().toISOString(), lastUpdated: new Date().toISOString() },
          { id: '2', name: 'bok choy', type: 'ingredient' as const, category: 'Vegetable' as const, dateAdded: new Date().toISOString(), lastUpdated: new Date().toISOString() },
        ],
        kitchenwareInventory: [],
      },
    });
    render(<RecipeLetter recipe={RECIPE} onSend={mockOnSend} />);
    expect(
      screen.getByRole('button', { name: /Ask Ah Mah for substitutions/ }),
    ).toBeInTheDocument();
  });

  it('hides the nudge when no pantry is tracked', () => {
    mockUseSWR.mockReturnValue({
      data: { ingredientInventory: [], kitchenwareInventory: [] },
    });
    render(<RecipeLetter recipe={RECIPE} onSend={mockOnSend} />);
    expect(
      screen.queryByRole('button', { name: /Ask Ah Mah for substitutions/ }),
    ).not.toBeInTheDocument();
  });

  it('sends nothing when the nudge is tapped', () => {
    render(<RecipeLetter recipe={RECIPE} onSend={mockOnSend} />);
    openReconcile();
    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('gives every ingredient a checkbox, pre-ticked from the pantry', () => {
    render(<RecipeLetter recipe={RECIPE} onSend={mockOnSend} />);
    openReconcile();
    expect(screen.getByRole('checkbox', { name: /chicken thigh/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /bok choy/ })).not.toBeChecked();
  });

  it('toggles a checkbox on click', () => {
    render(<RecipeLetter recipe={RECIPE} onSend={mockOnSend} />);
    openReconcile();
    const box = screen.getByRole('checkbox', { name: /bok choy/ });
    fireEvent.click(box);
    expect(box).toBeChecked();
  });

  it('labels submit with the count still unticked', () => {
    render(<RecipeLetter recipe={RECIPE} onSend={mockOnSend} />);
    openReconcile();
    expect(
      screen.getByRole('button', { name: /Ask about the 1 you're missing/ }),
    ).toBeInTheDocument();
  });

  it('offers to save instead of ask when nothing is left missing', () => {
    render(<RecipeLetter recipe={RECIPE} onSend={mockOnSend} />);
    openReconcile();
    fireEvent.click(screen.getByRole('checkbox', { name: /bok choy/ }));
    expect(
      screen.getByRole('button', { name: /Save what I have/ }),
    ).toBeInTheDocument();
  });

  it('hides the cart buttons while reconciling', () => {
    render(<RecipeLetter recipe={RECIPE} onSend={mockOnSend} />);
    openReconcile();
    expect(
      screen.queryByRole('button', { name: /Add bok choy to shopping list/ }),
    ).not.toBeInTheDocument();
  });

  it('discards ticks on exit without writing', () => {
    render(<RecipeLetter recipe={RECIPE} onSend={mockOnSend} />);
    openReconcile();
    fireEvent.click(screen.getByRole('checkbox', { name: /bok choy/ }));
    fireEvent.click(screen.getByRole('button', { name: /Done/ }));
    expect(screen.queryByRole('checkbox', { name: /bok choy/ })).not.toBeInTheDocument();
    openReconcile();
    expect(screen.getByRole('checkbox', { name: /bok choy/ })).not.toBeChecked();
  });

  it('names the matched pantry item when it differs from the ingredient', () => {
    mockUseSWR.mockReturnValue({
      data: {
        ingredientInventory: [
          { id: '1', name: 'boneless chicken', type: 'ingredient' as const, category: 'Protein' as const, dateAdded: new Date().toISOString(), lastUpdated: new Date().toISOString() },
        ],
        kitchenwareInventory: [],
      },
    });
    render(<RecipeLetter recipe={RECIPE} onSend={mockOnSend} />);
    openReconcile();
    expect(screen.getByText(/pantry: boneless chicken/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test src/features/Chat/components/recipe/RecipeLetter.test.tsx`
Expected: FAIL — `onSend` is not a prop, no checkboxes render.

- [ ] **Step 3: Implement reconcile mode in `RecipeLetter.tsx`**

3a. Swap the prop in `RecipeLetterProps` (replace the `onDraft` declaration and its comment):

```tsx
  // Opens reconcile mode, then sends the substitutions ask once the user has
  // corrected the pantry-derived have/missing state.
  onSend?: (text: string) => void;
```

3b. Change the destructure `onDraft,` to `onSend,`.

3c. Add imports and state near the other `useState` calls:

```tsx
import { matchingPantryItems } from './reconcile';
```

```tsx
  const [reconciling, setReconciling] = useState(false);
  const [ticked, setTicked] = useState<Set<string>>(new Set());
```

3d. Replace the `showSubstitutions` block. The `missingIngredients.length > 0`
condition goes: the over-reporting case ("pill says 10/10, bottle is empty") is
invisible without it.

```tsx
  // The nudge is an on-ramp to correcting the pantry record, so it shows
  // whenever a pantry is tracked — including at a full pantry count, where the
  // record may be over-reporting an item the user has finished.
  const showSubstitutions =
    !isStreaming && !!onSend && !!userId && inventoryItems.length > 0;
```

3e. Replace `askForSubstitutions` with the mode opener. Ticks seed from the
pantry each time the mode opens, so a stale set from a previous pass can never
be reused:

```tsx
  const openReconcile = () => {
    setTicked(
      new Set(
        ingredients
          .filter((ing) => ingredientHave(ing.name, inventoryNames))
          .map((ing) => ing.name),
      ),
    );
    setReconciling(true);
  };

  const exitReconcile = () => {
    setReconciling(false);
    setTicked(new Set());
  };

  const toggleTick = (name: string) =>
    setTicked((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const untickedCount = ingredients.filter((ing) => !ticked.has(ing.name)).length;
```

3f. Point the nudge's `onClick` at `openReconcile`.

3g. In the ingredients grid, add the checkbox column and the pantry-name
caption. Replace the row's `<span className="flex-1 font-display ...">` block
and the trailing cart button with:

```tsx
                  {reconciling && (
                    <input
                      type="checkbox"
                      aria-label={ing.name}
                      checked={ticked.has(ing.name)}
                      onChange={() => toggleTick(ing.name)}
                      className="shrink-0 size-4 accent-primary cursor-pointer"
                    />
                  )}
                  <span className="flex-1 font-display text-emphasis text-foreground">
                    {ing.name}
                    {ing.note && (
                      <span className="text-muted-foreground italic text-xs">
                        , {ing.note}
                      </span>
                    )}
                    {reconciling && pantryLabel && (
                      <span className="block font-sans text-eyebrow text-muted-foreground normal-case tracking-normal">
                        pantry: {pantryLabel}
                      </span>
                    )}
                  </span>
                  {!reconciling && !isStreaming && userId && inventoryItems.length > 0 && !have && (
                    <NeedCartButton
                      ingredientName={ing.name}
                      onAdd={() => addToShoppingList(ing)}
                      pending={inFlight.has(ing.name)}
                    />
                  )}
```

and compute `pantryLabel` alongside `have` inside the row's `map` callback:

```tsx
              const matches = matchingPantryItems(ing.name, inventoryItems);
              // Only worth showing when the record's wording differs from the
              // recipe's, and only when one item matched — an ambiguous match
              // is never deleted, so naming it would promise a write that
              // cannot happen.
              const pantryLabel =
                matches.length === 1 &&
                matches[0].name.toLowerCase() !== ing.name.toLowerCase()
                  ? matches[0].name
                  : null;
```

3h. Add the reconcile footer immediately after the grid's closing `</div>`,
inside the ingredients section. `submitReconcile` is a placeholder in this task
— Task 3 fills it in.

```tsx
          {reconciling && (
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={submitReconcile}
                className="flex-1 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-base px-4 py-3 cursor-pointer hover:opacity-90 transition-opacity"
              >
                {untickedCount === 0
                  ? 'Save what I have'
                  : `Ask about the ${untickedCount} you're missing`}
              </button>
              <button
                type="button"
                onClick={exitReconcile}
                className={cn(secondaryAction, 'text-muted-foreground border border-border bg-card')}
              >
                Done
              </button>
            </div>
          )}
```

3i. Add the placeholder submit above the return:

```tsx
  const submitReconcile = () => {
    exitReconcile();
  };
```

3j. In `MessageList.tsx:574`, change `onDraft={onDraft}` to `onSend={onSend}`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test src/features/Chat/components/recipe/RecipeLetter.test.tsx`
Expected: PASS. The `Recipe cart adds to the shopping list` and `Shortfall card retired` blocks must still pass untouched.

- [ ] **Step 5: Type check, lint, commit**

```bash
pnpm typecheck && pnpm lint
git add src/features/Chat/components/recipe/RecipeLetter.tsx src/features/Chat/components/recipe/RecipeLetter.test.tsx src/features/Chat/components/MessageList.tsx
git commit -m "feat(recipe): reconcile mode on the ingredient grid"
```

---

### Task 3: Submit — write the pantry, then send

**Files:**
- Modify: `src/features/Chat/components/recipe/RecipeLetter.tsx`
- Test: `src/features/Chat/components/recipe/RecipeLetter.test.tsx`

**Interfaces:**
- Consumes: `buildReconcilePlan` and `ReconcilePlan` from Task 1; `reconciling` / `ticked` state from Task 2; the existing `mutateResource` helper already imported in `RecipeLetter.tsx`.
- Produces: nothing further tasks depend on.

**Ordering requirement:** the pantry writes must be **awaited** before `onSend` fires. The chat turn calls `getInventory`; sending first lets the model read the pre-correction pantry. This mirrors `ChecklistBlock.onTicked`.

- [ ] **Step 1: Write the failing tests**

Append to `src/features/Chat/components/recipe/RecipeLetter.test.tsx`:

```tsx
describe('Reconcile submit writes the pantry then asks', () => {
  const mockOnSend = jest.fn();

  beforeEach(() => {
    mockOnSend.mockReset();
    mockUseSessionContext.mockReturnValue({ userId: 'user-123' });
    mockUseSWR.mockReturnValue({ data: INVENTORY_WITH_CHICKEN });
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) }),
    ) as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const openReconcile = () =>
    fireEvent.click(
      screen.getByRole('button', { name: /Ask Ah Mah for substitutions/ }),
    );

  const callsTo = (method: string) =>
    (global.fetch as jest.Mock).mock.calls.filter(
      ([url, init]) => url === '/api/inventory' && init?.method === method,
    );

  it('adds a newly ticked ingredient with its category', async () => {
    render(<RecipeLetter recipe={RECIPE} onSend={mockOnSend} />);
    openReconcile();
    fireEvent.click(screen.getByRole('checkbox', { name: /bok choy/ }));
    fireEvent.click(screen.getByRole('button', { name: /Save what I have/ }));

    await waitFor(() => expect(callsTo('POST').length).toBe(1));
    expect(JSON.parse(callsTo('POST')[0][1].body)).toEqual({
      items: [{ name: 'bok choy', type: 'ingredient', category: 'Vegetable' }],
    });
  });

  it('deletes an unticked pantry item by its pantry name', async () => {
    render(<RecipeLetter recipe={RECIPE} onSend={mockOnSend} />);
    openReconcile();
    fireEvent.click(screen.getByRole('checkbox', { name: /chicken thigh/ }));
    fireEvent.click(
      screen.getByRole('button', { name: /Ask about the 2 you're missing/ }),
    );

    await waitFor(() => expect(callsTo('DELETE').length).toBe(1));
    expect(JSON.parse(callsTo('DELETE')[0][1].body)).toEqual({
      itemNames: ['chicken thigh'],
    });
  });

  it('sends an ask naming only what is still missing', async () => {
    render(<RecipeLetter recipe={RECIPE} onSend={mockOnSend} />);
    openReconcile();
    fireEvent.click(
      screen.getByRole('button', { name: /Ask about the 1 you're missing/ }),
    );

    await waitFor(() => expect(mockOnSend).toHaveBeenCalled());
    const sent = mockOnSend.mock.calls[0][0] as string;
    expect(sent).toContain('bok choy');
    expect(sent).not.toContain('chicken thigh');
    expect(sent).toContain('Ginger Chicken');
  });

  // Unticking chicken thigh forces BOTH a write and a send in one submit —
  // the only scenario where the ordering is observable. A tick-only submit
  // sends nothing, so it would pass this assertion vacuously.
  it('writes the pantry before it sends', async () => {
    const order: string[] = [];
    (global.fetch as jest.Mock).mockImplementation(() => {
      order.push('write');
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
    mockOnSend.mockImplementation(() => {
      order.push('send');
    });

    render(<RecipeLetter recipe={RECIPE} onSend={mockOnSend} />);
    openReconcile();
    fireEvent.click(screen.getByRole('checkbox', { name: /chicken thigh/ }));
    fireEvent.click(
      screen.getByRole('button', { name: /Ask about the 2 you're missing/ }),
    );

    await waitFor(() => expect(order).toContain('send'));
    expect(order).toEqual(['write', 'send']);
  });

  it('sends nothing when the corrected list has no gaps', async () => {
    render(<RecipeLetter recipe={RECIPE} onSend={mockOnSend} />);
    openReconcile();
    fireEvent.click(screen.getByRole('checkbox', { name: /bok choy/ }));
    fireEvent.click(screen.getByRole('button', { name: /Save what I have/ }));

    await waitFor(() => expect(callsTo('POST').length).toBe(1));
    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('leaves reconcile mode after submit', async () => {
    render(<RecipeLetter recipe={RECIPE} onSend={mockOnSend} />);
    openReconcile();
    fireEvent.click(
      screen.getByRole('button', { name: /Ask about the 1 you're missing/ }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('checkbox', { name: /bok choy/ })).not.toBeInTheDocument(),
    );
  });

  it('summarises the writes in a toast', async () => {
    render(<RecipeLetter recipe={RECIPE} onSend={mockOnSend} />);
    openReconcile();
    fireEvent.click(screen.getByRole('checkbox', { name: /bok choy/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: /chicken thigh/ }));
    fireEvent.click(
      screen.getByRole('button', { name: /Ask about the 1 you're missing/ }),
    );
    await waitFor(() =>
      expect(mockToastSuccess).toHaveBeenCalledWith(
        'Pantry updated — 1 added, 1 removed.',
      ),
    );
  });

  it('raises no toast when the ticks changed nothing', async () => {
    render(<RecipeLetter recipe={RECIPE} onSend={mockOnSend} />);
    openReconcile();
    fireEvent.click(
      screen.getByRole('button', { name: /Ask about the 1 you're missing/ }),
    );
    await waitFor(() => expect(mockOnSend).toHaveBeenCalled());
    expect(mockToastSuccess).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test src/features/Chat/components/recipe/RecipeLetter.test.tsx -t "Reconcile submit"`
Expected: FAIL — no fetch calls, `onSend` never called.

- [ ] **Step 3: Implement `submitReconcile`**

Replace the Task 2 placeholder in `RecipeLetter.tsx`. Add the import:

```tsx
import { buildReconcilePlan, matchingPantryItems } from './reconcile';
```

```tsx
  // Ticks are factual claims about the pantry (ADR-0026 §8), so they are written
  // straight through. The writes are awaited before the ask goes out: the chat
  // turn calls getInventory, and sending first lets the model read the
  // pre-correction pantry.
  const submitReconcile = async () => {
    const { adds, deletes, stillMissing } = buildReconcilePlan(
      ingredients,
      inventoryItems,
      ticked,
    );

    // mutateResource resolves on a failed response rather than throwing, so
    // every call site checks `res.ok` itself — addToShoppingList above does the
    // same. Without this a 500 would silently "succeed" and the ask would go
    // out against an uncorrected pantry.
    const write = async (
      method: 'POST' | 'DELETE',
      body: Record<string, unknown>,
    ) => {
      const res = await mutateResource({ url: '/api/inventory', method, body });
      if (!res.ok) throw new Error('inventory write failed');
    };

    try {
      if (adds.length) await write('POST', { items: adds });
      if (deletes.length) await write('DELETE', { itemNames: deletes });
      if (adds.length || deletes.length) {
        if (userId) mutate(inventoryKey);
        toast.success(
          `Pantry updated — ${adds.length} added, ${deletes.length} removed.`,
        );
      }
    } catch {
      toast.error("Aiyah, couldn't update your pantry. Try again?");
      return;
    }

    exitReconcile();

    // Nothing left missing is a complete answer: the corrections were the whole
    // point, and there is no substitution to ask for.
    if (stillMissing.length === 0) return;

    const names = stillMissing.map((i) => i.name).join(', ');
    onSend?.(
      `I'm missing ${names} for the ${title}. Can you suggest substitutions or alternatives?`,
    );
  };
```

- [ ] **Step 4: Run the full test file**

Run: `pnpm test src/features/Chat/components/recipe/RecipeLetter.test.tsx`
Expected: PASS, all describes.

- [ ] **Step 5: Type check, lint, commit**

```bash
pnpm typecheck && pnpm lint
git add src/features/Chat/components/recipe/RecipeLetter.tsx src/features/Chat/components/recipe/RecipeLetter.test.tsx
git commit -m "feat(recipe): reconcile submit corrects the pantry then asks"
```

---

### Task 4: Remove the orphaned composer-seeding path

**Files:**
- Modify: `src/features/Chat/Chat.tsx:26-30,50,91`
- Modify: `src/features/Chat/components/MessageInput.tsx:12-15,22,27-39`
- Modify: `src/features/Chat/components/MessageList.tsx:51-52,121`
- Test: `src/features/Chat/components/MessageInput.test.tsx` (three seed cases)

**Interfaces:**
- Consumes: nothing. Task 2 already removed the last caller of `onDraft`.
- Produces: nothing.

**Why this is a removal and not "leave the dead code":** CLAUDE.md says to mention dead code rather than delete it, but that rule guards pre-existing code of unknown purpose. This mechanism exists *solely* to serve `onDraft`, which Task 2 removed — leaving it plumbed through three components is a trap for the next reader. Approved by the owner.

- [ ] **Step 1: Confirm nothing else uses the seeding path**

Run:

```bash
grep -rn "onDraft\|handleDraft\|seed" src/features/Chat/
```

Expected: hits only in `Chat.tsx`, `MessageInput.tsx`, `MessageList.tsx` and their tests. If anything else appears, stop and report it.

- [ ] **Step 2: Delete the seed cases from the tests**

In `src/features/Chat/components/MessageInput.test.tsx`, delete the three seed
tests — `"fills the composer with the seed text without sending"`,
`"replaces whatever was already typed when seeded"`, and `"re-seeds on a new
nonce even when the text is identical"` (around lines 515-580) — and the
`describe` wrapping them if it becomes empty.

`src/features/Chat/components/MessageList.test.tsx` has **no** `onDraft` cases;
verified, nothing to delete there.

- [ ] **Step 3: Run the tests to verify they fail**

Run: `pnpm test src/features/Chat/components/MessageInput.test.tsx`
Expected: PASS (the deletions cannot fail). This step confirms the remaining tests are green **before** the source changes, so a later failure is unambiguous.

- [ ] **Step 4: Remove the implementation**

In `MessageInput.tsx`: delete the `seed` prop from `MessageInputProps` with its comment, the `seed` destructure, and the whole `useEffect` that seeds. Drop `useEffect` from the React import if nothing else uses it.

In `Chat.tsx`: delete the `seed` state and `handleDraft` with their comment, the `seed={seed}` prop on `MessageInput`, and the `onDraft={handleDraft}` prop on `MessageList`. Drop `useState` from the React import if nothing else uses it.

In `MessageList.tsx`: delete the `onDraft` prop from the props type (with its comment) and its default in the destructure.

- [ ] **Step 5: Run the whole suite, type check, lint, commit**

```bash
pnpm test && pnpm typecheck && pnpm lint
git add src/features/Chat/
git commit -m "refactor(chat): drop the composer-seeding path orphaned by reconcile"
```

Expected: full suite green. `useChatSession` is untouched, so no chat behaviour changes.

---

### Task 5: Documentation

**Files:**
- Create: `docs/adr/0027-the-pantry-is-corrected-at-the-point-of-use.md`
- Modify: `CONTEXT.md` (new glossary section, plus cross-links from **Checklist block** and **Addition**)
- Modify: `docs/progress.md`

**Interfaces:**
- Consumes: the shipped behaviour from Tasks 1–4.
- Produces: nothing.

**Numbering note:** the repo already carries two `0026-*` files. `0027` is claimed here; the PWA decision that was pencilled for it is on hold.

- [ ] **Step 1: Write the ADR**

Create `docs/adr/0027-the-pantry-is-corrected-at-the-point-of-use.md`. Follow the house shape used by `0026-checklist-reopens-never-ask-for-possession.md`: `# ADR-NNNN — Title`, then **Status: Accepted**, **Amends:** line, `## Context`, `## Decision` with numbered subsections, `## Why not the alternatives`, `## Consequences`.

Content, drawn from `docs/superpowers/specs/2026-08-22-substitutions-reconcile-design.md`:

- **Context** — the substitutions nudge trusted the pantry record blindly and dumped every Addition into the composer. The record drifts in both directions. `CONTEXT.md` already named the gap: *"Additions accept the record; the checklist corrects it. The checklist runs before the recipe exists; Additions run after."* Nothing corrected the record after a recipe existed.
- **Decision 1** — reconcile mode reuses the **What to gather** grid rather than adding a card; two lists of the same ingredients can disagree, one cannot.
- **Decision 2** — ticks and unticks are both factual claims and both write, extending ADR-0026 §8 past the recipe boundary.
- **Decision 3** — the directions are asymmetric in implementation because `ingredientMatches` is over-permissive (issue #491). Adds use the recipe name; deletes use the matched pantry name and require exactly one match. An ambiguous unticked item falls back to ADR-0026 §5's transient absence.
- **Decision 4** — the ask sends directly. The composer round-trip existed only because the drafted text was wrong.
- **Decision 5** — the nudge shows whenever a pantry is tracked, including at a full count, because over-reporting is invisible otherwise.
- **Why not** — ephemeral picker; missing-only list; adds without deletes; per-delete confirmation; tightening the matcher here.
- **Consequences** — must include the **open question**: reconcile is recipe-scoped and cannot seed a cold-start pantry, survey the whole pantry, or feed Featured Selection (ADR-0007) for Cook With What You Have. The likely split is Pantry as *stock and survey*, reconcile as *correct in place* — **deliberately unresolved**, on the owner's call to use the app first. Record the known cost: recipe-phrased pantry entries, with the loose matcher incidentally preventing outright duplicates. Note `src/features/Inventory/` is untouched, and that issues #490 and #491 are out of scope.

- [ ] **Step 2: Add the CONTEXT.md glossary entry**

Insert a `## Reconcile mode` section after `## Checklist block`, matching the file's existing shape (prose, bold key terms, a `Related:` line). Cover: what it is, that it reuses **What to gather**, that a tick adds and an untick removes, the one-match delete guard, and that it is the *post-recipe* corrector where the **Checklist block** is the *pre-recipe* one. End with:

```
Related: [ADR-0027](docs/adr/0027-the-pantry-is-corrected-at-the-point-of-use.md), [ADR-0026](docs/adr/0026-checklist-reopens-never-ask-for-possession.md), [Checklist block](#checklist-block), [Addition](#addition)
```

Then add `[Reconcile mode](#reconcile-mode)` to the `Related:` lines of **Checklist block** and **Addition**.

- [ ] **Step 3: Update `docs/progress.md`**

Add one line under the current-state section, in the file's existing style, naming the shipped behaviour and linking ADR-0027.

- [ ] **Step 4: Verify the links resolve**

Run:

```bash
ls docs/adr/0027-the-pantry-is-corrected-at-the-point-of-use.md
grep -n "Reconcile mode" CONTEXT.md
grep -n "0027" CONTEXT.md docs/progress.md
```

Expected: the file exists, `CONTEXT.md` has the new heading plus cross-links, `progress.md` names the ADR.

- [ ] **Step 5: Commit**

```bash
git add docs/adr/0027-the-pantry-is-corrected-at-the-point-of-use.md CONTEXT.md docs/progress.md
git commit -m "docs(adr): the pantry is corrected at the point of use"
```

---

## Verification before the PR

- [ ] `pnpm test` — full suite green
- [ ] `pnpm typecheck` — clean
- [ ] `pnpm lint` — clean
- [ ] Drive the app with the `verify` skill: generate a recipe as a guest with a seeded pantry, tap the nudge, untick one item the pantry claims, tick one it does not, submit, and confirm the pantry changed and the ask names only the remaining gaps.
