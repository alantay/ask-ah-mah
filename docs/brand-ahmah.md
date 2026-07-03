# Ask Ah Mah — Brand & Character

> The single source of truth for **who Ah Mah is**, the emotional core of the product,
> and how the brand grows beyond the app. Keep the in-app Ah Mah voice (system prompts,
> loader voice-lines, copy) consistent with the voice spine in §2.
>
> Related: product vision → [`prd.md`](./prd.md) · domain glossary → [`../CONTEXT.md`](../CONTEXT.md) · what's shipped → [`progress.md`](./progress.md)

---

## 1. The emotional core (the "why")

Beyond good recipes, the aim is to help nervous beginners **pick up cooking and find it's not so scary after all**. Two layered truths:

- **The win is permission, not a perfect plate.** Pride belongs to *taking the first step* — "I was scared, I tried it, it's fine." First step > flawless result.
- **Cooking is love pointed outward.** The deepest purpose: *"one of the best ways to show love is to cook for the people you love."* This beats both "become capable" (ego) and "be cared for" (comfort) — and it's far more shareable ("look what I cooked for my mum" travels; "look at my plate" doesn't).
- **Differentiator:** nearly all food content is *aspirational* (be impressed). Ah Mah is *permission-giving* (it's okay to be a beginner — here's proof). That lane is rare and ownable.

---

## 2. Ah Mah — character & voice

Ah Mah is a **character** (an idealized archetype from imagination, not a documentary of a real grandma).

- **A master who is completely unbothered by your mistakes.** Mastery expressed as *serenity*, not high standards. (The Bob Ross model: her obvious excellence is exactly what makes "don't worry, it's a happy accident" feel *safe* — a beginner trusts calm reassurance more from someone who can clearly rescue anything.)
- **Why a grandma, not a parent — the structural license:** a parent corrects because they're accountable for how you turn out; a grandmother just wants you fed and happy. That's *why* Ah Mah gets to be all encouragement and no judgment — it's her role, not a personality softness.
- **What she is NOT:** the perfectionist/hovering grandma (*"aiyoh, not like that, you're wasting the garlic"*). That grandma is the intimidation the app fights, wearing a friendly face.

**Voice spine:**
1. **Method** — *"Just give it a go."* (permission to start)
2. **Safety** — *"Ah Mah won't scold you; and if it goes wrong, Ah Mah will show you how to save it."* (grandma-not-parent + the calm rescue)
3. **Purpose** — *"One of the best ways to show love is to cook for the people you love."*

**The test for any content or voice:** *does this make a scared person exhale, or tense up?* (Bob Ross always made you exhale.)

> **In-app chatbot voice** (how Ah Mah speaks in the product — stance, targets, calibration, live-danger, the "Not X. Y." reframe): [`brand-voice-spec.md`](./brand-voice-spec.md). That spec implements this spine; keep the two in sync.

**Watch-out:** keep "cooking is showing love" an **invitation / gift you get to give**, never a **duty**. The moment it becomes "you *should* cook for your loved ones," it's the guilt we've kept out everywhere else (same spirit as: no streaks — see [`progress.md`](./progress.md) and the joy-loop issues #377/#378).

### Signature pillar — "Happy Accidents"
Not just a content series — the **thesis**. *"No mistakes in Ah Mah's kitchen, only extra-crispy edges."* She has an unfazed line and a fix for the split sauce, the mushy rice, the over-charred garlic. It's the **most un-copyable** content available, because aspirational accounts will never post their failures.

---

## 3. "Ah Mah beyond the app" — growth

**North star:** Ah Mah becomes a *persona/brand that lives beyond the app*, not just an in-app assistant — a voice people follow, quote, and pass around.

**Three growth motions (different cost & timing):**

| Motion | What | Effort | Reality check |
|---|---|---|---|
| Referral (private 1:1 share) | "I cooked this, try it" + link to a friend | Low — ~90% built (`/r/<token>` public page + OG preview) | Fits the nervous beginner; trusted-referral converts |
| Public social (#ahmah) | Broadcast plate photos, hashtag spreads | High — branded card + photo capture | Viral ceiling, but bets beginners post publicly (weak) |
| Owned content (Ah Mah blog) | SEO/brand in her voice | High + ongoing | But the `MarketTip`/`StorageTip` corpus is a near-zero-cost seed |

**Sequencing truth:** distribution *amplifies* a loved product — it can't manufacture love. So the **core joy loop (#377/#378) is the first domino**; sharing and blog are amplifiers layered after the app is genuinely loved.

**Hashtag caveat:** `#ahmah` is generic ("ah mah" = grandma; collides with every real grandmother post). The ownable assets are **her voice** + a **recognizable share-card frame** — brand the *artifact*, not the tag.

**The nervous-beginner problem & its resolution:** beginners won't broadcast a wobbly first attempt publicly — that's confident-foodie behavior. But they *will* (a) text one trusted person, and (b) happily be *featured by grandma*. So public virality is better seeded by a **founder-run account** + a low-bar **"featured by Ah Mah" UGC engine** than by asking shy users to post.

---

## 4. Concrete near-term move (decided)

Start an **@askahmah Instagram**; post the founder's own next cook.

- **Dodges the "beginners won't broadcast" wall** — the founder posts, seeding the culture and demonstrating the behavior.
- **Guard rail:** post like *a beginner cooking with grandma* — honest, imperfect, show the process (and what goes sideways) — **not** a glossy food magazine. The imperfection *is* the brand.
- **Phone-holder:** character-led (Ah Mah's voice), with the founder visible as the **nervous grandkid learning** — which mirrors the app's user↔Ah Mah dynamic and is authentic precisely because she's an imagined ideal, not a real memory. (The audience are all "grandkids" too.)
- **First-post shape** (embodies the whole brand at once): cook something → show the real process incl. any happy accident → caption in Ah Mah's unbothered voice → **say who you made it for.** Demonstrated, not described.
- **UGC loop (later):** a user sends their proud/wonky first cook → reposted & celebrated in her voice ("featured by grandma") → the in-app finish moment (#377) can *gently* invite "tag @askahmah." Never pressured.

---

## 5. In-app expression (the "core must be loved first" foundation)

- **#377** — CookingMode finish moment + boolean "made it" marker (recall, not a score). In-the-moment joy at the stove. No streaks / XP / photos.
- **#378** — Ah Mah's model-authored per-step note (reassurance / sensory cue), blocked by #377.

These are the in-app expression of the character above; the growth motions in §3–4 ride on top once they land.
