# TECH_STACK.md

## Core Stack
- Package manager: `pnpm`
- Monorepo/build orchestration: `turbo`
- Language: `TypeScript`
- Web app: `Next.js` (App Router)
- API server: `Fastify`
- Validation: `zod`
- Database: `PostgreSQL` (`pg` driver)
- Agent runtime: custom TS package with typed registry/runtime

## Why this stack
- Fast local loops with clear workspace boundaries.
- Shared contracts and schemas reduce web/api drift.
- Fastify gives high-performance API + plugin ecosystem.
- Postgres maps cleanly to your existing schema and event model.
