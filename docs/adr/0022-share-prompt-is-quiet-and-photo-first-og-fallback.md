# ADR-0022 — Share prompt stays quiet; real photos beat the branded OG card

**Status:** Superseded in part — see Update below. The share-prompt half was shipped and then
reverted; the photo-vs-branded-card decision for the OG image stands.

## Update (Jul 2026)

The finish-moment `ShareCta` prompt described below shipped with #402 but didn't read well in
practice and was pulled shortly after (no replacement planned). `useShareRecipe` and the branded
OG image at `/r/<token>` remain — only the "quiet prompt" half of this ADR is reversed. The
"session-local, not derived from `cooked`" reasoning is now moot since the prompt no longer
exists; kept below for history.

## Context

[Issue #402](https://github.com/alantay/ask-ah-mah/issues/402) closes the last 10% of the referral
loop identified in `brand-ahmah.md` §3: an in-flow prompt at the moment of pride, plus a branded
per-recipe OG card so a shared link carries Ah Mah's identity instead of a generic preview. This
extends ADR-0020's "cooking is celebrated, not tracked" principle to sharing: quiet, optional,
never a trophy or a nag.

## Decision

**Share prompt visibility is session-local, not derived from the `cooked` prop.** `ShareCta` only
renders after a `false → true` transition happens inside the current mount (a local `justCooked`
flag set inside the existing cooked-change handler) — never on load of an already-cooked recipe.
Reopening a previously-cooked dish shouldn't nag the cook to share it retroactively; the prompt is
tied to the moment of finishing, not the state of having finished.

**Real photo beats the branded card.** The OG image at `/r/<token>` prefers the recipe's own
`imageUrl` when the user has one (uploaded/pasted-recipe photos already existed); the generated
branded template (gradient, stamp, "from Ah Mah's kitchen") is the fallback for recipes without a
photo. `brand-ahmah.md` §3's "featured by grandma" positioning favors authentic photos over generic
branding when both are available.

## Why not the alternatives

- **Always show the branded card, even over a real photo.** Rejected — a real photo the user chose
  to add is more compelling and more "featured by grandma"-authentic than a generic template; the
  brand's job is to fill the gap when there's nothing else, not to override real content.
- **Persist "already prompted to share" server-side.** Rejected — adds a field/migration for a
  purely session-scoped nicety; re-showing the prompt on a fresh mount after re-ticking cooked is
  harmless and mirrors the checkbox's own reversibility.

## Consequences

- `ShareCta` needs no new persisted state — a local `useState` flag per mount is sufficient.
- The OG route does one extra `getRecipeByShareToken` lookup already paid for by `generateMetadata`
  in the same route folder (no new query path).
- `brand-ahmah.md` §3's "~90% built" line is now closed out — see progress.md.
