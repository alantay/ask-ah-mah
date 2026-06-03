# ADR-0010 — Recipe Tweak returns a patch, not the whole recipe

**Status:** Accepted
**Supersedes:** the "model returns the full `RecipeBlock`" decision in [ADR-0005](0005-tweak-bench-multi-turn.md). The rest of ADR-0005 (multi-turn ephemeral session, structured change list, decorative checkmarks) stands.

## Context

Each Recipe Tweak turn had the model echo the **entire** updated `RecipeBlock` back as JSON, plus the change list (ADR-0005). Output size therefore scaled with recipe size, not with how much the user changed. A one-word tweak ("more spicy") cost the same ~800 output tokens as a rewrite.

Measured: a single tweak spent **15.78s "waiting for server response"** with 0.81s content download. The route buffers on purpose (`generateText`, so it can inspect `finishReason === "length"` and return a clean 422 — see ADR-tied commits #256/#258), so all 15.78s is the model generating the full recipe before a byte ships. The user stares at a frozen panel the whole time.

The chat pipeline (`streamText`, same `gpt-4.1-mini`, same recipe-sized output) takes roughly the same wall-clock to generate but *feels* fine because ADR-0009 streams it. The obvious move was to copy that — stream the tweak and reveal it progressively. We rejected that as the primary fix:

- Streaming **masks** the 15s; it does not remove it. The user would watch a recipe they *already have* re-paint itself field-by-field for ~14s.
- The actual change (the highlighted row, driven by the `changes` array) is emitted **last**, so the payoff lands at the end of the wait.
- Streaming forfeits the `finishReason` 422 truncation guard we had just shipped — once a 200 is sent, you cannot retract.

The real cost is the full-recipe echo. The fix is to stop sending it.

## Decision

A Recipe Tweak returns a **Tweak Patch**: only the recipe fields that changed, plus the change list. The client applies the patch to the working draft.

- **Grain: array-level.** Scalar fields (`title`, `description`, `servings`, `time`, …) are sent only if changed. Arrays (`ingredients`, `steps`, `prep`, `tags`) are replaced **wholesale** — if any element changed, the model returns that whole array; otherwise it omits the key. The client never applies indexed row ops, so the index-shift ambiguity ADR-0005 cited (adds/removes renumbering later rows) never arises.
- **Presence-based merge.** Key present → replace that field on the working draft; key absent → keep the working draft's value. Clearing is disambiguated from "unchanged" by presence, not emptiness: send `[]` to clear `tags`/`prep`, omit the key to leave them. `applyTweakPatch(workingDraft, patch)` is a pure merge returning the new `RecipeBlock`.
- **Still buffered.** The patch is small (~50–200 tokens, ~4–5s), so we keep `generateText` and the `finishReason === "length"` 422. Truncation is now far less likely *and* still handled cleanly.
- **Choreographed reveal, client-side.** Because the response arrives whole, the "lead with the change, then look left" sequence is animated deliberately: the change label fades into the bench, then ~150ms later the changed row on the recipe (left) scrolls into view and pulses its amber highlight. The cue points at the exact row that changed rather than re-flowing the whole document.
- **Coherence preserved.** The model still authors both the changed arrays and the `changes` list in one response, so the recipe and the diff cannot disagree — the property ADR-0005 was actually defending. With array-level replace the recipe is not *derived* from a client diff, so the ambiguity that motivated "echo the full recipe" is gone without giving up coherence.

## Why not alternatives

**Progressive reveal (copy ADR-0009 to the tweak).** Masks the wait instead of cutting it; re-paints a recipe the user already has; lands the actual change last. Right answer for chat (first-time reveal of a recipe that doesn't exist yet), wrong shape for editing something already on screen.

**Row-level patch (per-row ops).** ~2s faster than array-level, but the client must apply indexed ops with shifting indices — exactly the ambiguity ADR-0005 avoided. Not worth ~2s to hand-roll and test index-application logic. Array-level is upgradeable to row-level later if 4–5s still bites.

**Stream the patch.** Once the patch cut the wait to ~4–5s, streaming solves a problem that no longer exists while still costing the just-shipped truncation 422 and handing the reveal choreography to token order. Buffering keeps the safety net and gives precise control of the "change-then-look-left" beat. If ~4s of waiting feels dead in testing, the cheap fix is a better waiting state ("Ah Mah's adjusting the chili…"), not a stream.
