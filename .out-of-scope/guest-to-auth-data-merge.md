# Guest-to-Auth Data Merge

This project does not auto-migrate a guest user's data (pantry items, conversations, messages, saved recipes) into their permanent account when they sign in for the first time. Signing in is, in practice, a fresh start for the signed-in identity. Anything a user accumulated under their `guestId` stays attached to that guest record and is no longer reachable from the signed-in account.

## Why this is out of scope

We shipped Better Auth (#82) so users *can* sign in, but the realistic usage pattern hasn't surfaced any pain around the guest→auth transition:

- No user has reported losing their pantry or recipes after signing in.
- Most engagement appears to happen entirely within one of the two modes (always guest, or always signed-in), not across the boundary.
- The cross-device sync motivation in the original PRD (#77) is, in practice, served by signing in early — not by retroactively rescuing guest data.

The implementation cost is real and broad: every model in `prisma/schema.prisma` is scoped by `userId` (InventoryItem, Message, Conversation, Recipe). A correct merge would need:

- A migration utility that reassigns every guest record to the new `userId` atomically
- Conflict handling for cases where the signed-in account already has overlapping data
- Cleanup of the orphaned guest record without breaking referential integrity
- A trustworthy UX around "your guest stuff just appeared" — without that, users get confused about where data came from

That's a meaningful surface area of code and edge cases for a problem that nobody is reporting.

```ts
// src/hooks/useSession.ts — guest and authenticated paths coexist;
// signing in flips `userId` from `guestId` to `session.user.id`,
// orphaning the guest's data in place.
const userId = isAuthenticated ? session!.user.id : guestId;
```

## When to revisit

Reopen this if any of the following starts happening:

- Users complain that signing in "lost" their pantry/recipes
- Telemetry shows a meaningful pattern of users building substantial guest state and *then* signing in
- A product decision changes guest mode from "permanent option" to "trial before sign-up"

Until then, the current behavior — guest mode and signed-in mode as parallel, non-merging surfaces — is intentional.

## Prior requests

- #83 — Auth: Guest Progression Sync (Auto-Merge)
