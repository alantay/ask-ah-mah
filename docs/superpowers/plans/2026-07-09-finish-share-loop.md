# Finish-Moment Share Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dismissable "share this with someone" prompt right after marking a recipe cooked, and a branded per-recipe OG card for `/r/<token>` links.

**Architecture:** Extract the existing mint-token-and-copy-link logic in `RecipeDisplay.tsx` into a shared `useShareRecipe` hook (adds `navigator.share` support). A new `ShareCta` component renders under the existing `CookedCheckbox` on both surfaces that already have it, gated by a local "just flipped to cooked in this mount" flag. A new `opengraph-image.tsx` file (Next.js App Router convention) generates the branded card, falling back to a real `imageUrl` when present.

**Tech Stack:** Next.js App Router, React, `next/og` `ImageResponse`, existing `CookedCheckbox`/toast/SWR patterns.

## Global Constraints

- Share prompt copy is exactly: "Cooked this for someone? Send them the recipe, lah." (per spec).
- Never blocks Prev/Next/Exit/Done/checkbox interactions — purely additive UI.
- `ShareCta` only shows after `cooked` transitions `false → true` within the component's current
  mount — never on initial render of an already-cooked recipe.
- OG image: prefer `recipe.imageUrl` if present; otherwise render the branded template. 1200×630.
- Reuse `getRecipeByShareToken` (same lookup `generateMetadata` already uses) — no new DB query path.
- `RecipeLetter`'s share affordance only appears when `isSaved` is true (has a DB id).

---

### Task 1: `useShareRecipe` hook

**Files:**
- Create: `src/features/Recipe/useShareRecipe.ts`
- Modify: `src/features/Recipe/index.ts` (barrel export)
- Test: `src/features/Recipe/useShareRecipe.test.ts`

**Interfaces:**
- Produces: `useShareRecipe(recipeId: string, recipeTitle?: string): { share: () => Promise<void>; sharing: boolean }`

- [ ] **Step 1: Write the failing test**

```ts
import { renderHook, act, waitFor } from "@testing-library/react";
import { useShareRecipe } from "./useShareRecipe";

jest.mock("@/contexts/SessionContext", () => ({
  useSessionContext: () => ({ userId: "user-1" }),
}));

const toastError = jest.fn();
const toastSuccess = jest.fn();
jest.mock("sonner", () => ({
  toast: { error: (...a: unknown[]) => toastError(...a), success: (...a: unknown[]) => toastSuccess(...a) },
}));

describe("useShareRecipe", () => {
  const originalFetch = global.fetch;
  const originalShare = (navigator as unknown as { share?: unknown }).share;
  const originalClipboard = navigator.clipboard;

  afterEach(() => {
    global.fetch = originalFetch;
    (navigator as unknown as { share?: unknown }).share = originalShare;
    Object.defineProperty(navigator, "clipboard", { value: originalClipboard, configurable: true });
    jest.clearAllMocks();
  });

  it("mints a token then calls navigator.share when available", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ token: "tok1" }) }) as never;
    const shareMock = jest.fn().mockResolvedValue(undefined);
    (navigator as unknown as { share: unknown }).share = shareMock;

    const { result } = renderHook(() => useShareRecipe("recipe-1", "Fried Rice"));
    await act(async () => {
      await result.current.share();
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/recipe/recipe-1/share", { method: "POST" });
    expect(shareMock).toHaveBeenCalledWith({
      title: "Fried Rice",
      url: expect.stringContaining("/r/tok1"),
    });
  });

  it("falls back to clipboard + toast when navigator.share is unavailable", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ token: "tok2" }) }) as never;
    (navigator as unknown as { share?: unknown }).share = undefined;
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

    const { result } = renderHook(() => useShareRecipe("recipe-1"));
    await act(async () => {
      await result.current.share();
    });

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("/r/tok2"));
    expect(toastSuccess).toHaveBeenCalled();
  });

  it("silently ignores an AbortError from a cancelled native share sheet", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ token: "tok3" }) }) as never;
    const abortError = Object.assign(new Error("cancelled"), { name: "AbortError" });
    (navigator as unknown as { share: unknown }).share = jest.fn().mockRejectedValue(abortError);

    const { result } = renderHook(() => useShareRecipe("recipe-1"));
    await act(async () => {
      await result.current.share();
    });

    expect(toastError).not.toHaveBeenCalled();
  });

  it("toasts an error when minting the token fails", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as never;

    const { result } = renderHook(() => useShareRecipe("recipe-1"));
    await act(async () => {
      await result.current.share();
    });

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Couldn't make a link. Try again?"));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- useShareRecipe.test.ts`
Expected: FAIL — Cannot find module './useShareRecipe'

- [ ] **Step 3: Write minimal implementation**

```ts
"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useSessionContext } from "@/contexts/SessionContext";

export function useShareRecipe(recipeId: string, recipeTitle?: string) {
  const { userId } = useSessionContext();
  const [sharing, setSharing] = useState(false);

  const share = useCallback(async () => {
    if (!userId || sharing) return;
    setSharing(true);
    try {
      const res = await fetch(`/api/recipe/${recipeId}/share`, { method: "POST" });
      if (!res.ok) throw new Error("share failed");
      const { token } = await res.json();
      const url = `${window.location.origin}/r/${token}`;

      if (typeof navigator.share === "function") {
        await navigator.share({ title: recipeTitle, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied — send it to someone.");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("[useShareRecipe] share error:", err);
      toast.error("Couldn't make a link. Try again?");
    } finally {
      setSharing(false);
    }
  }, [recipeId, recipeTitle, userId, sharing]);

  return { share, sharing };
}
```

Add to `src/features/Recipe/index.ts`: `export { useShareRecipe } from "./useShareRecipe";`

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- useShareRecipe.test.ts`
Expected: PASS (4/4)

- [ ] **Step 5: Commit**

```bash
git add src/features/Recipe/useShareRecipe.ts src/features/Recipe/useShareRecipe.test.ts src/features/Recipe/index.ts
git commit -m "feat(recipe): add useShareRecipe hook (mint token, share-sheet or clipboard)"
```

---

### Task 2: `ShareCta` component

**Files:**
- Create: `src/features/shared/components/recipe/ShareCta.tsx`
- Modify: `src/features/shared/components/recipe/index.ts`
- Test: `src/features/shared/components/recipe/ShareCta.test.tsx`

**Interfaces:**
- Consumes: nothing from Task 1 directly — accepts a plain `onShare` callback so it stays presentational.
- Produces: `ShareCta({ onShare, sharing }: { onShare: () => void; sharing?: boolean })`

- [ ] **Step 1: Write the failing test**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { ShareCta } from "./ShareCta";

describe("ShareCta", () => {
  it("renders the share prompt and calls onShare when tapped", () => {
    const onShare = jest.fn();
    render(<ShareCta onShare={onShare} />);
    fireEvent.click(screen.getByText(/Cooked this for someone/));
    expect(onShare).toHaveBeenCalledTimes(1);
  });

  it("dismisses and stops rendering when the close button is tapped", () => {
    render(<ShareCta onShare={jest.fn()} />);
    fireEvent.click(screen.getByLabelText("Dismiss"));
    expect(screen.queryByText(/Cooked this for someone/)).not.toBeInTheDocument();
  });

  it("disables the share action while sharing is in flight", () => {
    render(<ShareCta onShare={jest.fn()} sharing />);
    expect(screen.getByText(/Cooked this for someone/).closest("button")).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- ShareCta.test.tsx`
Expected: FAIL — Cannot find module './ShareCta'

- [ ] **Step 3: Write minimal implementation**

```tsx
"use client";

import { useState } from "react";
import { Share2, X } from "lucide-react";

export function ShareCta({
  onShare,
  sharing,
}: {
  onShare: () => void;
  sharing?: boolean;
}) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="mt-2 flex items-center gap-2">
      <button
        type="button"
        onClick={onShare}
        disabled={sharing}
        className="inline-flex items-center gap-1.5 font-sans text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Share2 className="size-3.5" aria-hidden />
        Cooked this for someone? Send them the recipe, lah.
      </button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-pointer"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
```

Add to `src/features/shared/components/recipe/index.ts`: `export { ShareCta } from "./ShareCta";`

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- ShareCta.test.tsx`
Expected: PASS (3/3)

- [ ] **Step 5: Commit**

```bash
git add src/features/shared/components/recipe/ShareCta.tsx src/features/shared/components/recipe/ShareCta.test.tsx src/features/shared/components/recipe/index.ts
git commit -m "feat(recipe): add ShareCta prompt component"
```

---

### Task 3: Wire into `CookingMode`

**Files:**
- Modify: `src/features/Recipe/CookingMode.tsx`
- Test: `src/features/Recipe/CookingMode.test.tsx`

**Interfaces:**
- Consumes: `ShareCta` from Task 2 (`@/features/shared/components/recipe`)
- Produces: `CookingMode` gains optional props `onShare?: () => void`, `sharing?: boolean`

- [ ] **Step 1: Write the failing test**

Add to `src/features/Recipe/CookingMode.test.tsx`:

```tsx
import { ShareCta } from "@/features/shared/components/recipe";
// (ShareCta import only needed if referenced directly; tests below use rendered text instead)

describe("CookingMode — finish-moment share prompt", () => {
  const goToLastStep = () => fireEvent.click(screen.getByText("Next step →"));

  it("does not show the share prompt before cooked is ticked", () => {
    render(
      <CookingMode
        title="Fried Rice"
        steps={steps}
        onExit={jest.fn()}
        cooked={false}
        onCookedChange={jest.fn()}
        onShare={jest.fn()}
      />,
    );
    goToLastStep();
    expect(screen.queryByText(/Cooked this for someone/)).not.toBeInTheDocument();
  });

  it("shows the share prompt right after ticking cooked, and calls onShare when tapped", () => {
    const onShare = jest.fn();
    render(
      <CookingMode
        title="Fried Rice"
        steps={steps}
        onExit={jest.fn()}
        cooked={false}
        onCookedChange={jest.fn()}
        onShare={onShare}
      />,
    );
    goToLastStep();
    fireEvent.click(screen.getByRole("checkbox", { name: "I made this" }));

    expect(screen.getByText(/Cooked this for someone/)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Cooked this for someone/));
    expect(onShare).toHaveBeenCalledTimes(1);
  });

  it("does not show the prompt when an already-cooked recipe mounts with cooked=true", () => {
    render(
      <CookingMode
        title="Fried Rice"
        steps={steps}
        onExit={jest.fn()}
        cooked
        onCookedChange={jest.fn()}
        onShare={jest.fn()}
      />,
    );
    goToLastStep();
    expect(screen.queryByText(/Cooked this for someone/)).not.toBeInTheDocument();
  });

  it("omits the share prompt entirely when onShare is not provided", () => {
    render(
      <CookingMode
        title="Fried Rice"
        steps={steps}
        onExit={jest.fn()}
        cooked={false}
        onCookedChange={jest.fn()}
      />,
    );
    goToLastStep();
    fireEvent.click(screen.getByRole("checkbox", { name: "I made this" }));
    expect(screen.queryByText(/Cooked this for someone/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- CookingMode.test.tsx -t "share prompt"`
Expected: FAIL — prompt never renders (props don't exist yet / no wiring)

- [ ] **Step 3: Write minimal implementation**

In `CookingMode.tsx`, add imports and props, and a local `justCooked` flag:

```tsx
import { CookedCheckbox, ShareCta } from "@/features/shared/components/recipe";
```

```tsx
interface CookingModeProps {
  title: string;
  steps: Step[];
  prep?: string[];
  onExit: () => void;
  cooked?: boolean;
  onCookedChange?: (cooked: boolean) => void;
  // Mints/shares the public link for this recipe. Omitted when the recipe
  // can't be shared yet (e.g. unsaved chat recipe) — the prompt then never renders.
  onShare?: () => void;
  sharing?: boolean;
}
```

```tsx
export function CookingMode({ title, steps, prep, onExit, cooked, onCookedChange, onShare, sharing }: CookingModeProps) {
  // ...existing state...
  const [justCooked, setJustCooked] = useState(false);

  const handleCookedChange = (next: boolean) => {
    onCookedChange?.(next);
    if (next) setJustCooked(true);
  };
```

Replace the checkbox block:

```tsx
        {canMark && onCookedChange && (
          <>
            <CookedCheckbox cooked={!!cooked} onChange={handleCookedChange} className="mb-3" />
            {justCooked && onShare && <ShareCta onShare={onShare} sharing={sharing} />}
          </>
        )}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- CookingMode.test.tsx`
Expected: PASS (all tests in file, including pre-existing ones)

- [ ] **Step 5: Commit**

```bash
git add src/features/Recipe/CookingMode.tsx src/features/Recipe/CookingMode.test.tsx
git commit -m "feat(recipe): show share prompt in CookingMode right after marking cooked"
```

---

### Task 4: Wire into `RecipeDisplay` (both the end-cap and the header Share button)

**Files:**
- Modify: `src/features/RecipeDisplay/RecipeDisplay.tsx`
- Test: `src/features/RecipeDisplay/RecipeDisplay.test.tsx`

**Interfaces:**
- Consumes: `useShareRecipe` (Task 1), `ShareCta` (Task 2)
- Produces: `RecipeBody` gains `onShare?: () => void`, `sharing?: boolean` props

- [ ] **Step 1: Write the failing test**

Add to `src/features/RecipeDisplay/RecipeDisplay.test.tsx` (reuse `fetchMock` from the existing "Cooked marker" describe block's `beforeEach`):

```tsx
describe("Finish-moment share prompt", () => {
  const originalFetch = global.fetch;
  let fetchMock: jest.Mock;
  const originalShare = (navigator as unknown as { share?: unknown }).share;

  beforeEach(() => {
    fetchMock = jest.fn().mockImplementation((url: string) => {
      if (url.includes("/share")) {
        return Promise.resolve({ ok: true, json: async () => ({ token: "tok1" }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    global.fetch = fetchMock as never;
    (navigator as unknown as { share: unknown }).share = jest.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    (navigator as unknown as { share?: unknown }).share = originalShare;
  });

  it("shows the share prompt after ticking 'I made this', and shares the link when tapped", async () => {
    renderRecipe();
    fireEvent.click(screen.getByRole("checkbox", { name: "I made this" }));

    expect(await screen.findByText(/Cooked this for someone/)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Cooked this for someone/));

    await waitFor(() =>
      expect(navigator.share).toHaveBeenCalledWith(
        expect.objectContaining({ url: expect.stringContaining("/r/tok1") }),
      ),
    );
  });

  it("does not show the prompt for a recipe that's already cooked on load", () => {
    renderRecipe({ cooked: true } as never);
    expect(screen.queryByText(/Cooked this for someone/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- RecipeDisplay.test.tsx -t "share prompt"`
Expected: FAIL — prompt never renders

- [ ] **Step 3: Write minimal implementation**

Add `onShare`/`sharing` to `RecipeBodyProps` and render `ShareCta` beside the existing checkbox, gated the same way as Task 3:

```tsx
interface RecipeBodyProps {
  // ...existing fields...
  cooked?: boolean;
  onCookedChange?: (cooked: boolean) => void;
  onShare?: () => void;
  sharing?: boolean;
}
```

```tsx
function RecipeBody({
  // ...existing destructured props...
  cooked = false,
  onCookedChange,
  onShare,
  sharing,
}: RecipeBodyProps) {
  const [justCooked, setJustCooked] = useState(false);
  const handleCookedChange = onCookedChange
    ? (next: boolean) => {
        onCookedChange(next);
        if (next) setJustCooked(true);
      }
    : undefined;
  // ...
```

Replace the end-cap block:

```tsx
        {onCookedChange && (
          <div className="mt-9 pt-6 border-t border-dashed border-border">
            <CookedCheckbox cooked={cooked} onChange={handleCookedChange!} />
            {justCooked && onShare && <ShareCta onShare={onShare} sharing={sharing} />}
          </div>
        )}
```

Import `useState` is already imported in this file (top-level `RecipeDisplay.tsx` imports `useState` from React) — `RecipeBody` is a separate function in the same file/module scope, so it can call the hook directly.

In the top-level `RecipeDisplay` component: replace the existing `handleShare`/`sharing` state with the hook, and pass the result down to `RecipeBody`:

```tsx
  const { share, sharing } = useShareRecipe(recipe.id, workingDraft.name);
```

Remove the old `const [sharing, setSharing] = useState(false);` and the old `handleShare` `useCallback` block entirely — both are superseded by the hook. Update the header Share button's `onClick={handleShare}` to `onClick={share}`, and its `disabled={sharing}` (if present) stays wired to the hook's `sharing`.

Pass to `RecipeBody`:

```tsx
                <RecipeBody
                  // ...existing props...
                  cooked={!!workingDraft.cooked}
                  onCookedChange={!readOnly && userId ? handleCookedChange : undefined}
                  onShare={!readOnly && userId ? share : undefined}
                  sharing={sharing}
                />
```

Add the import: `import { CookingMode, ServingsStepper, formatRecipeAsText, useShareRecipe } from "@/features/Recipe";` and add `ShareCta` to the existing `@/features/shared/components/recipe` import list.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- RecipeDisplay.test.tsx`
Expected: PASS (all tests in file)

- [ ] **Step 5: Commit**

```bash
git add src/features/RecipeDisplay/RecipeDisplay.tsx src/features/RecipeDisplay/RecipeDisplay.test.tsx
git commit -m "feat(recipe): wire share prompt + useShareRecipe into RecipeDisplay"
```

---

### Task 5: Wire into `RecipeLetter` (chat) via `MessageList`

**Files:**
- Modify: `src/features/Chat/components/recipe/RecipeLetter.tsx`
- Modify: `src/features/Chat/components/MessageList.tsx`
- Test: `src/features/Chat/components/recipe/RecipeLetter.test.tsx`

**Interfaces:**
- Consumes: `CookingMode`'s new `onShare`/`sharing` props (Task 3), `useShareRecipe` (Task 1)
- Produces: `RecipeLetter` gains optional `onShare?: () => void`, `sharing?: boolean` props, forwarded to `CookingMode`

- [ ] **Step 1: Write the failing test**

Add to `src/features/Chat/components/recipe/RecipeLetter.test.tsx` (find the existing render helper used by other tests in this file and reuse its pattern):

```tsx
it("forwards onShare/sharing into CookingMode when the recipe is saved", () => {
  const onShare = jest.fn();
  render(
    <RecipeLetter
      recipe={{ title: "Fried Rice", steps: [{ title: "Cook", body: "Fry it." }], baseServings: 2 }}
      isSaved
      cooked={false}
      onCookedChange={jest.fn()}
      onShare={onShare}
    />,
  );
  fireEvent.click(screen.getByLabelText(/Start cooking/));
  fireEvent.click(screen.getByRole("checkbox", { name: "I made this" }));
  fireEvent.click(screen.getByText(/Cooked this for someone/));
  expect(onShare).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- RecipeLetter.test.tsx -t "forwards onShare"`
Expected: FAIL — `onShare` prop doesn't exist / not forwarded

- [ ] **Step 3: Write minimal implementation**

In `RecipeLetter.tsx`:

```tsx
export interface RecipeLetterProps {
  // ...existing fields...
  cooked?: boolean;
  onCookedChange?: (cooked: boolean) => void;
  onShare?: () => void;
  sharing?: boolean;
  onDraft?: (text: string) => void;
  isStreaming?: boolean;
}

export function RecipeLetter({
  // ...existing destructured props...
  cooked,
  onCookedChange,
  onShare,
  sharing,
}: RecipeLetterProps) {
  // ...
  return (
    // ...
    <CookingMode
      title={title}
      steps={steps}
      onExit={() => setCooking(false)}
      cooked={cooked}
      onCookedChange={onCookedChange}
      onShare={onShare}
      sharing={sharing}
    />
    // ...
  );
}
```

In `MessageList.tsx`, thread `useShareRecipe` for saved recipes only:

```tsx
import { useShareRecipe } from "@/features/Recipe";
```

Inside the `blocks.map` where `savedRecipe`/`isSaved` are resolved (around the existing `RecipeLetter` render at line ~460), the hook can't be called conditionally per-block inside a `.map` (rules of hooks) — so create a tiny wrapper component in this file instead of calling the hook inline:

```tsx
function SavedRecipeLetter({
  recipeId,
  recipeTitle,
  ...rest
}: { recipeId: string; recipeTitle: string } & Omit<RecipeLetterProps, "onShare" | "sharing">) {
  const { share, sharing } = useShareRecipe(recipeId, recipeTitle);
  return <RecipeLetter {...rest} onShare={share} sharing={sharing} />;
}
```

Replace the `isSaved` render branch:

```tsx
                      const isSaved = !!savedRecipe;
                      const letterProps = {
                        key: blockKey,
                        recipe: block.payload,
                        onSave: () => saveStructuredRecipe(block.payload, recipeKey),
                        isSaved,
                        onDraft,
                        cooked: savedRecipe?.cooked ?? false,
                        onCookedChange: (next: boolean) =>
                          handleCookedChange(block.payload, recipeKey, next),
                      };
                      return isSaved && savedRecipe ? (
                        <SavedRecipeLetter
                          {...letterProps}
                          recipeId={savedRecipe.id}
                          recipeTitle={block.payload.title ?? ""}
                        />
                      ) : (
                        <RecipeLetter {...letterProps} />
                      );
```

(Import `RecipeLetterProps` type from `./recipe/RecipeLetter` for the wrapper's prop type.)

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- RecipeLetter.test.tsx`
Expected: PASS (all tests in file)

Also run: `pnpm test -- MessageList.test.tsx` (if it exists) to confirm no regression from the render-branch change.

- [ ] **Step 5: Commit**

```bash
git add src/features/Chat/components/recipe/RecipeLetter.tsx src/features/Chat/components/recipe/RecipeLetter.test.tsx src/features/Chat/components/MessageList.tsx
git commit -m "feat(chat): forward share prompt into RecipeLetter for saved recipes"
```

---

### Task 6: Branded OG card (`opengraph-image.tsx`)

**Files:**
- Create: `src/app/r/[token]/opengraph-image.tsx`
- Test: `src/app/r/[token]/opengraph-image.test.ts`

**Interfaces:**
- Consumes: `getRecipeByShareToken` from `@/lib/recipes`
- Produces: default export `Image` (Next.js OG image route convention), plus exported `size` and `contentType`

- [ ] **Step 1: Write the failing test**

```ts
import { getRecipeByShareToken } from "@/lib/recipes";

jest.mock("@/lib/recipes", () => ({
  getRecipeByShareToken: jest.fn(),
}));

jest.mock("next/og", () => ({
  ImageResponse: jest.fn().mockImplementation(function (this: { tree: unknown }, tree: unknown) {
    this.tree = tree;
  }),
}));

import ogImage from "./opengraph-image";

describe("opengraph-image", () => {
  it("renders the recipe's own imageUrl when present", async () => {
    (getRecipeByShareToken as jest.Mock).mockResolvedValue({
      name: "Fried Rice",
      imageUrl: "https://example.com/photo.jpg",
    });

    const result = (await ogImage({ params: Promise.resolve({ token: "tok1" }) })) as unknown as {
      tree: { props: { children: unknown } };
    };

    const treeString = JSON.stringify(result.tree);
    expect(treeString).toContain("https://example.com/photo.jpg");
  });

  it("renders the branded template with the recipe name when there's no imageUrl", async () => {
    (getRecipeByShareToken as jest.Mock).mockResolvedValue({
      name: "Fried Rice",
      imageUrl: null,
    });

    const result = (await ogImage({ params: Promise.resolve({ token: "tok2" }) })) as unknown as {
      tree: { props: { children: unknown } };
    };

    const treeString = JSON.stringify(result.tree);
    expect(treeString).toContain("Fried Rice");
    expect(treeString).toContain("from Ah Mah's kitchen");
  });

  it("falls back to a generic branded card when the token doesn't resolve", async () => {
    (getRecipeByShareToken as jest.Mock).mockResolvedValue(null);

    const result = (await ogImage({ params: Promise.resolve({ token: "bad" }) })) as unknown as {
      tree: { props: { children: unknown } };
    };

    const treeString = JSON.stringify(result.tree);
    expect(treeString).toContain("Ask Ah Mah");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- opengraph-image.test.ts`
Expected: FAIL — Cannot find module './opengraph-image'

- [ ] **Step 3: Write minimal implementation**

```tsx
import { ImageResponse } from "next/og";
import { getRecipeByShareToken } from "@/lib/recipes";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const STAMP_GRADIENT = "linear-gradient(135deg, oklch(0.55 0.13 35) 0%, oklch(0.42 0.10 30) 100%)";

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const recipe = await getRecipeByShareToken(token);

  if (recipe?.imageUrl) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={recipe.imageUrl}
            alt={recipe.name}
            width={size.width}
            height={size.height}
            style={{ objectFit: "cover", width: "100%", height: "100%" }}
          />
        </div>
      ),
      size,
    );
  }

  const name = recipe?.name ?? "Ask Ah Mah";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background: STAMP_GRADIENT,
          padding: 64,
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 96,
            height: 96,
            borderRadius: "50% 50% 50% 10px",
            background: "rgba(255,255,255,0.15)",
            fontSize: 40,
            fontWeight: 700,
            marginBottom: 32,
            transform: "rotate(-3deg)",
          }}
        >
          阿
        </div>
        <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.15 }}>{name}</div>
        <div style={{ fontSize: 28, opacity: 0.85, marginTop: 16 }}>from Ah Mah&apos;s kitchen</div>
      </div>
    ),
    size,
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- opengraph-image.test.ts`
Expected: PASS (3/3)

- [ ] **Step 5: Commit**

```bash
git add src/app/r/\[token\]/opengraph-image.tsx src/app/r/\[token\]/opengraph-image.test.ts
git commit -m "feat(recipe): branded OG card for shared recipe links, falls back to real photo"
```

---

### Task 7: Docs — ADR-0022 + progress.md + brand doc

**Files:**
- Create: `docs/adr/0022-share-prompt-is-quiet-and-photo-first-og-fallback.md`
- Modify: `docs/progress.md`
- Modify: `docs/brand-ahmah.md`

- [ ] **Step 1: Write ADR-0022**

```markdown
# ADR-0022 — Share prompt stays quiet; real photos beat the branded OG card

**Status:** Accepted

## Context

[Issue #402](https://github.com/alantay/ask-ah-mah/issues/402) closes the last 10% of the referral
loop identified in `brand-ahmah.md` §3: an in-flow prompt at the moment of pride, plus a branded
per-recipe OG card so a shared link carries Ah Mah's identity instead of a generic preview. This
extends ADR-0020's "cooking is celebrated, not tracked" principle to sharing: quiet, optional,
never a trophy or a nag.

## Decision

**Share prompt visibility is session-local, not derived from the `cooked` prop.** `ShareCta` only
renders after a `false → true` transition happens inside the current mount (a local `justCooked`
flag set inside the existing cooked-change handler) — never on load of an already-cooked recipe.
Reopening a previously-cooked dish shouldn't nag the cook to share it retroactively; the prompt is
tied to the moment of finishing, not the state of having finished.

**Real photo beats the branded card.** The OG image at `/r/<token>` prefers the recipe's own
`imageUrl` when the user has one (uploaded/pasted-recipe photos already existed); the generated
branded template (gradient, stamp, "from Ah Mah's kitchen") is the fallback for recipes without a
photo. `brand-ahmah.md` §3's "featured by grandma" positioning favors authentic photos over generic
branding when both are available.

## Why not the alternatives

- **Always show the branded card, even over a real photo.** Rejected — a real photo the user chose
  to add is more compelling and more "featured by grandma"-authentic than a generic template; the
  brand's job is to fill the gap when there's nothing else, not to override real content.
- **Persist "already prompted to share" server-side.** Rejected — adds a field/migration for a
  purely session-scoped nicety; re-showing the prompt on a fresh mount after re-ticking cooked is
  harmless and mirrors the checkbox's own reversibility.

## Consequences

- `ShareCta` needs no new persisted state — a local `useState` flag per mount is sufficient.
- The OG route does one extra `getRecipeByShareToken` lookup already paid for by `generateMetadata`
  in the same route folder (no new query path).
- `brand-ahmah.md` §3's "~90% built" line is now closed out — see progress.md.
```

- [ ] **Step 2: Add to `docs/progress.md`**

Add an entry (matching the existing "Shipped" section style, e.g. near the #407/#377 entries):

```markdown
### Finish-moment share loop — Shipped Jul 2026 (#402)

- Dismissable "Cooked this for someone? Send them the recipe, lah." prompt appears right after
  ticking "I made this," on both CookingMode's last step and RecipeDisplay's end-cap — never on
  load of an already-cooked recipe (ADR-0022).
- Tapping it mints/reuses the existing share token and opens the native share sheet on mobile
  (straight into WhatsApp/Telegram) or copies the link on desktop (`useShareRecipe`).
- `/r/<token>` links now carry a branded OG card (dish name, Ah Mah's stamp, gradient hero) instead
  of the generic fallback image — unless the recipe has its own photo, which takes priority.
- Chat's `RecipeLetter` only offers this once the recipe is saved (has a DB id to mint a token for).
```

- [ ] **Step 3: Update `docs/brand-ahmah.md` §3**

Change the referral row's "~90% built" description to reflect the closed gap — locate the line:

```
| Referral (private 1:1 share) | "I cooked this, try it" + link to a friend | Low — ~90% built (`/r/<token>` public page + OG preview) | Fits the nervous beginner; trusted-referral converts |
```

Replace with:

```
| Referral (private 1:1 share) | "I cooked this, try it" + link to a friend | Low — built (#402: in-flow share prompt + branded OG card) | Fits the nervous beginner; trusted-referral converts |
```

- [ ] **Step 4: Commit**

```bash
git add docs/adr/0022-share-prompt-is-quiet-and-photo-first-og-fallback.md docs/progress.md docs/brand-ahmah.md
git commit -m "docs: ADR-0022 + progress.md + brand doc for finish-moment share loop (#402)"
```

---

### Task 8: Full suite + manual verification

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test`
Expected: all suites pass, no regressions.

- [ ] **Step 2: Manual check with Playwright** (per this repo's `verify` skill)

Start `pnpm dev` if not already running, then drive a real browser: seed a saved recipe via
`POST /api/recipe`, open it, start cooking, reach the last step, tick "I made this," confirm the
share prompt appears and (with `navigator.share` unavailable in headless Chromium) falls back to
clipboard + toast. Then visit `/r/<token>` directly and screenshot the page `<head>`'s
`og:image` URL to confirm `opengraph-image` resolves (screenshots into `.scratch/`, per the verify
skill's gotchas).

- [ ] **Step 3: Commit any fixes found during manual verification, if needed.**
