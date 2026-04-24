FROM node:22-alpine AS base
RUN npm install -g pnpm
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/types/package.json packages/types/
COPY packages/db/package.json packages/db/
COPY packages/agents/package.json packages/agents/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY packages/types packages/types
COPY packages/db packages/db
COPY packages/agents packages/agents
COPY apps/api apps/api
COPY tsconfig.base.json ./
RUN pnpm --filter @avs/types build
RUN pnpm --filter @avs/db build
RUN pnpm --filter @avs/agents build
RUN pnpm --filter @avs/api build

FROM base AS runner
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/packages/types/dist ./packages/types/dist
COPY --from=build /app/packages/types/package.json ./packages/types/package.json
COPY --from=build /app/packages/db/dist ./packages/db/dist
COPY --from=build /app/packages/db/package.json ./packages/db/package.json
COPY --from=build /app/packages/db/src/migrations ./packages/db/src/migrations
COPY --from=build /app/packages/agents/dist ./packages/agents/dist
COPY --from=build /app/packages/agents/package.json ./packages/agents/package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY pnpm-workspace.yaml package.json ./

EXPOSE 4050
CMD ["node", "apps/api/dist/server.js"]
