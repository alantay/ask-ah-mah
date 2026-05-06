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

## Conventions

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

- Suggest commits at logical checkpoints (don’t auto-commit)
- Ensure branch matches scope
  - otherwise suggest new branch (`feat/...`, `fix/...`)
- Never push directly to `main`
- Always `git pull` (or `git fetch` + `git merge main`) before pushing to avoid conflicts

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

---

## Agent skills

### Issue tracker

Issues live in GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo — one `CONTEXT.md` + `docs/adr/` at the root. See `docs/agents/domain.md`.
