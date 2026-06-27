# design-sync notes

State and corrections for future syncs of this repo to claude.ai/design.
Read this together with `config.json` before re-running the skill.

Target project: **Ask Ah Mah Design System**
`https://claude.ai/design/p/568a7eb2-48a6-432c-b9c3-5a07da4b2df1`

## This repo is off the converter's standard envelope

It's a **Next.js app**, not a packaged/published design system — no `dist/`,
no Storybook, no built package. The converter's default discovery (synth-from-all-src,
self-installed package) does not apply. The working path is:

- **Synth entry via a barrel.** `ds-entry.ts` at the repo root (gitignored) re-exports the
  carded components (recipe atoms, foundation specimens, and the Core 8 primitives **with
  all their compound parts**). It is passed as `cfg.entry` so the converter's PKG_DIR walk
  finds the repo's real `package.json` instead of looking for
  `node_modules/ask-ah-mah/package.json` (which doesn't exist). Without it the converter
  crashes with `ENOENT … ask-ah-mah/package.json`. `ds-entry.ts` is gitignored (it's a
  scratch synth artifact), so recreate it at the repo root before re-syncing from a clean
  clone:

  ```ts
  // recipe atoms
  export {
    Eyebrow, SectionHeading, DottedList, StepTip, StepItem, StepList,
  } from "@/features/shared/components/recipe";
  // shared brand motif
  export { Stamp } from "@/features/shared/components/Stamp";
  // foundation specimens
  export {
    ColorTokens, TypeScale, Typefaces, RadiusScale,
  } from "@/features/shared/components/design-system";
  // Core 8 primitives — export ALL compound parts (see compound note below)
  export { Button } from "@/components/ui/button";
  export { Badge } from "@/components/ui/badge";
  export { Input } from "@/components/ui/input";
  export { Label } from "@/components/ui/label";
  export {
    Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  } from "@/components/ui/card";
  export {
    Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter,
    DialogTitle, DialogDescription, DialogClose,
  } from "@/components/ui/dialog";
  export {
    Select, SelectGroup, SelectValue, SelectTrigger, SelectContent,
    SelectLabel, SelectItem, SelectSeparator,
  } from "@/components/ui/select";
  export {
    Tabs, TabsList, TabsTrigger, TabsContent,
  } from "@/components/ui/tabs";
  ```
- **Component set comes from `cfg.componentSrcMap`**, not from `export *`. Exporting all
  app src would pull in server/Prisma/Next code that can't be bundled. The map has **19
  entries** (1 shared + 6 recipe + 4 design-system + 8 ui); compound primitives map only their
  root (see the compound-component note under Scope).
- **CSS is compiled, not shipped.** Components are styled by Tailwind utilities; the repo
  ships no static stylesheet. `cfg.buildCmd` runs `@tailwindcss/cli` against
  `ds-tailwind-input.css` (which `@import`s `src/app/globals.css` + the component/preview
  sources via `@source` — globs now cover `recipe/*.tsx`, `design-system/*.tsx`, the single
  `shared/components/Stamp.tsx`, `src/components/ui/*.tsx`, and `.design-sync/previews/*.tsx`)
  to produce `cfg.cssEntry` →
  `.design-sync/.cache/ds-compiled.css`. That file is **gitignored** (lives under `.cache/`),
  so a fresh clone must re-run `buildCmd` before validating — it is not committed.

## Converter deps

Installed isolated under `.ds-sync/` (gitignored) with npm, NOT the app's pnpm:
`esbuild ts-morph @types/react @tailwindcss/cli@4.2.4 playwright` (+ chromium).
Re-run `node .ds-sync/package-build.mjs` / `resync.mjs` from there.

**`--node-modules` must point at the repo-root `./node_modules`, NOT
`.ds-sync/node_modules`.** The isolated `.ds-sync/node_modules` has only the
converter toolchain — it has no `react`/`react-dom`, so the build dies with
`react not found under --node-modules … vendorReact`. React lives in the app's
own (pnpm) `node_modules`. Full re-sync invocation:

```
node .ds-sync/node_modules/.bin/tailwindcss -i .design-sync/ds-tailwind-input.css -o .design-sync/.cache/ds-compiled.css   # 1. recompile CSS first (cssEntry is gitignored)
node .ds-sync/resync.mjs --config .design-sync/config.json --node-modules ./node_modules --out ./ds-bundle --remote <anchor.json>
```

The `--remote <anchor.json>` is the project's `_ds_sync.json` fetched via
`DesignSync(get_file)` and written to a local file — it's what lets the diff
skip unchanged components.

## Known warnings (non-blocking — do not chase)

- **`[TOKENS_MISSING]` — a few `--radix-*` runtime custom properties** (3 missing, below
  the validator threshold). Injected at runtime by Radix primitives (Select/Dialog/Tabs now
  use Radix); they're correctly absent from the static stylesheets. Expected. No
  `cfg.tokensPkg`/`provider` needed.
- **`[FONT_REMOTE]` — Inter / Fraunces / Nunito / Cambria.** The bundle pulls these from
  Google Fonts via an `@import` in `ds-tailwind-input.css` (the app uses `next/font/google`,
  which has no static font files to copy). The remote host serves them at runtime. Expected.

## Scope

**19 components across four groups** (was six recipe atoms — expanded into a full
design system in #285's follow-up so the design agent can compose whole new pages):

- **`shared` (1)** — Stamp. The kopitiam ink-stamp "chop" frame, factored out of StepItem
  so the first-run chat hero and the step badges share one motif. Source:
  `src/features/shared/components/Stamp.tsx` (note: a bare `.tsx` directly under
  `components/`, not in a sub-group dir — see the group-derivation note below).
- **`recipe` (6)** — Eyebrow, SectionHeading, DottedList, StepTip, StepItem, StepList.
  The original drift-prone atoms. Source: `src/features/shared/components/recipe/`.
- **`design-system` (4)** — ColorTokens, TypeScale, Typefaces, RadiusScale. **Foundation
  specimen cards**: pure showcase components that render the token values themselves
  (color swatches, the named type scale, the three typefaces, the radius tiles). They
  exist *because the converter has no component-less card path* — a browsable card REQUIRES
  a real bundled component, so foundations are shipped as tiny showcase components built
  with inline `style={{ ...: "var(--token)" }}`. Source:
  `src/features/shared/components/design-system/` (+ `index.ts` barrel).
- **`general` (8)** — Button, Badge, Input, Label, Card, Dialog, Select, Tabs. The Core 8
  shadcn primitives. Source: `src/components/ui/<name>.tsx`.

All preview cells graded `good` on the absolute rubric (no Storybook reference). Previews
are hand-authored under `.design-sync/previews/*.tsx` from real usage. Verified 19/19 render
correctly: Dialog renders as a centred modal over the dimmed overlay (portal works headless),
Select shows its resting trigger (`defaultValue`), Tabs/Card/Badge/Input/Label all inline,
Stamp renders both tones (terracotta chop + cream tile) tilted with the inner mark upright.

### Why the primitives land in group "general", and Stamp in "shared"

Group is derived from the source path: the last `src/`-relative segment that isn't the
component's own dir or a member of `GENERIC_DIR` (`components, component, src, lib, ui,
packages, react`). For `src/components/ui/button.tsx` both `components` and `ui` are
generic, so it falls through to `'general'`. There is **no config-only group override** —
only path-derivation or a JSDoc `@category` tag on the component. We deliberately did NOT
rename the group (would mean adding `@category` to 8 app files, coupling app code to the
sync tool and forcing re-verification). To rename later: add `/** @category primitives */`
above each primitive's exported function, or move them to a non-generic dir.

**Stamp lands in group `shared`** for the same reason, but note the precedence: `@category`
is only a *fallback* used when path-derivation yields nothing. For
`src/features/shared/components/Stamp.tsx` the segment `shared` is non-generic and wins, so
a `@category` tag on Stamp would NOT move it — path beats JSDoc. To reach a different group
you'd move the file into a sub-group dir (e.g. `…/components/recipe/`) or a generic-only
path. `shared` (a one-member group) is a sensible, zero-coupling home, so it was left as-is.

### Compound components: card the root, export the parts

shadcn ships compound primitives as *flat* subcomponent exports (`CardHeader`,
`DialogContent`, `SelectTrigger`, `TabsList`, …). `partitionSubcomponents` only nests them
under a root when a `compounds` map (from `export * as X` namespace exports) groups them —
flat exports don't trigger it. So the pattern is:

- **`ds-entry.ts` exports ALL parts** (root + every subcomponent) → all bundled to
  `window.AskAhMah.*` so previews can compose the full primitive.
- **`cfg.componentSrcMap` maps only the ROOT** (Card, Dialog, Select, Tabs) → one card per
  primitive, not one per subcomponent. componentSrcMap is authoritative for the card list;
  the extra part exports get bundled but aren't carded.

Net: **19 cards, ~41 window exports.**

## Re-sync risks

- If `globals.css` token names change (e.g. the `--text-eyebrow/micro/dense/emphasis`
  scale or `--ink-faint`/`--callout`/`--primary-deep`), recompile and re-verify — the
  atoms reference them directly.
- New atoms must be added to BOTH `ds-entry.ts` and `cfg.componentSrcMap`, plus a preview
  under `.design-sync/previews/` (the `@source` glob already covers that dir). **Also confirm
  the component's own source is covered by an `@source` line in `ds-tailwind-input.css`** —
  the preview glob only scans the preview file, not the component, so a component outside the
  `recipe/*.tsx` / `design-system/*.tsx` / `ui/*.tsx` globs (as Stamp was) needs its own
  `@source` entry or its utility classes are dropped from the compiled CSS and it renders
  unstyled.
- `_ds_sync.json` is the anchor; an unchanged component is skipped on re-sync. If the
  Tailwind compile output drifts, the styleSha changes and everything re-verifies — correct.
