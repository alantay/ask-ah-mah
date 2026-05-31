# Design System — Kopitiam Modern

The visual language for **Ask Ah Mah**. Old paper + terracotta + jade + butter; small editorial labels; stamped-paper CTAs. This file is the contract — read it before adding a new colour, font size, or branded button.

All tokens live in `src/app/globals.css` (`@theme inline` + `:root` / `.dark`). Everything renders through Tailwind utilities or `var(--token)` references — never raw values.

---

## Tokens

### Colour

| Token | Light | Used for |
|---|---|---|
| `--background` | aged newsprint | Page shell |
| `--foreground` | soy ink | Body text |
| `--card` | cream paper | Cards inside trays — lighter than bg so they pop |
| `--chat` | lightest cream | Chat scroll surface only — kept crisp |
| `--muted` | kraft tray | Pantry / cookbook tray surfaces |
| `--muted-foreground` | pencil | Secondary text |
| `--ink-faint` | faint pencil | Tertiary / eyebrow text |
| `--primary` | terracotta | Brand primary, CTAs |
| `--primary-deep` | deeper terracotta | Hard-shadow underbite on CTAs, step-stamp insets |
| `--primary-tint` | pale terracotta | Picked-state card backgrounds |
| `--secondary` | butter | User message bubbles, active conversation row |
| `--secondary-deep` | deeper butter | Borders/edges on butter surfaces |
| `--jade` | jade | Decorative accent ink — chips, dots, "all set" pills |
| `--tertiary` | warm amber | Tag colour family, short-shelf dots |
| `--accent` | kraft tone | Neutral interactive hover surface |
| `--border` / `--border-soft` | stained paper edge | Borders, separators |
| `--destructive` | red | Errors, "missing" warnings |

Dark mode tokens exist as `oklch()` shifts of the same semantic roles in `.dark`. **Pick a semantic token, not a literal colour.**

### Type scale

| Token | Size | Used for |
|---|---|---|
| `text-eyebrow` | 10px | All-caps tracking labels ("WHAT AH MAH SEES") |
| `text-micro` | 11px | Micro chips, counter labels |
| `text-xs` (Tailwind) | 12px | Captions, metadata |
| `text-dense` | 13px | Dense body — pantry rows, sidebar items |
| `text-sm` (Tailwind) | 14px | Body |
| `text-emphasis` | 15px | Emphasis body |
| `text-base` (Tailwind) | 16px | Larger body |
| `text-lg` (Tailwind) | 18px | Subhead |
| `text-xl` (Tailwind) | 20px | Subhead lg |
| `text-heading` | 22px | Section headings |
| `text-2xl` (Tailwind) | 24px | Card title |
| `text-display` | 40px | Page hero — Fraunces italic |

Display font is **Fraunces italic** for headings; **Nunito** for body; **Geist Mono** for tabular numbers and timer chips.

### Shadows

| Token | Use |
|---|---|
| `shadow-cta` | Primary action — `0 1px 0 var(--primary-deep)` |
| `shadow-cta-deep` | Modal commits, persistent cooking actions — `0 2px 0 var(--primary-deep)` |

### Surface

| Utility | Use |
|---|---|
| `.paper` | Multiply-blended noise + fiber texture on tray surfaces (sidebar, pantry, cookbook). **Not** on the chat reading surface. |

---

## Components

### `<Button>` variants (`src/components/ui/button.tsx`)

Default shadcn variants are present (`default`, `outline`, `ghost`, `secondary`, `destructive`, `link`). Two Kopitiam-specific variants on top:

- **`cta`** — page-level terracotta action (rounded-lg, 1px shadow). Pantry "Add", cookbook "Add recipe", chat "Start cooking".
- **`ctaDeep`** — modal commit / cooking-mode action (rounded-xl, 2px shadow). "Save to cookbook", "Next step".

Size and padding are still overridden via `className` — the variant only owns colour, border, shadow, hover. **Don't reinvent the CTA in raw `<button>` tags.**

---

## Rules

These three are the load-bearing contract. Breaking any of them reintroduces the drift the audit was set up to fix.

1. **No arbitrary `text-[Npx]`.** Use the scale above. If a size is genuinely missing, add a named token and a row to this table — don't sprinkle `text-[12.5px]`. Half-pixel sizes are always wrong.
2. **No inline `oklch()`.** Use semantic colour tokens (`text-primary-deep`, `bg-secondary-deep`, etc.) or reference `var(--token)` directly in arbitrary-property syntax (`shadow-[0_1px_0_var(--primary-deep)]`). Decorative one-off gradients are the only exception, and they should be commented.
3. **Branded CTAs go through `<Button variant="cta">` or `<Button variant="ctaDeep">`.** Never hand-roll `bg-primary border-primary shadow-[0_1px_0_...]` in features.

A fourth, softer rule: **prefer Tailwind utility tokens to inline CSS.** Tokens compose cleanly with state variants (`hover:`, `dark:`, `disabled:`); inline values don't.

---

## Adding a new token

1. Add the CSS variable in `:root` (and `.dark` if it differs).
2. If it's a colour, map `--color-<name>: var(--<name>)` inside `@theme inline` so Tailwind generates `bg-<name>` / `text-<name>` / `border-<name>` utilities.
3. Update the table above.
4. Reach for an existing token first. If three components are already using a hardcoded colour, that's the signal to tokenise — not earlier.

If you find yourself naming a token after a component (`--add-recipe-modal-warning-bg`), stop. Tokens are semantic (warning / accent-amber / destructive-bg), not contextual.
