# Agentic Venture Studio Monorepo

Production-minded TypeScript monorepo scaffold for the Agentic Venture Studio MVP.

## Workspace layout
- `apps/web`: Next.js founder dashboard and opportunity workspace.
- `apps/api`: Fastify REST API and workflow entrypoints.
- `packages/types`: Shared entities, enums, and API schemas.
- `packages/db`: Postgres client, migrations, and repository helpers.
- `packages/agents`: Agent runtime, registry, prompt contracts, tool interfaces.
- `packages/config`: Shared TypeScript and ESLint config presets.
- `docs/`: Product, architecture, API, prompt, and operations documentation.

## Quickstart
1. Install dependencies:
   - `pnpm install`
2. Copy env:
   - `cp .env.example .env`
3. Apply schema:
   - `pnpm --filter @avs/db db:migrate`
4. Seed dev data:
   - `pnpm --filter @avs/db db:seed`
5. Run dev services:
   - `pnpm dev`
6. Open app:
   - `http://localhost:3200`
   - Sign in with `founder@agentic.local` / `FounderPass!2026`

## Common scripts
- `pnpm dev` - run all workspace dev processes.
- `pnpm build` - build all packages/apps.
- `pnpm typecheck` - run TypeScript checks across workspaces.
- `pnpm lint` - run lint scripts across workspaces.

## API base
- Local API base URL: `http://localhost:4050/api/v1`
- Web dev URL: `http://localhost:3200`
- Health endpoint: `GET /health`
- Auth endpoints:
  - `POST /auth/register`
  - `POST /auth/login`
  - `GET /auth/me`
  - `POST /auth/logout`

## Database
- Initial SQL migration: `packages/db/migrations/0001_initial.sql`
- Root copy: `INITIAL_MIGRATIONS.sql`

## Planning docs added in this scaffold
- `REPO_STRUCTURE.md`
- `TASKS.md`
- `TECH_STACK.md`
- `OPENAPI.yaml`
- `CLAUDE_CODE_MASTER_PROMPT.md`
