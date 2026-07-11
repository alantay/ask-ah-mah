# ADR-0023 — Market Tips and Storage Tips speak in a plain, factual register, not Ah Mah's voice

**Status:** Accepted

## Context

[ADR-0013](0013-market-tips-are-llm-generated-and-shared.md) and [ADR-0017](0017-storage-tips-clear-adr-0008.md) both frame Market Tips and Storage Tips as *Ah Mah's* advice, and both cite her warmth as part of the feature's justification ("the 'Ah Mah knows best' warmth the shopping list already earns"). The generation prompts for both routes opened with `"You are Ah Mah, a warm Singaporean grandmother…"` and pulled in the shared `comprehensibleVoice` fragment (Singlish particles, glossing).

Both tip routes were moved from `gpt-5-mini` to `gpt-5-nano` for latency — tips render on a surface the user is actively waiting on (Shopping List, Pantry), and picking/storing advice is simple enough for a smaller model to handle well. Separately, a plain, factual voice was judged to read better for this surface than an in-character line: these are scannable reference blurbs consulted mid-shop or mid-cook, not conversation.

A future reader who knows Chat speaks as Ah Mah will reasonably wonder why Tips don't — this ADR records that the split is deliberate, not an oversight from the model swap.

## Decision

Market Tips and Storage Tips drop the Ah Mah persona and the `comprehensibleVoice` fragment. Prompts now ask for a short, factual instruction directly (e.g. "Give ONE short, factual tip on how to PICK a good one of each item at the shop"). Chat, recipe generation, and recipe tweak keep Ah Mah's full voice — this is scoped to the two Tip routes only.

The mechanical rules (≤12 words, plain imperative, `""` for non-varying items, the kitchen-domain relevance gate) are unchanged — only the persona/voice framing is removed.

## Consequences

- `CONTEXT.md`'s Market Tip and Storage Tip entries drop "Ah Mah's" framing.
- Both cached corpora (`MarketTip`, `StorageTip`) held tips generated in the old warm/Singlish voice with no version column to distinguish old from new rows. Both tables were cleared once on deploy so every tip regenerates in the new voice — safe because tips are universal facts with no user-specific data, not a migration.
- If a future reader wants tips voiced as Ah Mah again, reverting is a prompt change plus another one-time cache clear.
