# Technique Helpers — Implementation Spec

> **Handoff-ready spec.** Every product and technical decision below is settled. An
> implementer can build the feature from this document without re-deciding. It was
> assembled by the [Wayfinder: Technique helpers spec](https://github.com/alantay/ask-ah-mah/issues/445)
> effort; each section links the ticket that resolved it, where the full reasoning lives.
>
> This spec produces **no code and no final image assets** — it is the plan the execution
> effort follows. Deferred ADRs and a CONTEXT.md glossary term (noted at the end) are
> written *during* execution, not here.

---

## 1. What this is

For certain cooking steps, offer a small, optional visual aid that teaches the **general
technique** — how to dice, mince, beat an egg, smash garlic — rather than replaying that
recipe's specific step. The visual is technique-level and reusable across every recipe.
Origin: [Visual technique helpers for cooking steps](https://github.com/alantay/ask-ah-mah/issues/444).

A helper is an ordered strip of hand-drawn panels, each with a plain-language caption,
shown folded-by-default beneath the step. It is an aid the user can ignore — available,
never pushed.

---

## 2. Scope

**In scope (this feature):** the tight-6 starter technique set, the manifest that holds
them, the step-tagging that earns a helper, and the folded strip UI in both chat and
cookbook registers.

**Out of scope (ruled out by the map):**

- **Video** — format is images. The pedagogical payoff is a *state* (how small a mince,
  what soft peaks look like), best shown as a still.
- **Live per-user fetch or generation** — assets are produced once and self-hosted.
- **Building the feature / producing final assets** — that is the execution effort this
  spec feeds.

**In scope but deferred (library-growth fog, not the starter build):** heat / doneness-state
helpers (sear colour, caramel stage, blanch-and-shock), library growth beyond the starter
set, and backfilling tags onto legacy recipes. Revisit once the starter set is proven.

---

## 3. The starter technique set

Resolved in [Define the starter technique set](https://github.com/alantay/ask-ah-mah/issues/446).

### Selection bar — a step earns a helper only when **all** hold

1. **Visual** — the success state is something you *see* (a size, texture, or motion) that
   words can't pin down.
2. **Genuinely needed** — a beginner would freeze without it. Never the obvious
   ("slice the bread"). *Not every step gets one.*
3. **Prep-bench (pre-heat)** — knife work and prep motions done *before* cooking. Prep is
   dish-agnostic ("a mince is a mince in any recipe"), so one generic still teaches reliably.

Heat / doneness states fail bar 3 (dish-contextual — pan, cut, and stove all vary) and are
deferred to fog.

### The tight-6 starter list

Each technique is **one canonical slug**; a step points at a slug (see §6). Agnostic motions
use a **bare verb**; genuinely ingredient-specific prep uses **verb+object**.

| Slug | Teaches |
| --- | --- |
| `dice` | uniform cubes; *how big* |
| `mince` | *how fine* |
| `beat-egg` | whole egg, until uniform |
| `whisk-to-peaks` | soft vs stiff peaks (the canonical "words fail" case) |
| `smash-garlic` | flat blade, then peel |
| `prep-spring-onion` | trim roots, separate white/green, slice on the bias |

Membership grows later (library-growth fog). The keying mirrors the app's existing
universal-shared-corpus pattern: **Market/Storage Tips are keyed by canonical item name →
technique helpers are keyed by canonical technique slug.** One asset per slug, assembled
once, served statically.

---

## 4. Image source and production

Resolved in [Choose the image source](https://github.com/alantay/ask-ah-mah/issues/447).

- **Source — AI-generated, authored once at build time. Stock is out entirely (not a mix).**
  At ~6 techniques × ~4 panels ≈ **24 panels**, volume isn't the driver — consistency, brand,
  and accuracy are. Real-hands stock fractures the warm hand-drawn house style and drags in
  licensing/person-release caveats; its one edge (an accurate grip) clashes hardest with the
  illustrated look.

- **Accuracy containment — the two-lock rule.** Generative models draw six-fingered hands and
  unsafe grips; for a *technique* helper that teaches something wrong, that is not cosmetic.
  AI is acceptable **only** under both locks:
  1. **Deliberately stylized, low-fidelity house style** — the warm hand-drawn look *is* the
     mitigation; low fidelity forgives anatomy a photo would expose. Style choice and accuracy
     choice are the same choice.
  2. **Mandatory blocking human-review gate** — every panel is eyeballed and signed off before
     entering the corpus. No spot-checks, no exceptions. Affordable **only because** the set is
     produce-once and finite (~24 panels). If the produce-once invariant is ever lost, revisit.

- **Delivery — hand-placed static assets, manually uploaded.** Manual upload *is* the
  produce-once invariant in action and the natural home of the review gate: you only upload a
  panel you've signed off. In the manifest model (§7) this gate is realized as a **PR review**.

- **Stuck-panel escape hatch** — if AI can't produce a panel that passes the gate after
  repeated regeneration, **commission that single panel from a human illustrator in the same
  house style — never stock.** Free under manual upload: the app can't tell who drew a static
  PNG, so a commissioned panel ships through the identical path.

Asset-production detail (filename, format, dimensions, panel count, house-style prompt) is
enumerated in §7 / §10 as execution work, not a separate decision.

---

## 5. Text handling — hybrid

Resolved in [Decide text-in-image vs native captions vs hybrid](https://github.com/alantay/ask-ah-mah/issues/448).

**The rule:**

> Nothing load-bearing is carried by the image alone. The native caption is always
> self-sufficient. Baked lettering is only ever decorative or mirrored.

In-image lettering may be baked in exactly two forms:

1. **Decorative flavor lettering** — an onomatopoeia (`SMASH!`), a numeral badge. Must pass the
   **strip test**: delete it and the panel still teaches. A charm layer only.
2. **Image-anchored labels** — a word pinned to a spot on the drawing (arrow + "germ" on a
   clove, "45°" on a knife). May be baked *because position is the point*, **but only if the
   native caption independently says the same thing in words.**

Everything else — every actual instruction — is native (app-rendered text).

**Why (drivers real today, i18n is a future bonus):** the app is English-only (`<html lang="en">`,
no i18n framework), so the un-translatable cost is future. But three anti-baking drivers are
live now: **a11y** (screen readers can't read pixels), **reflow** (baked text can't wrap on a
narrow phone), **editability** (fixing baked text means re-running image-gen + re-passing the
review gate; native text is a string edit). Hybrid also buys future i18n for free — instruction
text is a native string, so a translation is a data addition, never a re-render.

**Caption register and shape:**

- **Instruction captions — plain, factual, imperative** (the Market/Storage Tips voice,
  [ADR-0023](adr/0023-tips-speak-in-a-plain-register-not-ah-mahs-voice.md)). One plain caption
  per panel, paired 1:1.
- **Optional warm wrapper** — an optional `intro` and closing `note` in Ah Mah's voice, exactly
  like the existing step `tip`. This is the one place warmth is allowed.

**Design evidence:** `Ah Mah - Recipe with Technique Images.html` (in the design-system handoff
zip) renders the helper as a folded "Show me how" `<details>` with per-frame native captions and
numeral badges; image slots carry no baked instruction text.

---

## 6. How a step earns a helper — detection

Resolved in [Decide how a step earns a helper](https://github.com/alantay/ask-ah-mah/issues/449).

**Mechanism — the model emits the technique(s) as structured data when it writes the step.**
Not keyword-matched, not a post-hoc curated trigger map — both of those read the free-text
`body`, which can't tell "mince the garlic" (teach it) from "add the pre-minced garlic"
(don't). The model knows its own intent; that intent *is* the precision §3 asked for.

**Where it lives — a new optional field on `RecipeStepSchema`** (`src/lib/recipes/schemas.ts`,
currently `title`/`body`/`tip`/`uses`):

```ts
techniques: z.array(TechniqueSlugSchema).optional(),
```

Because `RecipeBlock.steps` and `TweakPatch.steps` both reuse `RecipeStepSchema`, the field
round-trips through generation, save, **and** tweak with no extra handling — a rewritten step
re-emits its tags.

- **Type — `techniques?: slug[]` (plural, enum-constrained, multiple allowed).** A single step
  can teach several ("mince the garlic, roll-cut the carrots"). Order = order taught; dedupe
  within a step. The per-technique bar still holds — a step that only *uses* a pre-prepped
  ingredient tags nothing. No hard cap (real prep steps top out at ~2–3; a cap is speculative).
- **The enum derives from the manifest keys** (§7) — one vocabulary, not two. A taggable
  technique always has a helper *by construction*.
- **Validation — fail closed.** On parse, filter to known + asset-backed slugs; unknown slug /
  missing field → **no helper, never an error** (lenient partial-parse house style,
  [ADR-0009](adr/0009-progressive-reveal-via-partial-parse.md)). Fail-closed *is* how
  "never forced" is realized: no match = no helper.
- **Legacy recipes — no backfill.** Old stored recipes lack the field and show no helpers.
  Helpers are additive, not load-bearing; we don't rewrite stored documents
  ([ADR-0011](adr/0011-recipe-is-a-document.md)). Coverage accrues on new/tweaked recipes.

**Baked key, looked-up content (ADR-worthy, deferred).** This diverges from Tips *on purpose*:
Tips derive their key at render from an already-persisted field (`ingredient.name`) and bake
nothing. Here we **bake the slug onto the step** — the detection signal (the model's intent)
exists only at generation time and isn't cheaply recoverable from persisted `body`. The **asset
is still not baked** — it's looked up by slug at render, exactly like a tip.

---

## 7. Data model

Resolved in [Design the technique-helper data model](https://github.com/alantay/ask-ah-mah/issues/451).

**Storage medium — a static in-repo manifest keyed by slug, not a DB corpus.** The Tips analogy
holds for the *keying* (slug-id, universal/shared, no `userId`) but not the *medium*: the
`MarketTip`/`StorageTip` tables cache **runtime LLM output**; technique helpers are finite,
produce-once, hand-authored with no runtime write path. So the Technique entity is a
version-controlled manifest object, and §4's "manual upload = the gate's home" becomes a **PR
review**. A DB table would only win if techniques were added/edited at runtime by non-developers
or grew large enough to hurt the bundle — neither holds at the tight-6 starter.

**The manifest is the single source of truth**, and §6's `RecipeStepSchema.techniques` enum
derives its values from the manifest keys — *tagged ⟹ has-helper*. A valid slug can never be
assetless; fail-closed at render only guards a model-emitted string *outside* the vocabulary.

**Per-technique shape:**

```
Technique (keyed by slug):
  label:   string      // human-readable name for the "Show me how · <label>" tab (§8)
  intro?:  string      // optional — Ah-Mah-voiced opener (like a step tip)
  panels:  Panel[]     // ordered, 1..N
  note?:   string      // optional — Ah-Mah-voiced closer

Panel:
  image:   string      // public-root-relative static path, e.g. /techniques/<slug>/<n>.webp
  caption: string      // one plain-register caption per panel (§5, ADR-0023)
```

- **Register split (deliberate):** per-panel `caption` is **plain register** (the load-bearing,
  self-sufficient native text); `intro`/`note` are **Ah Mah's voice**. Both coexist in one entity.
- **Image reference — a public-root-relative path string** (e.g. `/techniques/<slug>/<n>.webp`),
  served statically by Next. The path *convention* is recommended here; exact filename / format /
  dimensions / panel-count are asset-production detail for execution (§10) — no separate ticket.
- **Step→technique linkage — none relational.** Recipes are documents
  ([ADR-0011](adr/0011-recipe-is-a-document.md)); the baked `techniques?: slug[]` rides inside the
  stored recipe JSON. Render maps each slug → manifest entry → one foldout per technique (0..N per
  step). **No join table, no Prisma model, no DB migration** — the only schema touch is §6's
  optional document field.

---

## 8. Popup UX — open and dismiss

Resolved in [Design the helper popup UX](https://github.com/alantay/ask-ah-mah/issues/450),
confirmed against a rendered prototype (`helper-ux-450.html`).

1. **Open behaviour — inline expand, folded by default.** A quiet **"Show me how · <label>"**
   tab sits beneath the step body/tip; tap unfolds the frame strip *in place*. **Not a modal** —
   a modal covers the step you're mid-read on and adds an open/close layer for an optional,
   never-forced aid. Folded-by-default is how "never nags" is realized at the UX layer.
2. **Panel layout — horizontal swipe / scroll-snap on narrow; full row on wide.** One panel at a
   time keeps the footprint to a single panel-height so it doesn't bury the next step. Needs a
   **"there's more" cue**: a peek of the next panel at the edge + dot indicators. On the wide
   cookbook the strip lays out as a **full row** (all panels visible).
3. **Register scope — both surfaces.** The helper renders wherever a step renders: the chat
   letter (`marker="stamp"`) and the cookbook (`marker="quiet"`), from **one shared `StepItem`**
   (`src/features/shared/components/recipe/StepItem.tsx`). The chat letter is the *first* read —
   where a beginner most needs "show me how".
4. **Technique-word mark — none; the tab is the sole affordance.** A dotted underline already
   means "an ingredient this step uses" (`step.uses` in `StepBody.tsx`); a second underline
   vocabulary on the same line collides. The "Show me how · <label>" tab is sufficient.

**Held defaults (uncontested):**

- Tap a panel image → **zoom / lightbox** (kitchen legibility — "how small is a mince").
- **Multiple foldouts open independently** — no accordion.

A step carries **0..N** helpers, so the UI renders several tabs on one step (a small tray/row),
never assuming exactly one.

---

## 9. Accessibility and i18n mechanics

Resolved in [Specify caption a11y + i18n mechanics](https://github.com/alantay/ask-ah-mah/issues/471).

**DOM contract for the helper:**

```html
<details>                          <!-- "Show me how · <label>" fold (§8) -->
  <summary>…</summary>
  <ol aria-label="<label> steps">  <!-- order = list semantics -->
    <li>
      <figure>
        <img alt="" …>             <!-- decorative; caption is the accessible name -->
        <figcaption>…caption…</figcaption>
      </figure>
    </li>
    …
  </ol>
</details>
```

1. **Strip + panel markup — `<ol>` of `<figure>`; order via list semantics.** A screen reader
   announces "list, N items… item 1 of N" and reads panels in **DOM order regardless of scroll
   position** — so the ordered sequence is perceivable even on the narrow swipe/scroll-snap
   layout. **All panels stay in the DOM at all times**; the swipe only moves the viewport.
   Consequence: the **numeral badge and dot indicators are visual echoes → `aria-hidden`** (no
   visually-hidden "Step 1 of N" needed).
2. **Panel image alt — `alt=""` (decorative); the `<figcaption>` is the sole accessible name.**
   §5 defines the caption as self-sufficient, so descriptive alt would make a screen reader
   **double-read** the instruction. Empty alt on an `<img>` inside a `<figure>` whose
   `<figcaption>` speaks for it is the standard pattern and matches how this codebase already
   treats decorative imagery. **No descriptive-alt escape hatch** — it would fight the figcaption
   pattern and re-add double-reading. (Named tradeoff: a SR user gets the words but not the
   drawing's visual nuance; accepted, because no alt string beats the caption at "this is what
   minced garlic looks like".)
3. **Localization — deferred; manifest stays `caption: string` (English).** The app has zero
   i18n infrastructure and no second locale on any roadmap; a locale-keyed shape now is
   speculative configurability that buys nothing (§5's hybrid already made i18n a data addition,
   not a re-render). **Recorded migration path:** when i18n lands, `caption` becomes a
   locale-keyed lookup, `<html lang>` + optional per-`figcaption` `lang` get wired, and
   **`alt=""` plus the entire DOM skeleton stay untouched** (empty alt is locale-independent).
   Images are never re-generated (nothing load-bearing is baked).

---

## 10. Implementation checklist (execution effort)

The order below groups the work; sequence to taste.

**Assets & manifest**

- [ ] Establish the house-style generation prompt and panel conventions (format, dimensions,
      panel count per technique) — asset-production detail left open by §4/§7.
- [ ] Generate the ~24 starter panels; run every panel through the **blocking human-review gate**
      (a PR review); commission any gate-failing panel in-style.
- [ ] Place assets at the `/techniques/<slug>/<n>.<ext>` static path (§7).
- [ ] Author the in-repo manifest keyed by the six slugs: `label`, ordered `panels`
      (`image` + plain `caption`), optional Ah-Mah-voiced `intro`/`note`.

**Schema & detection**

- [ ] Add `techniques?: TechniqueSlug[]` to `RecipeStepSchema` (`src/lib/recipes/schemas.ts`),
      with the slug enum **derived from the manifest keys**.
- [ ] Update the generation system prompt so the model emits `techniques` per the §3 bar.
- [ ] Confirm round-trip through block generation, save, and tweak (schema reuse should give this
      for free).
- [ ] Render-time: filter to known + asset-backed slugs; unknown → no helper (fail closed).

**UI**

- [ ] Render the helper from the shared `StepItem` (`src/features/shared/components/recipe/`) in
      both `stamp` (chat) and `quiet` (cookbook) registers.
- [ ] Folded "Show me how · <label>" tab(s), one per tagged technique (0..N); no accordion.
- [ ] Narrow: swipe/scroll-snap strip with edge-peek + dot indicators. Wide: full row.
- [ ] Tap-to-zoom lightbox on each panel.
- [ ] DOM per §9: `<details>` → `<ol aria-label>` → `<li>` → `<figure>` (`img alt=""` +
      `figcaption`); numeral badge + dots `aria-hidden`.
- [ ] Verify with `/verify` before claiming working behaviour.

**Docs (write during execution)**

- [ ] ADR: **"technique helpers are a static manifest, not a DB corpus"** (hard-to-reverse,
      surprising against the Tips-table pattern, a real DB-vs-manifest trade-off).
- [ ] ADR (or fold into the above): **baked-slug detection + hybrid text placement + the
      decorative-image / i18n-deferred a11y stance**.
- [ ] CONTEXT.md glossary term: **"Technique Helper"**.
- [ ] Update `docs/progress.md`.

---

## 11. Traceability

| Decision | Ticket |
| --- | --- |
| Origin idea | [#444](https://github.com/alantay/ask-ah-mah/issues/444) |
| Map | [#445](https://github.com/alantay/ask-ah-mah/issues/445) |
| Starter technique set + slug identity | [#446](https://github.com/alantay/ask-ah-mah/issues/446) |
| Image source (AI, stock out) + two-lock rule | [#447](https://github.com/alantay/ask-ah-mah/issues/447) |
| Text handling (hybrid) | [#448](https://github.com/alantay/ask-ah-mah/issues/448) |
| Detection (model-emitted slug) | [#449](https://github.com/alantay/ask-ah-mah/issues/449) |
| Popup UX | [#450](https://github.com/alantay/ask-ah-mah/issues/450) |
| Data model (static manifest) | [#451](https://github.com/alantay/ask-ah-mah/issues/451) |
| Caption a11y + i18n mechanics | [#471](https://github.com/alantay/ask-ah-mah/issues/471) |
| This spec (assembly) | [#452](https://github.com/alantay/ask-ah-mah/issues/452) |
