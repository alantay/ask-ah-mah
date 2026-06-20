# design-sync notes

State and corrections for future syncs of this repo to claude.ai/design.
Read this together with `config.json` before re-running the skill.

Target project: **Ask Ah Mah Design System**
`https://claude.ai/design/p/568a7eb2-48a6-432c-b9c3-5a07da4b2df1`

## This repo is off the converter's standard envelope

It's a **Next.js app**, not a packaged/published design system — no `dist/`,
no Storybook, no built package. The converter's default discovery (synth-from-all-src,
self-installed package) does not apply. The working path is:

- **Synth entry via a barrel.** `ds-entry.ts` at the repo root (gitignored) re-exports
  only the six shared recipe atoms from `@/features/shared/components/recipe`. It is passed
  as `cfg.entry` so the converter's PKG_DIR walk finds the repo's real `package.json`
  instead of looking for `node_modules/ask-ah-mah/package.json` (which doesn't exist).
  Without it the converter crashes with `ENOENT … ask-ah-mah/package.json`.
  `ds-entry.ts` is gitignored (it's a scratch synth artifact), so recreate it at the repo
  root before re-syncing from a clean clone:

  ```ts
  export {
    Eyebrow, SectionHeading, DottedList, StepTip, StepItem, StepList,
  } from "@/features/shared/components/recipe";
  ```
- **Component set comes from `cfg.componentSrcMap`**, not from `export *`. Exporting all
  app src would pull in server/Prisma/Next code that can't be bundled.
- **CSS is compiled, not shipped.** The atoms are styled by Tailwind utilities; the repo
  ships no static stylesheet. `cfg.buildCmd` runs `@tailwindcss/cli` against
  `ds-tailwind-input.css` (which `@import`s `src/app/globals.css` + the atom/preview
  sources via `@source`) to produce `cfg.cssEntry` →
  `.design-sync/.cache/ds-compiled.css`. That file is **gitignored** (lives under `.cache/`),
  so a fresh clone must re-run `buildCmd` before validating — it is not committed.

## Converter deps

Installed isolated under `.ds-sync/` (gitignored) with npm, NOT the app's pnpm:
`esbuild ts-morph @types/react @tailwindcss/cli@4.2.4 playwright` (+ chromium).
Re-run `node .ds-sync/package-build.mjs` / `resync.mjs` from there.

## Known warnings (non-blocking — do not chase)

- **`[TOKENS_MISSING]` — 7 `--radix-*` custom properties.** (`--radix-select-*`,
  `--radix-dropdown-menu-*`, `--radix-popover-*`.) These are injected at runtime by
  Radix primitives; the six atoms don't use Radix, so they are correctly absent from the
  shipped stylesheets. Expected. No `cfg.tokensPkg`/`provider` needed.
- **`[FONT_REMOTE]` — Inter / Fraunces / Nunito.** The bundle pulls these from Google Fonts
  via an `@import` in `ds-tailwind-input.css` (the app uses `next/font/google`, which has no
  static font files to copy). The remote host serves them at runtime. Expected.

## Scope

Six recipe atoms only: Eyebrow, SectionHeading, DottedList, StepTip, StepItem, StepList.
All 16 preview cells graded `good` on the absolute rubric (no Storybook reference).
Previews are hand-authored under `.design-sync/previews/*.tsx` from real recipe usage.

## Re-sync risks

- If `globals.css` token names change (e.g. the `--text-eyebrow/micro/dense/emphasis`
  scale or `--ink-faint`/`--callout`/`--primary-deep`), recompile and re-verify — the
  atoms reference them directly.
- New atoms must be added to BOTH `ds-entry.ts` and `cfg.componentSrcMap`, plus a preview
  under `.design-sync/previews/` and the `@source` glob already covers that dir.
- `_ds_sync.json` is the anchor; an unchanged component is skipped on re-sync. If the
  Tailwind compile output drifts, the styleSha changes and everything re-verifies — correct.
