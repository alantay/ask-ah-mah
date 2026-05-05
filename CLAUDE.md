# CLAUDE.md

Guidance for working in this repository.

---

## Commands

- `npm run dev` — start Next.js (Turbopack)
- `npm run build` — `prisma generate && prisma migrate deploy` → `next build`
- `npm run lint` — ESLint (flat config)
- `npm test` — Jest (`test:watch`, `test:coverage`, `test:ci` available)

**Run specific test**

- `npx jest path/to/file.test.ts`
- `npx jest -t "test name"`

**Database**

- `npm run db:local` / `npm run db:prod` — `prisma generate && prisma db push`
- `npm run db:studio` — open Prisma Studio (`prisma/dev.db`)

---

## Architecture

Next.js 15 (App Router) + React 19 + Vercel AI SDK.

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
- Keep branches short-lived (1–2 days) and merge `main` frequently during development to minimize conflicts

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
