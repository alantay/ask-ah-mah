# ADR-0009 — Streamed blocks reveal via client-side partial parse

**Status:** Accepted

## Context

Assistant responses carry structured payloads as fenced JSON inside the text stream
(` ```recipe ` and ` ```suggestions `, see `CHAT_SYSTEM_PROMPT`). The chat already
streams token-by-token, but the structured blocks could not be rendered until their
closing fence arrived and the whole JSON parsed (`extractRecipeBlocks` only matches
complete fences).

The two prior behaviours were both poor:

- **Recipes** hid the streaming JSON behind a static `SkeletonRecipeCard` for the
  entire duration of the JSON body, then popped the formatted `RecipeLetter` in all at
  once. With nothing filling in, the wait *felt* long even when it wasn't.
- **Suggestions** had no open-fence handling at all (`getOpenRecipeFenceIdx` only
  looked for ` ```recipe `), so an incomplete ` ```suggestions {…` fell through to the
  markdown renderer and **leaked raw JSON** as a code block while streaming.

The dilemma as posed — "static placeholder feels long, but streaming raw JSON looks
ugly" — is a false one. The JSON is only ugly when rendered *as JSON*. If parsed
incrementally, formatted fields can appear as they arrive: no dead wait, no raw JSON.

The decision: **how** to achieve incremental reveal.

## Decision

Reveal both block types by **partial-parsing the open fence on the client** and feeding
the result into the *same* presentational components used for the final render.

- **Parser.** `parsePartialJson` from `ai` (v5) repairs the incomplete buffer and
  returns `{ value, state }`. No hand-rolled tolerant parser, no streaming-JSON
  dependency.
- **Reveal grain.** Top-level scalar strings (`title`, `description`, `intro`) render
  as they grow — a typewriter effect that reads like Ah Mah writing it out. Array
  elements (`ingredients`, `steps`, `prep`, `options`) appear only once complete; the
  trailing in-progress element of the array currently being streamed is held back until
  its closing `}` arrives. Earlier arrays render in full.
- **One render path.** `RecipeLetter` and `SuggestionsBlock` gain an `isStreaming`
  flag that defaults missing arrays to `[]` and suppresses interactivity (servings
  stepper, add-to-pantry, save, start cooking, shortfall card, pantry pill, suggestion
  CTAs). The streaming view and the final view are the same component, so they cannot
  drift apart visually.
- **Failure handling.** When `parsePartialJson` returns `failed-parse` for a given
  token boundary, the last successfully-parsed partial for that message is held and
  re-rendered. Tokens arrive near-continuously, so a failed frame is invisible — and
  the UI never flickers back to a loader mid-recipe.
- **Loaders.** `SkeletonRecipeCard` (and `WritingItOut`) are retired from the recipe
  path. The `ChatLoader` ghost bubble bridges the thinking / tool-call phase *and* the
  sliver between fence-open and the first parseable field; the live component takes over
  the moment a field parses.

Closed blocks continue to render through the strict `extractRecipeBlocks` path. Only the
single trailing open fence (of either type) is partial-parsed.

## Why not alternatives

**Restructure the wire format (tool call / `streamObject` on a dedicated channel).**
The cleanest in theory — the recipe object would stream natively, prose separately. But
it's a deep change to `/api/chat`, the system prompt's three output modes, and the whole
fenced-block parsing layer (`parseBlocks`, the Mode 3 two-recipe contract, the legacy
recipe fallback). The payoff over client partial-parse is marginal: the client already
receives the text stream, so partial-parsing it gets progressive reveal without
touching the contract. Reserve a wire-format change for if/when the JSON-in-text format
causes problems beyond rendering.

**Keep the skeleton, just make it livelier / shorten the wait.** Treats the symptom.
A narrated or speedier skeleton still pops the recipe in whole at the end; the user
still watches a placeholder that doesn't become the thing. Partial parse makes the
placeholder *be* the recipe.

**Render the in-progress array element live (char-by-char everything).** Maximally
granular but jittery: a half-formed ingredient row (`name` present, `amount`/`unit`
not yet) causes layout shift as fields fill, and a half-typed string mid-element looks
unfinished. Holding the trailing element until complete keeps each row a solid unit.
