# Finish-moment share loop — design spec

**Issue:** [#402](https://github.com/alantay/ask-ah-mah/issues/402)
**Status:** Approved, ready for implementation plan

## Context

`brand-ahmah.md` §3 identifies the referral motion as "~90% built" — `/r/<token>` public pages
and OG unfurls already exist (ADR: none yet, shipped ad hoc) — but the last 10%, an in-flow prompt
at the moment of pride, doesn't exist. Today sharing requires navigating to the cookbook and
finding the Share button; the finish moment (#377 / ADR-0020) ends privately.

Blocked by #377, which shipped in PR #409 (merged). This spec covers both halves of #402:

- **A.** An in-flow, dismissable share prompt right after marking a recipe cooked.
- **B.** A branded per-recipe OG card, replacing the generic `og-image.png` fallback, so a shared
  link carries Ah Mah's identity instead of a generic preview.

## A. Share prompt at the finish moment

### Placement

Both surfaces that already carry the `CookedCheckbox` (ADR-0020): `CookingMode`'s last step, and
`RecipeDisplay`'s end-cap. Same rule as the checkbox itself — CookingMode is the literal in-flow
moment, RecipeDisplay exists because many people cook without stepping through CookingMode.

### Behavior

- A new `ShareCta` component renders directly below `CookedCheckbox` when: (a) the checkbox is
  currently `cooked === true`, **and** (b) that transition happened in this component's lifetime
  (not on load with an already-`cooked` recipe reopened later) — a `useState` flag set inside the
  existing `onCookedChange(true)` handler, not derived from the `cooked` prop alone.
- Copy: *"Cooked this for someone? Send them the recipe, lah."* with a share icon button.
- Dismissable (×) — hides for the rest of that mount; reappears if the user un-ticks and re-ticks
  cooked in the same session (mirrors the checkbox's own reversibility).
- Tapping it calls the share action: `navigator.share({ title, url })` when available (mobile —
  opens straight into WhatsApp/Telegram), else copies the link and toasts "Link copied — send it
  to someone." Errors toast "Couldn't make a link. Try again?" (matches existing `handleShare`
  copy/tone in `RecipeDisplay.tsx`).
- Never blocks or delays Prev/Next/Exit/Done. Purely additive UI.
- Chat's `RecipeLetter` only wires this up when the recipe is saved (has a DB id) — an unsaved,
  still-streaming recipe has no share token to mint.

### Data flow / reuse

- `RecipeDisplay.tsx` already has `handleShare` (mint token via `POST /api/recipe/:id/share`,
  then copy link + toast). Extract this into a shared hook, `useShareRecipe(recipeId)` in
  `src/features/Recipe/`, returning `{ share, sharing }`. `share()` does mint-token →
  `navigator.share` if available → else clipboard + toast, so the mobile-vs-desktop branching
  lives in one place instead of being duplicated per surface.
- `RecipeDisplay` calls this hook directly (it already has `recipe.id`) and renders `ShareCta`
  inline next to its own `CookedCheckbox`, passing the hook's `share` function straight in — no
  new prop threading needed on that surface.
- `CookingMode` and `RecipeLetter` don't fetch — they stay presentational. Both get a new optional
  prop `onShare?: () => void` (same pattern as existing `onCookedChange`). `RecipeLetter` is
  rendered from `MessageList.tsx`, which already resolves `savedRecipe` (has `.id`) for the cooked
  marker — it calls the same `useShareRecipe(savedRecipe.id)` hook and passes `share` down as
  `onShare`, only when `isSaved` is true (otherwise omit the prop and `ShareCta` doesn't render,
  same convention as `onCookedChange` being optional today).

### Out of scope

- No share-count/analytics.
- No forced share before finishing — strictly optional, matches ADR-0020's "quiet, not a trophy"
  philosophy applied to sharing instead of cooking.

## B. Branded OG card

### Mechanism

Next.js App Router file convention: `src/app/r/[token]/opengraph-image.tsx`, exporting a default
function returning `ImageResponse` (from `next/og`). This auto-wires into the `<head>` metadata
for that route — no manual `openGraph.images` wiring needed for the generated case, and Next merges
it with the existing `generateMetadata` in `page.tsx`.

### Content

- Recipe name, Ah Mah's stamp (the same rotated jade "stamp" motif already used elsewhere —
  ADR-0020 mentions it for the cookbook badge), a gradient hero background, and the line "from Ah
  Mah's kitchen."
- 1200×630 (standard OG size).

### Fallback rule

If the recipe has a real, user-supplied `imageUrl` (`RecipeWithId.imageUrl`), prefer that as the
og:image instead of the generated card — an authentic photo beats a generic branded frame, and
`brand-ahmah.md` §3's "featured by grandma" positioning favors real photos when they exist. The
generated branded card is the fallback for recipes without one.

Since `opengraph-image.tsx` can't conditionally "opt out" and defer to metadata images in the App
Router (the file convention always wins once present), fallback is implemented inside
`opengraph-image.tsx` itself: fetch the recipe by token, and if `imageUrl` is set, render an
`ImageResponse` that displays that photo (fetched and drawn via `<img>` inside the JSX tree that
`ImageResponse` accepts) rather than the branded template. Same token lookup as `generateMetadata`
today (`getRecipeByShareToken`).

### Out of scope

- No new upload/photo feature — this only changes which existing `imageUrl` (already optional
  today) gets preferred, and adds the generated fallback for recipes without one.

## Testing

- `ShareCta` / hook: unit tests for the "shows only after a true transition, not on cooked=true
  mount", "dismiss hides it", "calls navigator.share when available, else clipboard" branches —
  same style as the existing `CookedCheckbox`/`RecipeDisplay` cooked-marker tests.
- `opengraph-image.tsx`: no existing OG/`ImageResponse` test precedent in this repo, and
  `next/og`'s `ImageResponse` isn't meaningfully snapshot-testable in Jest/jsdom. Test only the
  logic that's ours: mock `getRecipeByShareToken` and assert the function picks the `imageUrl`
  branch vs. the branded-template branch correctly (a thin unit test around the branching, not the
  rendered pixels).

## Docs

- `docs/progress.md`: add a "Finish-moment share loop — Shipped Jul 2026 (#402)" entry.
- `docs/brand-ahmah.md`: update §3's "~90% built" line once the in-flow prompt + branded card ship
  (it currently describes the *gap* this closes).
- New ADR-0022: documents the share-prompt's transient-visibility rule (why it's session-local
  state and not derived from the `cooked` prop) and the OG-image fallback rule (real photo over
  branded template), as an extension of ADR-0020's "quiet, not a trophy" principle to the sharing
  surface.
