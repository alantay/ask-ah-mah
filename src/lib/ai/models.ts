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
 * `low` is a floor, not a preference. At `none` the Mode 5 checklist gate stops
 * firing entirely — 0/4 on both models, where `low` and above score 4/4.
 */
export const EFFORT_AGENTIC = { openai: { reasoningEffort: "low" } };

/**
 * Schema-constrained extraction, classification, titling and short tips —
 * calls with no tools and a schema doing the shaping, where reasoning tokens
 * are pure cost.
 */
export const EFFORT_MECHANICAL = { openai: { reasoningEffort: "none" } };
