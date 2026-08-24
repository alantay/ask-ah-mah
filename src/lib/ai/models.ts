/**
 * The one model behind every AI call.
 *
 * There is no heavy/light split any more. `gpt-5.6-terra` was trialled against
 * `gpt-5.6-luna` on chat routing, the Mode 5 checklist gate and time-to-first-
 * token, and matched it on every one at ~10x the price ($2/$12 vs $0.20/$1.20
 * per M). The axis that actually moves behaviour is reasoning effort, below.
 */
export const MODEL = "gpt-5.6-luna";

/**
 * Judgement paths: the chat agent, the recipe tweak, the recipe-text parse.
 *
 * `low` is a floor and a ceiling.
 *
 * Below it: at `none` the Mode 5 checklist gate stops firing entirely — 0/4 on
 * both models, where `low` and above score 4/4.
 *
 * Above it: `medium` and `high` were swept over the recipe checks that still
 * had headroom at `low`. No check moved by more than one run in five (p = 1.0),
 * while latency rose ~30-50% (12.6s -> 14.8s -> 17.7s) and reasoning tokens
 * 7-11x. Resolving a lift that small would need ~300 reps per arm. Raise this
 * only with evidence at that scale, not on a hunch.
 */
export const EFFORT_AGENTIC = { openai: { reasoningEffort: "low" } };

/**
 * Schema-constrained extraction, classification, titling and short tips —
 * calls with no tools and a schema doing the shaping, where reasoning tokens
 * are pure cost.
 */
export const EFFORT_MECHANICAL = { openai: { reasoningEffort: "none" } };
