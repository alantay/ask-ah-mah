# CTA buttons sit on `--primary-deep`, not `--primary`

## Status

accepted

## Context

The page-level CTA (`Button` `cta`/`ctaDeep` variants — e.g. "Cook with what you have") rendered terracotta `--primary` (oklch L≈0.56) with a warm-cream `--primary-foreground`. The warm-on-warm pairing measured ~4.5:1 — a bare WCAG AA pass that read as muddy and hard to see in practice, especially for small semibold label text over the paper-grain texture.

The base `--primary` lightness caps the achievable contrast: even **pure white** on `--primary` only reaches ~4.95:1. There is no foreground value that makes the CTA comfortable while it sits on the base terracotta.

## Decision

CTA buttons render on **`--primary-deep`** (L≈0.46) with **white** text → ~7.4:1. The brand `--primary` token is left unchanged, so ink-stamps, pills, badges, and borders keep their existing terracotta. A new **`--primary-deeper`** token carries the "stamped paper" hard shadow, since the old shadow color (`--primary-deep`) would now be invisible against the button surface. `--primary-foreground` was also crispened to a de-warmed near-white (oklch 0.99 0.008 80), which lifts every other `bg-primary` + `text-primary-foreground` pairing (badges, avatar, selected pills) from 4.53 to ~4.81:1.

## Considered Options

- **Foreground only, keep `--primary`** — caps at 4.95:1; never comfortable.
- **Deepen the brand `--primary` token globally** — would shift every terracotta surface (stamps, pills, focus rings), a large unwanted visual change.

## Consequences

- A future reader may "simplify" the CTA back to `bg-primary` — that silently reintroduces the low-contrast bug. The CTA *must* stay on `--primary-deep`.
- `cta`/`ctaDeep` use literal `text-white` rather than `text-primary-foreground`, because in dark mode `--primary-foreground` is intentionally dark (it pairs with the lighter dark-mode `--primary`); white is correct on `--primary-deep` in both themes.
