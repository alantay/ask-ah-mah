# Design system — "Ask Ah Mah"

The written north star. When a surface looks like it _doesn't belong_, this is
what we measure it against and tweak it toward.

The system is small on purpose: a handful of tokens, six shared atoms, and one
voice spoken in two registers. Code is the source of truth — tokens live in
[`src/app/globals.css`](../src/app/globals.css), atoms in
[`src/features/shared/components/recipe/`](../src/features/shared/components/recipe).
This doc explains the _why_ and the _when_ so the pieces are used consistently.

> **One rule above all:** reach for a **token** and an **atom** before writing a
> raw value. An arbitrary `text-[14px]` or `border-[oklch(...)]` is drift waiting
> to happen — it's how the two recipe surfaces diverged in the first place.

---

## 1. Voice — three typefaces, three jobs

Ah Mah's handwriting is a serif. The chrome around it is a clean sans. Numbers
are mono so they line up like a recipe card.

| Family               | Token          | Used for                                                        |
| -------------------- | -------------- | --------------------------------------------------------------- |
| **Serif** (display)  | `font-display` | All _content_ and _section headings_ — titles, bodies, prose, tips. The voice. |
| **Sans**             | `font-sans`    | Eyebrows, labels, pills, buttons, nav — _chrome_ only.          |
| **Mono**             | `font-mono`    | Numerals — amounts, step numbers, list markers, times.          |

Rules of thumb:

- If a human _reads it as a sentence_, it's serif.
- If it _labels_ or _frames_ content (an eyebrow, a button, a tag), it's sans.
- If it's a _number_ that wants to align in a column, it's mono + `tabular-nums`.

Don't set body copy in sans, and don't set a UI label in serif — the mismatch is
exactly the "doesn't belong" smell.

---

## 2. Type scale — named roles, not pixel guesses

Font sizes for recurring roles are **named tokens** in `@theme` (see
`globals.css`). Use the role, never a raw `text-[Npx]` for these.

| Role         | Token            | Size / line-height | Where                                              |
| ------------ | ---------------- | ------------------ | -------------------------------------------------- |
| `eyebrow`    | `text-eyebrow`   | 10px / 1.4         | Uppercase section labels above blocks.             |
| `micro`      | `text-micro`     | 11px / 1.35        | Back-link, the smallest chrome.                    |
| `dense`      | `text-dense`     | 13px / 1.4         | Cookbook numerals & markers (the _reference_ register). |
| `emphasis`   | `text-emphasis`  | 15px / 1.5         | Recipe body copy — the workhorse reading size.     |
| `heading`    | `text-heading`   | 22px / 1.15        | Serif section headings baseline.                   |
| `display`    | `text-display`   | 40px / 1           | Hero / recipe titles.                              |

Two registers legitimately differ in size (see §5) — that's why a couple of
atoms still carry tuned `text-[…]` internals. But for any _new_ role, add a token
rather than a one-off. If you're typing a pixel size for the third time, it wants
a name.

---

## 3. Color roles — what a color _means_

Colors are semantic. Pick by role, not by hue. All are `oklch()` tokens in
`globals.css`, exposed to Tailwind as `--color-*` and adapted for dark mode.

**Ink (text)**

| Role             | Token                   | Meaning                                          |
| ---------------- | ----------------------- | ------------------------------------------------ |
| `foreground`     | `text-foreground`       | Primary reading ink.                             |
| `muted-foreground` | `text-muted-foreground` | Secondary text — descriptions, italic asides.  |
| `ink-faint`      | `text-ink-faint`        | Quiet markers — `·` bullets, mono step numbers, eyebrows. |

**Accent & status**

| Role        | Token                | Meaning                                                  |
| ----------- | -------------------- | -------------------------------------------------------- |
| `primary`   | `bg-primary` / `text-primary` | Actions, the brand terracotta, the step ink-stamp. Deepen with `primary-deep`, tint with `primary-tint`. |
| `jade`      | `text-jade`          | "Have" / success — pantry hits, saved confirmation.      |
| `callout`   | `border-callout`     | Warm ochre — the tip / aside accent bar (`StepTip`).     |

**Surfaces**

| Role        | Token            | Meaning                                       |
| ----------- | ---------------- | --------------------------------------------- |
| `background`| `bg-background`  | The app paper. Carries the grain texture.     |
| `card`      | `bg-card`        | Raised content — recipe cards, stat tiles.    |
| `chat`      | `bg-chat`        | The chat panel — intentionally cleaner than the textured tray. |

Never hand-write `oklch(…)` in a className. If a meaning isn't covered, add a
token — that's how `--callout` replaced the duplicated `oklch(0.65 0.10 60)`
literal both recipe surfaces were carrying.

---

## 4. Rhythm — the repeating texture

The same handful of moves give every surface the cookbook feel:

- **Dashed dividers** between rows: `border-b border-dashed border-border`
  (`last:border-none`). Quieter than a solid rule — it reads as a recipe card.
- **`·` list markers** in a fixed right-aligned mono gutter, not disc bullets.
- **Eyebrow above a block**, then a serif heading, then content. Label → title →
  body, top to bottom.
- **Card** = `bg-card border border-border rounded-xl shadow-[0_1px_0_var(--border-soft)]`.
  The 1px bottom shadow is the house "lift". Use it for every raised panel.
- **Generous section spacing** (`mb-9` between cookbook sections) so blocks
  breathe; tight `leading` _within_ a serif body so it reads as prose.

---

## 5. Registers — one voice, two volumes

The same tokens and atoms render in two registers. Choosing the register is
choosing the room, not redesigning the furniture.

| | **Letter** (chat) | **Reference** (cookbook / list) |
| --- | --- | --- |
| Feel | Playful, one recipe at a time, hand-delivered. | Dense, scannable, archival. |
| Step marker | Rotated terracotta **ink-stamp** badge. | Quiet mono **`1.`** in a gutter. |
| Body size | Larger (`text-base`). | Denser (`text-emphasis`/`dense`). |
| Surface | `bg-chat` (clean). | `bg-card` on textured `bg-background`. |
| Atom prop | `marker="stamp"` | `marker="quiet"` |

Both pull from the same tokens (§1–4) and the same atoms (§6). When a new surface
is built, pick the register that matches its job — don't invent a third.

---

## 6. The atoms

Six shared primitives in `src/features/shared/components/recipe/`
(barrel-exported). Both recipe surfaces consume them; new surfaces should too.

### `Eyebrow`
Uppercase sans section label — canonical `tracking-[0.16em]`, `text-ink-faint` by
default. Override color/spacing via `className`.

```tsx
<Eyebrow>Servings</Eyebrow>
<Eyebrow className="text-muted-foreground block mb-2">Before you start</Eyebrow>
```

### `SectionHeading`
Serif `<h2>` for "What to gather", "Method", "Notes". Carries the `heading`
voice; pass margins via `className` (the heading itself is `m-0`).

```tsx
<SectionHeading className="mb-4">Method</SectionHeading>
```

### `DottedList`
The prep / notes bullet list — right-aligned `·` mono gutter, serif body, dashed
dividers. Pass plain strings.

```tsx
<DottedList items={prep} />
```

### `StepTip`
Ah Mah's per-step aside: an ochre (`border-callout`) left bar, italic, em-dash
prefixed. Rendered automatically by `StepItem` when a step has a `tip`.

```tsx
<StepTip>{step.tip}</StepTip>   // → "— don't let it brown"
```

### `StepItem`
One numbered step in either register. The wrapping element is configurable via
`as`, and extra props / `className` are forwarded to it — so the cookbook renders
diff-aware `<li>` rows (`data-tweak-row`, highlight classes) through the _same_
atom the chat uses.

```tsx
// chat letter
<StepItem n={1} step={step} marker="stamp" />

// cookbook reference, carrying diff-overlay attributes
<StepItem
  as="li"
  marker="quiet"
  n={i + 1}
  step={step}
  data-tweak-row={`step-${i}`}
  className={cn("transition-colors", isChanged && "…highlight…")}
/>
```

### `StepList`
A vertical run of `StepItem`s for the simple case (the chat letter, which has no
per-step decoration). Surfaces that need to decorate each row — e.g. the
cookbook's diff overlay — should map `StepItem` directly instead.

```tsx
<StepList steps={steps} marker="stamp" />
```

---

## Using this guide

- **Building a new surface?** Pick a register (§5), compose from tokens (§1–4)
  and atoms (§6). If something's missing, add a token or an atom — don't inline a
  raw value.
- **Aligning an existing surface?** Audit it against §1–5 and list the gaps. The
  per-surface alignment work (Conversations, RecipeList, Inventory, CookingMode,
  Auth) is exactly this: tweak each page until it belongs.
- **Source of truth is code.** When this doc and `globals.css` / the atoms
  disagree, the code wins — fix the doc.

---

## Surface audit

A read-only audit (issue #279) of the five non-recipe surfaces against §1–6.
Each gap below is a concrete deviation with a file reference; each becomes a
follow-up alignment issue (#280–#284). No code changed here.

Legend: **px** = arbitrary `text-[Npx]` that maps to a scale role (§2); **color**
= off-token / inline `oklch()` (§3); **rhythm** = off-pattern spacing or
ad-hoc card/border (§4); **atom** = hand-rolled where a shared atom exists (§6);
**voice** = wrong typeface for the role (§1).

### Conversations (#280) — history sidebar

Closest to aligned already; rows are serif and use sibling card tokens.

- **px** — `Conversations.tsx:37` rail heading `text-[22px]` → `text-heading` (exact 22px).
- **scale** — `ConversationItem.tsx:66,80` row titles use Tailwind `text-sm` (14px), which has no named role; `dense` (13) / `emphasis` (15) bracket it. Decide a role for sidebar rows and apply it consistently.
- ✓ Good: active row `bg-secondary border-secondary-deep shadow-[0_1px_0_var(--secondary-deep)]` is a clean token sibling of the house card lift; `font-display` titles honour the voice.

### RecipeList (#281) — cards + add-recipe modal

- **atom + px + color** — page eyebrow `RecipeList.tsx:88` `text-[11px] … tracking-[0.18em] text-muted-foreground` deviates three ways from `Eyebrow` (10px, `tracking-[0.16em]`, `text-ink-faint`) → replace with `<Eyebrow>`.
- **px** — page title `:91` `text-[40px]` → `text-display`; `:210` `text-[22px]` → `text-heading`; bodies `:94` `text-[15px]` → `text-emphasis`, `:174` `text-[14px]` (off-scale), `:221` `text-[13px]` → `text-dense`, `:227` `text-[12px]` (off-scale); controls `:114,135,143` `text-[13px]` → `text-dense`; badge `:121` `text-[9px]` (below scale); `:114,143` `py-[7px]` ad-hoc padding.
- **RecipeSidebar.tsx** — chrome on `text-xs` / `text-[11px]` / `text-[12px]` (`:85,133,214,222,269`) off-scale; `text-muted-foreground/60` opacity-modified token (`:198`). ✓ `tracking-[0.16em]` (`:198`) is canonical.
- **RecipeCard.tsx** — already a good partial model (`text-eyebrow`, `text-dense`, `text-ink-faint`). Remaining: `:94,105` `text-[11px]` → `text-micro`; `:64` eyebrow uses `tracking-widest` not canonical `tracking-[0.16em]`; `:30` card layers an inline elevation `oklch(0.3_0.05_50/0.5)` shadow on top of the house lift — consider a tokenised `--shadow-card` elevation.
- **AddRecipeModal.tsx** — heading `:256` `text-[20px] sm:text-[22px]` → `text-heading`; bodies `:242` `text-[15px]`, `:259` `text-[13px]`, `:312` `text-[12px]`; **color**: error state hard-codes a danger hue inline — `:300` `border-[oklch(0.78_0.10_27)] ring-[oklch(0.78_0.10_27)/0.12]`, `:308` `bg-[oklch(0.97_0.04_27)] border-[oklch(0.85_0.08_27)]`, `:309` `bg-[oklch(0.52_0.16_27)]`. There is **no danger token** — add a `--danger` / `--danger-tint` family to `globals.css`.

### Inventory (#282) — pantry UI

Duplicates RecipeList's page-header pattern, so it inherits the same gaps.

- **atom + px + color** — `Inventory.tsx:271` eyebrow `text-[11px] tracking-[0.18em] text-muted-foreground` → `<Eyebrow>` (same three-way deviation as RecipeList).
- **px** — title `:274` `text-[40px]` → `text-display`; body `:277` `text-[15px]` → `text-emphasis`; buttons `:289,299,310` `text-[13px]` → `text-dense`; qty `:54` `text-[11px]` (mono) → `text-micro`; italic notes `:346,414,420,426,467` `text-[14px]` (off-scale) and `:366` `text-[13px]` → `text-dense`.
- **cross-surface** — the `Inventory` and `RecipeList` page headers (eyebrow → 40px display title → italic subtitle + action row) are the same composition built twice. Candidate for a shared `PageHeader` atom once both adopt the tokens.

### Recipe — cooking mode + servings stepper (#283)

- **color** — `CookingMode.tsx:120` step tip `border-[oklch(0.65_0.10_60)]` → `border-callout` (this is a larger-register `StepTip`; extend the atom or at least use the token).
- **color** — `:152` "done" button `bg-jade border-[oklch(0.35_0.10_168)] shadow-[0_2px_0_oklch(0.35_0.10_168)]` hard-codes a *jade-deep* that doesn't exist as a token. Add `--jade-deep` (sibling to `--primary-deep`).
- **px** — `:115` body `text-[1.25rem]` (20px) off-scale; `:83` `text-[11px]` → `text-micro`. `ServingsStepper.tsx:27` `text-[15px]` → `text-emphasis`.

### Auth — login (#284)

- **color** — `SignInDialog.tsx:31` trigger `shadow-[0_1px_0_oklch(0.82_0.04_70)]` hard-codes the card lift → use `shadow-[0_1px_0_var(--border-soft)]` (the canonical lift both recipe surfaces share). Also `text-xs` off-scale.
- **voice** — `DialogTitle` ("Welcome to Ah Mah's kitchen") and `DialogDescription` render through shadcn defaults (sans). Ah Mah's headings are serif (§1) — apply `font-display` to the title so the login speaks in her voice.
- ✓ `AuthButton.tsx` carries no arbitrary px / color.

### Cross-cutting follow-ups (tokens to add)

These recur across surfaces and should land as token additions when the
relevant alignment issue is picked up:

- `--danger` / `--danger-tint` — error/validation hue (AddRecipeModal).
- `--jade-deep` — the "success" deep edge/shadow (CookingMode done button).
- A named `--shadow-card` elevation for raised cards (RecipeCard layers it inline).
- A shared `PageHeader` atom for the Inventory/RecipeList header composition.
