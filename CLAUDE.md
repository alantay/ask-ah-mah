# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Next.js dev server (Turbopack)
- `npm run build` — runs `prisma generate && prisma migrate deploy` then `next build`
- `npm run lint` — ESLint (flat config, `eslint.config.mjs`)
- `npm test` — Jest (jsdom). `npm run test:watch`, `npm run test:coverage`, `npm run test:ci`
- Run a single test: `npx jest path/to/file.test.ts` or `npx jest -t "test name"`
- DB: `npm run db:local` / `npm run db:prod` (both run `prisma generate && prisma db push`); `npm run db:studio` opens Prisma Studio against `prisma/dev.db`

Note: `db:studio` is hardcoded to a local SQLite file (`file:./prisma/dev.db`), but `prisma/schema.prisma` declares `provider = "postgresql"`. Production uses Postgres via `DATABASE_URL`; the local SQLite file is a leftover. Don't trust it as source of truth.

## Architecture

Next.js 15 App Router + React 19 + Vercel AI SDK chat app ("Ask Ah Mah") that turns a user's pantry into recipe suggestions.

### Data flow

1. Client (`src/features/Chat`) uses `@ai-sdk/react` to stream from `POST /api/chat`.
2. `src/app/api/chat/route.ts` is the brain: it loads the last `CONTEXT_WINDOW = 15` messages from Postgres via `getMessages(userId)`, merges them with the incoming `messages`, runs them through `validateUIMessages`, then calls `streamText` against `openai("gpt-4.1-mini")` with `CHAT_SYSTEM_PROMPT` and `stopWhen: stepCountIs(5)`.
3. The model is given three tools — `addInventoryItem`, `getInventory`, `removeInventoryItem` — backed by `src/lib/inventory/Inventory.ts` and Zod schemas in `src/lib/inventory/schemas.ts`. Inventory mutations happen as a side effect of conversation, not via dedicated UI calls.
4. Other API routes (`/api/inventory`, `/api/message`, `/api/recipe`) are thin CRUD endpoints over Prisma for the UI to read/persist state outside the LLM loop.

### Prisma / DB

- Schema in `prisma/schema.prisma`: `InventoryItem`, `Message`, `Recipe`. All scoped by `userId` (no auth — userId is a client-generated session id; see `src/contexts/SessionContext.tsx` and `src/hooks/useSession.ts`).
- `Recipe.recipeId` is a model-generated id used to dedupe AI-suggested recipes when saving (see commit history around race-condition fixes).
- Generated Prisma client is committed at `src/generated/prisma/` (custom `output` in schema). Import via `@/lib/db` — do not import from `@prisma/client` directly.

### Frontend structure

- `src/features/<Feature>/` — each feature (`Chat`, `Inventory`, `RecipeDisplay`, `RecipeList`) is self-contained with its own `components/`, `utils.ts`, `constants.ts`, and a barrel `index.ts`.
- `src/components/ui/` — shadcn/ui primitives (do not put feature code here).
- Cross-feature shared state lives in `src/contexts/` (`RecipeContext`, `SessionContext`).
- Path alias `@/*` → `src/*` (configured in `tsconfig.json` and `jest.config.ts`).

### Conventions

- Conventional commits required: `type(scope): description` (feat, fix, docs, style, refactor, test, chore).
- Folder names kebab-case, component files PascalCase, utility files camelCase.
- API routes are organized per-feature under `src/app/api/<feature>/route.ts`.

### Project rules — read these

Authoritative rules live under `docs/`:

- `docs/git.md` — commit message format.
- `docs/folder-structure.md` — feature-based layout, naming, import rules.
- `docs/pairing.md` — collaboration preferences (e.g., user types terminal commands themselves; ask before write operations).
- `docs/prd.md` — product requirements / vision.

### Testing

- Jest + Testing Library, `jsdom` env, set up via `next/jest`. Setup file: `jest.setup.ts`. Tests live next to source (`*.test.ts(x)`) and under `src/__tests__/`.
