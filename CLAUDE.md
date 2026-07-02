# CLAUDE.md

Guidance for working in this repository.

---

## Commands

- use `pnpm` instead of `npm`

---

## Architecture

App: **“Ask Ah Mah”** — converts pantry items into recipes via chat.

### Data Flow

1. UI (`src/features/Chat`) → `POST /api/chat`
2. `/api/chat/route.ts`:
   - loads last `CONTEXT_WINDOW = 15` messages (`getMessages`)
   - merges with incoming messages
   - validates (`validateUIMessages`)
   - calls `streamText(openai("gpt-4.1-mini"))`
   - uses `CHAT_SYSTEM_PROMPT` and `stepCountIs(5)`
3. Model tools:
   - `addInventoryItem`
   - `getInventory`
   - `removeInventoryItem`  
     → implemented in `src/lib/inventory/` (Zod schemas)  
     → mutations happen via conversation
4. Other APIs (`/api/inventory`, `/api/message`, `/api/recipe`)
   - thin Prisma CRUD for UI state

---

## Database (Prisma)

- Schema: `prisma/schema.prisma`
- Models: `InventoryItem`, `Message`, `Recipe`
- Scoped by `userId` (client-generated, no auth)

**Important**

- `Recipe.recipeId` prevents duplicate AI saves
- Prisma client: `src/generated/prisma/`
- Always import via `@/lib/db` (never `@prisma/client`)

---

## Frontend Structure

- `src/features/<feature>/`
  - self-contained (components, utils, constants, `index.ts`)
- `src/components/ui/`
  - shadcn primitives only (no feature logic)
- Shared state: `src/contexts/`
- Shared components: `src/features/shared/components/`

**Imports**

- same feature → relative
- cross-feature → `@/...`
- prefer barrel exports

---

## Styling

- **Prefer Tokens:** Use Tailwind utility classes and project tokens over inline styles.
- **Limit Inline Styles:** Use only for dynamic values (dimensions, delays) or rare edge cases.
- **Readability:** Consolidate long class stacks into local constants within components.

- Commits: `type(scope): description`
  - `feat`, `fix`, `refactor`, `docs`, `test`, `chore`
- Naming:
  - folders → kebab-case
  - components → PascalCase
  - utils → camelCase
- API routes:
  - `src/app/api/<feature>/route.ts`

---

## Docs

- `docs/prd.md` — product vision
- `docs/progress.md` — current state

**Keep `progress.md` accurate**

- update for:
  - shipped features
  - scope changes
  - meaningful decisions
- skip trivial changes
- goal: understand project without git history

---

## Git Workflow

- **Clean Start:** Always start new tasks from a fresh `main`. Sequence: `git checkout main` -> `git pull` -> `git checkout -b <branch>`.
- **Frequent Sync:** For long-running tasks, merge `main` into your feature branch frequently.
- **Local Resolution:** Resolve all conflicts locally (merge `main` into feature branch) before pushing. PRs must be "Clean" and "Mergeable".
- **Commit Style:** Use `type(scope): description` (feat, fix, refactor, docs, test, chore).
- **Process:** Suggest commits at logical checkpoints; do not auto-commit. Never push to `main`.

---

## Testing

- Jest + Testing Library (`jsdom`)
- Setup: `jest.setup.ts`
- Tests:
  - colocated: `*.test.ts(x)`
  - or `src/__tests__/`

---

## Principles

- Keep features isolated
- Keep APIs thin
- Let the LLM drive mutations via tools
- Avoid cross-feature coupling
- Optimize for readability
- Simplicity first: minimum code that solves the problem; no speculative abstractions, configurability, or error handling for impossible cases.
- Surgical changes: touch only what the task needs; match existing style; don't refactor or delete code you weren't asked to (mention dead code, don't remove it).
- Think before coding: surface assumptions, tradeoffs, and simpler alternatives; ask when something is unclear rather than guessing.

---

## Agent skills

### Issue tracker

Issues live in GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo — one `CONTEXT.md` + `docs/adr/` at the root. See `docs/agents/domain.md`.
