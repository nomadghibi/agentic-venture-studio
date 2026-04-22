# REPO_STRUCTURE.md

## Monorepo Goal
Production-minded MVP foundation for an AI-native venture studio with shared contracts, typed APIs, and a runnable dashboard + API.

## Structure
```text
agentic-venture-studio/
├─ apps/
│  ├─ web/
│  └─ api/
├─ packages/
│  ├─ types/
│  ├─ db/
│  ├─ agents/
│  └─ config/
├─ docs/
│  ├─ product/
│  ├─ architecture/
│  ├─ api/
│  ├─ prompts/
│  └─ operations/
├─ .github/workflows/
├─ package.json
├─ pnpm-workspace.yaml
├─ turbo.json
└─ tsconfig.base.json
```

## Design Rules
- Keep domain contracts in `packages/types`.
- Keep DB migrations in `packages/db/migrations`.
- Keep agent runtime logic in `packages/agents`.
- Keep `apps/api` thin and orchestration-focused.
- Keep `apps/web` feature-organized and typed against shared contracts.
