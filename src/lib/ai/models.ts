/**
 * The one model behind every AI call.
 *
 * There is no heavy/light split any more. `gpt-5.6-terra` was trialled against
 * `gpt-5.6-luna` on chat routing and the Mode 5 checklist gate. A later 12-case
 * recipe benchmark tied on broad checks, while targeted repeats favoured Luna
 * for explicit air-fryer and jammy-egg timing. Terra still costs ~10x as much
 * ($2/$12 vs $0.20/$1.20 per M). Reasoning effort remains the useful axis below.
 *
 * `gpt-6-luna` replaced `gpt-5.6-luna` (Oct 2026): cheaper, ~24% faster, and
 * level or better on the recipe benchmark — once the prompt asked for a rescue
 * note on failure-prone techniques, which 5.6 wrote unprompted and 6 dropped.
 */
export const MODEL = "gpt-6-luna";

/**
 * Judgement paths: the chat agent, the recipe tweak, the recipe-text parse.
 *
 * `low` is a floor and a ceiling.
 *
 * Below it: at `none` the Mode 5 checklist gate stopped firing entirely — 0/4 on
 * both gpt-5.6 models, where `low` and above scored 4/4 (not re-run on gpt-6).
 *
 * Above it: `medium` and `high` were swept over the recipe checks that still
 * had headroom at `low`. No check moved by more than one run in five (p = 1.0),
 * while latency rose ~30-50% (12.6s -> 14.8s -> 17.7s) and reasoning tokens
 * 7-11x. Resolving a lift that small would need ~300 reps per arm. Raise this
 * only with evidence at that scale, not on a hunch.
 *
 * Re-checked on `gpt-6-luna` (Oct 2026): `medium` scored 33/36 all-hard vs 31/36,
 * at +33% latency and ~6x reasoning tokens. Same verdict.
 */
export const EFFORT_AGENTIC = { openai: { reasoningEffort: "low" } };

/**
 * Schema-constrained extraction, classification, titling and short tips —
 * calls with no tools and a schema doing the shaping, where reasoning tokens
 * are pure cost.
 */
export const EFFORT_MECHANICAL = { openai: { reasoningEffort: "none" } };
