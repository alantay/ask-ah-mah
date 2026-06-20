# Design: Recipe-first design system + page alignment

**Date:** 2026-06-20
**Status:** Approved (brainstorming) — pending implementation plan / issues
**Author:** Alan Tay (with Claude)

---

## Problem

The app renders the same recipe data on two surfaces — the in-chat recipe
(`RecipeLetter`) and the cookbook page (`RecipeDisplay`) — with **independent,
duplicated styling**. They drifted: different step-number treatment, body font
(serif vs sans), and tip-callout styling. A one-off fix (PR #276) re-aligned the
tip callout and body font by hand, but the root cause remains: no shared atoms
and no written design language, so any future change re-introduces drift.

More broadly, the app has ~7 distinct surfaces (Chat, Cookbook, Conversations,
RecipeList, Inventory, Recipe/CookingMode, Auth) that have each evolved their own
spacing, type sizes, and color usage. We want a **design system that acts as the
north star**: each page is tweaked to "belong" to one coherent visual language.

## Goal

Establish a canonical design system (tokens + atoms + written rules), prove it by
aligning the two recipe surfaces, and produce a per-surface audit so the remaining
pages can be aligned incrementally — each as its own small PR.

**Non-goals (this spec):**
- Aligning the 5 non-recipe surfaces (audit only here; fixes are follow-ups).
- The Claude Design catalog (Phase 2, separate, after atoms stabilize).
- `IngredientRow` extraction — descoped; ingredients are the most entangled
  (scaling, add-to-pantry, diff highlight all differ) and weren't part of the
  drift. Candidate for a later pass.

---

## Existing foundation

`src/app/globals.css` already defines a strong token layer via Tailwind v4
`@theme`:
- **Colors:** `primary`, `primary-deep`, `primary-tint`, `jade`, `ink-faint`,
  `secondary`, `muted-foreground`, `card`, `chat`, `border`, `border-soft`, …
- **Type scale:** `eyebrow` (10), `micro` (11), `dense` (13), `emphasis` (15),
  `heading` (22), `display` (40).
- **Shadows / radius:** `--shadow-cta`, `--radius`.
- **Fonts:** `--font-display` (serif), `--font-sans`, `--font-logo`.

What's missing is (a) the ad-hoc inline values not promoted to tokens (the ochre
callout color), (b) shared components, and (c) a written guide.

---

## Design

### 1. Shared recipe atoms

Location: `src/features/shared/components/recipe/` (mirrors existing
`shared/components/loaders/`), with a barrel `index.ts`. Cross-feature import via
`@/features/shared/components/recipe`.

| Component | API | Replaces |
|---|---|---|
| `Eyebrow` | `<Eyebrow className?>children</Eyebrow>` → `<span>` with `font-sans text-eyebrow font-bold tracking-[0.16em] uppercase text-ink-faint` | chat's `EYEBROW_BASE` const + cookbook's inline eyebrow stacks |
| `SectionHeading` | `<SectionHeading>Method</SectionHeading>` → `font-display font-semibold text-heading tracking-tight` | cookbook `<h2>` repeated 4× |
| `DottedList` | `<DottedList items={string[]} />` → `<ul>` of `·` + dashed `border-b` rows | prep + notes lists in **both** files |
| `StepItem` | `<StepItem n={number} marker="stamp"\|"quiet" step={RecipeStep} />` | the core step render (ink-stamp badge vs quiet `1.`) |
| `StepList` | `<StepList steps={RecipeStep[]} marker={…} />` — thin map over `StepItem` | chat's step loop |
| `StepTip` | `<StepTip>{tip}</StepTip>` → bar + em-dash callout using `border-callout` | the callout hand-unified in PR #276 |

**Registers via `marker` prop.** `StepItem marker="stamp"` renders the rotated
terracotta ink-stamp badge (chat letter); `marker="quiet"` renders the mono `1.`
(cookbook reference). One render, two registers.

**Keep entangled logic in place (low-risk boundary).** `RecipeDisplay`'s diff
overlay needs per-step highlight classes, `data-tweak-row`, and an appended
"deleted steps" list. So `StepItem` is the shared atom and `RecipeDisplay` keeps
mapping its own diff-aware loop *using* `StepItem`, rather than forcing diff logic
into a shared `StepList`. Chat uses the convenience `StepList`.

**Canonical `DottedList` style.** Chat's bullet is `text-[11px]`; cookbook's is
`text-[13px] w-5` aligned. Standardize on the **cookbook aligned version**. Chat's
prep/notes bullets shift very slightly — accepted.

### 2. Token

Add to the `@theme` block in `globals.css`:

```css
--color-callout: oklch(0.65 0.10 60); /* warm ochre — tip / aside accent bar */
```

Replace both inline `border-[oklch(0.65_0.10_60)]` usages
(`RecipeLetter.tsx`, `RecipeDisplay.tsx`) with `border-callout`.

### 3. The written guide — `docs/design-system.md`

The north star pages are measured against. Sections:

- **Voice:** serif (`font-display`) for content + headings; sans (`font-sans`)
  only for eyebrows / labels / UI chrome; mono for numerals (amounts, counts).
- **Type scale:** use named roles (`eyebrow / micro / dense / emphasis /
  heading / display`). No arbitrary `text-[Npx]` for these roles.
- **Color roles:** `primary` = actions / step-stamp / brand; `jade` =
  have / success; `ink-faint` = quiet markers / labels; `callout` = tip accent
  bar; `muted-foreground` = secondary text. Surfaces: `background` (page),
  `card` (raised), `chat` (chat surface).
- **Rhythm:** dashed `border-border` section dividers; `·` list markers with
  dashed `border-b` rows; eyebrow label above blocks; serif section headings;
  card = `bg-card border border-border rounded-xl shadow-[0_1px_0_var(--border-soft)]`.
- **Registers:** one voice, two registers — *letter* (chat: larger, ink-stamp,
  playful) vs *reference* (cookbook / list: dense, quiet numerals). Both use the
  same tokens + atoms.

### 4. Align Chat + Cookbook

Refactor `RecipeLetter` and `RecipeDisplay` to consume the atoms. They're already
visually consistent after PR #276; this proves the guide holds and removes the
duplication.

### 5. Read-only audit of remaining surfaces

Inspect Conversations, RecipeList (cards + add modal), Inventory,
Recipe/CookingMode, Auth. Append a **per-surface gap checklist** to
`docs/design-system.md`: every arbitrary `text-[Npx]`, off-token color, off-rhythm
spacing. **No code changes** to these surfaces in this spec — each becomes its own
small follow-up PR, guided by the system.

---

## Phase 2 (separate, later)

Mirror the guide into a Claude Design catalog (claude.ai/design) via the
`/design-sync` skill + `DesignSync` tool: HTML preview cards for tokens (color
swatches, type scale) and components (ink-stamp step, quiet step, tip callout,
dotted list, eyebrow, section heading). Code is the source of truth; the catalog
mirrors it. Done after atoms stabilize.

---

## Verification

- Existing `RecipeLetter.test.tsx` + `RecipeDisplay.test.tsx` stay green.
- Add a `StepItem` test covering both `marker` variants.
- Playwright CLI screenshots of the chat recipe and cookbook page — confirm no
  visual regression after the atom refactor.
- `docs/progress.md` updated when shipped (per repo convention).

## Rollout

1. **Spec 1 (this doc):** atoms + token + `design-system.md` + align Chat/Cookbook
   + audit. One PR (or a couple).
2. **Per-surface alignment:** one small PR each for Conversations, RecipeList,
   Inventory, Recipe/CookingMode, Auth — guided by the audit checklist.
3. **Phase 2:** Claude Design catalog.
