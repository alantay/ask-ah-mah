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
