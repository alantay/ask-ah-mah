# Design system — "Ask Ah Mah"

The written north star for every surface in the app. When something looks like it
_doesn't belong_, this is what we measure it against and tweak it toward — and
it's the brief a design agent (or a new contributor) reads before building a new
page.

The system is small on purpose: a handful of tokens, a set of styled primitives,
six recipe atoms, and one voice spoken in two registers. **Code is the source of
truth** — tokens live in [`src/app/globals.css`](../src/app/globals.css), recipe
atoms in
[`src/features/shared/components/recipe/`](../src/features/shared/components/recipe),
and the shadcn primitives in [`src/components/ui/`](../src/components/ui). This doc
explains the _why_ and the _when_.

A live, browsable copy of the foundations and components — every token as a
swatch, every primitive as a card — is synced to **claude.ai/design** (project
_Ask Ah Mah Design System_). Design there and you compose with the real parts.

This guide is organised the way a design system is meant to be read:

1. **[Principles](#1-principles)** — the rules that hold everything together.
2. **[Foundations](#2-foundations)** — tokens: type, colour, radius.
3. **[Components](#3-components)** — the parts you build with.
4. **[Patterns](#4-patterns)** — how the parts compose into surfaces, including a
   step-by-step _compose a new page_ walkthrough.

---

## 1. Principles

1. **Tokens and components before raw values.** Reach for a token (`text-emphasis`,
   `bg-primary`, `rounded-xl`) and a component before writing an arbitrary
   `text-[14px]` or `border-[oklch(...)]`. A raw value is drift waiting to happen —
   it's how the two recipe surfaces diverged in the first place. If you type the
   same pixel or colour a third time, it wants a name.
2. **Colour and size are _semantic_.** Pick by what it _means_, not how it looks:
   `jade` because it's a success, `text-emphasis` because it's body copy. Meaning
   survives a theme change; a hue doesn't.
3. **One voice, two registers.** The whole app speaks in a single voice rendered at
   two volumes — the chat "letter" and the cookbook "reference" (see
   [§4.1](#41-registers--one-voice-two-volumes)). Choosing a register is choosing
   the room, not redesigning the furniture. Never invent a third.
4. **Serif reads, sans frames, mono counts.** If a human reads it as a sentence
   it's serif; if it labels or frames content it's sans; if it's a number that
   wants to line up it's mono. The mismatch — body copy in sans, a UI label in
   serif — is exactly the "doesn't belong" smell.
5. **Code wins.** When this doc and `globals.css` / the components disagree, the
   code is right — fix the doc.

---

## 2. Foundations

Tokens are defined in `@theme` in `globals.css` and exposed to Tailwind as
utilities. Each foundation below has a live specimen card in the synced catalog.

### 2.1 Typefaces — three faces, three jobs

_Specimen: `Typefaces`._

| Face          | Token          | Family    | Used for                                                        |
| ------------- | -------------- | --------- | --------------------------------------------------------------- |
| **display**   | `font-display` | Fraunces  | All _content_ and _section headings_ — titles, bodies, prose, tips. The voice. |
| **sans**      | `font-sans`    | Inter     | Eyebrows, labels, pills, buttons, nav — _chrome_ only.          |
| **logo**      | `font-logo`    | Nunito    | The wordmark only — rounded and friendly. Not for UI copy.      |

Numerals use **`font-mono`** (the default monospace stack) so amounts, step
numbers and times align in a column — add `tabular-nums` when they sit in a
gutter. Don't set body copy in sans, and don't set a UI label in serif.

### 2.2 Type scale — named roles, not pixel guesses

_Specimen: `TypeScale`._ Font sizes for recurring roles are **named tokens**. Use
the role, never a raw `text-[Npx]`.

| Role         | Token            | Size / line-height | Where                                              |
| ------------ | ---------------- | ------------------ | -------------------------------------------------- |
| `eyebrow`    | `text-eyebrow`   | 10px / 1.4         | Uppercase section labels above blocks.             |
| `micro`      | `text-micro`     | 11px / 1.35        | Meta rows, counts — the smallest chrome.           |
| `dense`      | `text-dense`     | 13px / 1.4         | Quantities & cookbook markers (the _reference_ register). |
| `emphasis`   | `text-emphasis`  | 15px / 1.5         | Recipe body copy & ingredient names — the workhorse reading size. |
| `heading`    | `text-heading`   | 22px / 1.15        | Serif section headings baseline.                   |
| `display`    | `text-display`   | 40px / 1           | Hero / recipe titles.                              |

Two registers legitimately differ in size (see [§4.1](#41-registers--one-voice-two-volumes)).
For any _new_ role, add a token rather than a one-off.

### 2.3 Colour roles — what a colour _means_

_Specimen: `ColorTokens`._ All are `oklch()` tokens, exposed as `--color-*` and
adapted for dark mode. Pick by role, not by hue.

**Ink (text)**

| Role               | Token                   | Meaning                                          |
| ------------------ | ----------------------- | ------------------------------------------------ |
| `foreground`       | `text-foreground`       | Primary reading ink.                             |
| `muted-foreground` | `text-muted-foreground` | Secondary text — descriptions, italic asides.    |
| `ink-faint`        | `text-ink-faint`        | Quiet markers — `·` bullets, mono step numbers, eyebrows. |

**Accent & status**

| Role        | Token                         | Meaning                                                  |
| ----------- | ----------------------------- | -------------------------------------------------------- |
| `primary`   | `bg-primary` / `text-primary` | Actions, the brand terracotta, the step ink-stamp. Deepen with `primary-deep`, tint with `primary-tint`. |
| `jade`      | `text-jade`                   | "Have" / success — pantry hits, saved confirmation.      |
| `callout`   | `border-callout`              | Warm ochre — the tip / aside accent bar (`StepTip`).     |
| `destructive` / `danger` | `bg-destructive` | Irreversible or error actions — delete, clear.           |

**Surfaces**

| Role        | Token            | Meaning                                       |
| ----------- | ---------------- | --------------------------------------------- |
| `background`| `bg-background`  | The app paper. Carries the grain texture.     |
| `card`      | `bg-card`        | Raised content — recipe cards, stat tiles.    |
| `chat`      | `bg-chat`        | The chat panel — intentionally cleaner than the textured tray. |
| `popover`   | `bg-popover`     | Floating surfaces — select menus, dropdowns.  |

Never hand-write `oklch(…)` in a className. If a meaning isn't covered, add a
token — that's how `--callout` replaced a duplicated literal both recipe surfaces
were carrying.

### 2.4 Radius

_Specimen: `RadiusScale`._ All corners derive from a single `--radius` base
(`0.625rem`), so the whole UI rounds in proportion.

| Token         | Value          | Where                                  |
| ------------- | -------------- | -------------------------------------- |
| `rounded-sm`  | base − 4px     | Small chips, inner elements.           |
| `rounded-md`  | base − 2px     | Inputs, buttons, badges.               |
| `rounded-lg`  | base           | `cta` buttons, default panels.         |
| `rounded-xl`  | base + 4px     | Cards, dialogs, `ctaDeep` buttons.     |

---

## 3. Components

Two layers: the **recipe atoms** (the app's domain vocabulary) and the **core
primitives** (styled shadcn). Both consume the foundations above; new surfaces
should reach for these before hand-rolling markup.

### 3.1 Recipe atoms

Six shared primitives in `src/features/shared/components/recipe/`
(barrel-exported). Both recipe surfaces consume them.

- **`Eyebrow`** — uppercase sans section label; `tracking-[0.16em]`,
  `text-ink-faint` by default. `<Eyebrow>Servings</Eyebrow>`
- **`SectionHeading`** — serif `<h2>` for "What to gather", "Method", "Notes".
  Carries the `heading` voice; pass margins via `className` (heading is `m-0`).
- **`DottedList`** — prep / notes bullet list with a right-aligned `·` mono gutter,
  serif body, dashed dividers. `<DottedList items={prep} />`
- **`StepTip`** — Ah Mah's per-step aside: ochre (`border-callout`) left bar,
  italic, em-dash prefixed. Rendered automatically by `StepItem` from a step's `tip`.
- **`StepItem`** — one numbered step in either register. Wrapping element is
  configurable via `as`; extra props / `className` forward to it (so the cookbook
  renders diff-aware `<li>` rows through the _same_ atom the chat uses).
- **`StepList`** — a vertical run of `StepItem`s for the simple case (the chat
  letter). Surfaces that decorate each row map `StepItem` directly instead.

```tsx
<StepList steps={steps} marker="stamp" />   // chat letter
<StepItem as="li" marker="quiet" n={i + 1} step={step} />  // cookbook reference
```

### 3.2 Core primitives

shadcn/ui components, restyled with the app's tokens — the standard building
blocks for any non-recipe surface (forms, dialogs, navigation). All live in
`src/components/ui/`.

- **`Button`** — variants `default`, `secondary`, `outline`, `ghost`, `link`,
  `destructive`, plus the brand CTAs **`cta`** (page-level, `rounded-lg`, 1px
  paper-stamp shadow) and **`ctaDeep`** (modal/commit, `rounded-xl`, 2px). Sizes
  `sm` / `default` / `lg` / `icon`. Reach for `cta`/`ctaDeep` for primary actions.
- **`Badge`** — `default`, `secondary`, `outline`, `destructive`. Inline status /
  tags.
- **`Card`** + `CardHeader` / `CardTitle` / `CardDescription` / `CardAction` /
  `CardContent` / `CardFooter` — the raised content surface (`bg-card`, soft
  shadow, `rounded-xl`).
- **`Input`** — text field with token border/ring; `disabled` dims it.
- **`Label`** — form-field label; pair with an `Input` via `htmlFor`/`id`.
- **`Dialog`** + `DialogTrigger` / `DialogContent` / `DialogHeader` /
  `DialogTitle` / `DialogDescription` / `DialogClose` — modal over a dimmed
  overlay; title in Fraunces.
- **`Select`** + `SelectTrigger` / `SelectValue` / `SelectContent` / `SelectItem`
  (and group/label/separator) — single-choice dropdown.
- **`Tabs`** + `TabsList` / `TabsTrigger` / `TabsContent` — inline tabbed panels;
  the active tab connects to its panel (`bg-chat`, bordered).

```tsx
<Button variant="cta">Start cooking</Button>
<Card>
  <CardHeader>
    <CardTitle>Garlic prawn noodles</CardTitle>
    <CardDescription>Ready in 25 minutes · serves 2</CardDescription>
  </CardHeader>
  <CardContent>…</CardContent>
</Card>
```

---

## 4. Patterns

### 4.1 Registers — one voice, two volumes

The same tokens and atoms render in two registers. Choosing the register is
choosing the room, not redesigning the furniture.

| | **Letter** (chat) | **Reference** (cookbook / list) |
| --- | --- | --- |
| Feel | Playful, one recipe at a time, hand-delivered. | Dense, scannable, archival. |
| Step marker | Rotated terracotta **ink-stamp** badge. | Quiet mono **`1.`** in a gutter. |
| Body size | Larger (`text-base`). | Denser (`text-emphasis`/`dense`). |
| Surface | `bg-chat` (clean). | `bg-card` on textured `bg-background`. |
| Atom prop | `marker="stamp"` | `marker="quiet"` |

When a new surface is built, pick the register that matches its job.

### 4.2 Rhythm — the repeating texture

The same handful of moves give every surface the cookbook feel:

- **Dashed dividers** between rows: `border-b border-dashed border-border`
  (`last:border-none`). Quieter than a solid rule.
- **`·` list markers** in a fixed right-aligned mono gutter, not disc bullets.
- **Eyebrow → serif heading → content**, top to bottom. Label, title, body.
- **Card lift** — `bg-card border border-border rounded-xl` with the house soft
  shadow. Use it for every raised panel.
- **Generous section spacing** (e.g. `mb-9` between cookbook sections) so blocks
  breathe; tight `leading` _within_ a serif body so it reads as prose.

### 4.3 Compose a new page

A worked path from blank file to in-brand surface. Follow it in order:

1. **Pick the register** ([§4.1](#41-registers--one-voice-two-volumes)). Chat-like
   and conversational → _letter_ (`bg-chat`). Dense and archival → _reference_
   (`bg-card` on `bg-background`). This decides your surface token and step marker.
2. **Lay the surface.** Wrap the page in its register's background. Raised blocks
   become a `Card` (or the card-lift recipe from [§4.2](#42-rhythm--the-repeating-texture)).
3. **Open each block with an `Eyebrow`, then a `SectionHeading`.** Label → title →
   body is the house order. Space blocks with section margins.
4. **Set copy with the type scale** ([§2.2](#22-type-scale--named-roles-not-pixel-guesses)):
   body in `text-emphasis` serif, meta in `text-micro`/`dense`, hero in
   `text-display`. Never a raw `text-[Npx]`.
5. **Reach for components, not markup.** Lists → `DottedList`; numbered steps →
   `StepList` / `StepItem`; forms → `Label` + `Input` (+ `Select`); status →
   `Badge`; tabbed content → `Tabs`; confirmations → `Dialog`.
6. **Make the primary action a CTA.** `Button variant="cta"` for a page action,
   `ctaDeep` for a modal commit. Destructive actions use `variant="destructive"`.
7. **Colour by meaning** ([§2.3](#23-colour-roles--what-a-colour-means)):
   `text-foreground` to read, `muted-foreground` for asides, `jade` for success,
   `primary` for brand/action. No `oklch(…)` in a className.
8. **Audit against the principles** ([§1](#1-principles)). Any raw value, any
   off-register element, any serif label is a gap — close it by adding a token or
   reaching for the right component, not by inlining.

---

## Source of truth

Code is canonical. When this doc and `globals.css` / the components disagree, the
code wins — fix the doc. The synced catalog on claude.ai/design is generated from
that same code, so it stays in step.
