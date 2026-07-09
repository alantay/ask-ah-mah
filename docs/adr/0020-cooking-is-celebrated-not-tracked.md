# ADR-0020 — Cooking is celebrated, not tracked

**Status:** Accepted

## Context

[Issue #377](https://github.com/alantay/ask-ah-mah/issues/377) asked `CookingMode`'s finish moment
(today a bare "Done — all finished!" button) to become a warm, in-Ah-Mah's-voice celebration, and
for the app to remember "have I made this before?" for recall purposes.

The obvious next step for "remember cooking activity" is a small feature-creep ladder: a boolean
today, a last-cooked timestamp tomorrow, then a cook count, then a streak, then a badge/achievement
system. The issue explicitly asked to stop at the first rung.

## Decision

A single `cooked: Boolean` field on `Recipe`, set **only** by an explicit "I made this" tap —
never inferred from reaching the last step, never set silently. It answers one question only:
*has this dish been cooked before?* It is not a counter, not a timestamp, not a streak. The tap
is **reversible**: un-ticking sets `cooked` back to `false`.

The tap lives in two places, both the same quiet checkbox (`CookedCheckbox`): CookingMode's last
step, and the **end** of the recipe view (a soft end-cap below Notes, out of the reading path). The
second entry point exists because many people cook straight from the recipe view without stepping
through cooking mode — if CookingMode were the only way in, the cookbook would systematically
under-report and "no stamp" would stop meaning "never made it". It sits at the bottom rather than in
the recipe meta because a recipe view is mostly a reading surface: a standing "tap when you've cooked
it" prompt beside Total time nagged on every read. We tried it as a meta-row card and pulled it back —
the tradeoff is lower discoverability (only readers who reach the end see it), accepted so the reading
path stays clean.

The finish moment itself stays quiet. The last step keeps CookingMode's ordinary `← Prev` /
"Done — all finished!" footer (no gradient panel, no avatar, no celebratory line — we tried a warm
celebration and pulled it back). Above that footer sits the checkbox: the marker and nothing more.
The Cookbook badge is a small static jade stamp on the card's image strip, reusing the app's
existing rotated-badge ("stamp") motif — informational, not a trophy.

## Why not the alternatives

- **Timestamps / cook counts / streaks.** All were considered and rejected — they turn a quiet
  personal marker into a scoreboard, which the issue explicitly ruled out. A boolean is the smallest
  thing that answers "have I tried this?".
- **Auto-marking on reaching the last step.** Rejected — reaching the last step of the *instructions*
  isn't the same as having actually cooked the dish (a user might bail, or be following along without
  cooking). The marker should mean what it says.
- **Photos of the finished dish.** Out of scope per the issue — a materially bigger feature (storage,
  moderation, UI) for a "did I cook this" recall marker.

## Consequences

- One additive Prisma migration (`cooked Boolean @default(false)`); no data migration needed since
  every existing recipe defaults to "not yet marked."
- `cooked` flows through the existing recipe read/write paths (`RecipeBlockSchema`,
  `recipeBlockToRecipeWithId` / `recipeWithIdToBlock`, `saveRecipeFromBlock`, `updateRecipeForUser`) —
  no new endpoints.
- "Never set silently" is structural on the create path: recipe blocks are model-streamed, so
  `saveRecipeFromBlock` ignores `block.cooked` and takes the marker only as an explicit parameter
  (`POST /api/recipe` sends `cooked` beside the block, not inside it). A hallucinated
  `cooked: true` in a streamed recipe can never stamp it.
- A future issue that wants cook counts/streaks/history is a genuinely new feature, not an extension
  of this one — it should be scoped and reviewed on its own terms, not backed into this boolean.
