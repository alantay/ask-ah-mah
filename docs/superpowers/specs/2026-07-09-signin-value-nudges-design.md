# Sign-in value nudges — design spec

**Issue:** #398 — surface the sign-in value ("your kitchen follows you") at high-investment moments.

## Problem

Guest sessions (auto-minted anonymous better-auth users) never see a reason to sign in until they
lose data. The two moments where a guest has just invested something — saving their first recipe,
and marking a recipe "made it" — are exactly when the cost of staying anonymous (losing the
cookbook) is most concrete and least naggy to mention.

## Scope

Two independent, guest-only, one-time nudges, both delivered as a `sonner` toast with a "Sign in"
action button:

1. **First recipe save** — the moment a guest's first-ever recipe save succeeds.
2. **Finish moment** — the moment a guest marks any recipe "made it" (cooked = true) for the first
   time.

Each nudge is shown at most once ever per browser (independent dismiss flags — seeing/dismissing
one does not suppress the other, per the issue's own wording). Never blocks the underlying action;
the save or cooked-toggle succeeds identically whether or not the nudge fires.

Out of scope: a DB-backed "seen" flag (guests have no durable identity worth a schema change for
this), any additional nudge surface beyond these two moments, changing `SignInDialog`'s own
in-dialog copy or auth flow.

## Guest detection

`useSessionContext()` (`src/contexts/SessionContext.tsx`) already exposes `isAuthenticated`
(`!!session?.user && !session.user.isAnonymous`). A nudge fires only when `!isAuthenticated`.

## Persistence

New file `src/lib/signInNudge.ts`, following the existing `useTipsPreference` localStorage
pattern (`src/hooks/useTipsPreference.ts`):

```ts
const PREFIX = "askahmah:signin-nudge:";

export function hasSeenSignInNudge(key: string): boolean {
  try {
    return window.localStorage.getItem(PREFIX + key) === "1";
  } catch {
    return false;
  }
}

export function markSignInNudgeSeen(key: string): void {
  try {
    window.localStorage.setItem(PREFIX + key, "1");
  } catch {
    // Non-fatal: private mode etc. — the nudge just may show again later.
  }
}
```

Two keys: `"first-save"` and `"finish-moment"`. Marked seen the instant the nudge toast is shown
(sonner toasts auto-dismiss with no distinct "user dismissed vs. timed out" event, so "shown" is
the only meaningful checkpoint).

## Trigger points

Both are existing toast call sites; the nudge conditionally changes the toast fired at that call
site rather than stacking a second toast.

### 1. First save — `src/features/Chat/components/MessageList.tsx`, `saveStructuredRecipe`

Currently (line ~286-290):
```ts
toast.success(
  cooked
    ? `"${recipeBlock.title}" — kept in your cookbook and marked as made.`
    : `"${recipeBlock.title}" — kept in your cookbook.`,
);
```

New: before this call, capture `isFirstSave = (recipeSaved?.length ?? 0) === 0` (evaluated before
the save mutates the SWR cache). If `!isAuthenticated && isFirstSave && !hasSeenSignInNudge("first-save")`,
fire the nudge variant instead of the plain success toast, and call `markSignInNudgeSeen("first-save")`:

```ts
toast.success("Saved! Sign in and Ah Mah keeps your cookbook synced to every device, ah.", {
  action: { label: "Sign in", onClick: () => setSignInOpen(true) },
});
```

Otherwise, fire the existing plain toast unchanged.

### 2. Finish moment — two call sites, same treatment

- `src/features/Chat/components/MessageList.tsx`, `handleCookedChange`, when `next === true`
  (currently `toast.success("Marked as made — nice one.")`, line ~325).
- `src/features/RecipeDisplay/RecipeDisplay.tsx`, `handleCookedChange`, when `nextCooked === true`
  (currently `toast.success("Marked as made — nice one.")`, line ~574).

If `!isAuthenticated && !hasSeenSignInNudge("finish-moment")`, fire:

```ts
toast.success("Marked as made — nice one. Sign in and your kitchen follows you, wherever you cook next.", {
  action: { label: "Sign in", onClick: () => setSignInOpen(true) },
});
```
and call `markSignInNudgeSeen("finish-moment")`. Otherwise fire the existing plain toast unchanged.

These two call sites cover every "made it" path in the app: `CookingMode`'s checkbox and
`RecipeDisplay`'s own checkbox both resolve to one of these two handlers (`onCookedChange` threads
`MessageList` → `RecipeLetter` → `CookingMode` for unsaved/chat recipes; `RecipeDisplay` handles
its own for persisted recipes).

## Sign-in trigger wiring

`SignInDialog` (`src/features/Auth/SignInDialog.tsx`) currently owns its own `open` state and
renders its own trigger button — it has no way to be opened from outside. Add optional controlled
props, defaulting to the current uncontrolled behavior so existing callers (e.g. `AuthButton`) are
unaffected:

```ts
interface SignInDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SignInDialog({ open: openProp, onOpenChange: onOpenChangeProp }: SignInDialogProps = {}) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = onOpenChangeProp ?? setOpenState;
  // ...handleOpenChange calls setOpen instead of setOpen(open) directly
```

When `openProp !== undefined`, the component skips rendering its own `<DialogTrigger>` — the
`Dialog`'s `open`/`onOpenChange` are driven entirely externally.

Each of `MessageList.tsx` and `RecipeDisplay.tsx` adds local `const [signInOpen, setSignInOpen] =
useState(false)` and renders `<SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />`
once in its JSX tree (no visible output while closed). The toast action's `onClick` sets it `true`.

## Testing

- `src/lib/signInNudge.test.ts` (new): get/set round-trip per key, independence between keys,
  graceful no-op when `localStorage` throws (private mode) — mirrors `useTipsPreference`'s test
  style.
- `SignInDialog.test.tsx`: add a case for controlled mode (`open`/`onOpenChange` props drive the
  dialog, no own trigger button rendered) alongside the existing uncontrolled-mode tests.
- `MessageList.test.tsx`: guest + first save shows the nudge toast with a "Sign in" action;
  signed-in user does not; a second save (guest, not first) does not; guest + first "made it" via
  `onCookedChange` shows the finish-moment nudge.
- `RecipeDisplay.test.tsx`: guest + first "made it" toggle shows the finish-moment nudge toast;
  signed-in user does not; repeat toggle (already seen) does not.

## Docs

- `docs/progress.md`: one entry noting the two nudges shipped, guest-only, localStorage-gated,
  independent of each other.
- No ADR needed — this is a small, reversible UI addition with no architectural decision to record
  (unlike ADR-0019/0020/0021's tradeoffs).
