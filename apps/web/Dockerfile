FROM node:22-alpine AS base
RUN npm install -g pnpm
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/types/package.json packages/types/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY packages/types packages/types
COPY apps/web apps/web
COPY tsconfig.base.json ./
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV DOCKER_BUILD=true
RUN pnpm --filter @avs/types build
RUN pnpm --filter @avs/web build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public

EXPOSE 3200
ENV PORT=3200
ENV HOSTNAME=0.0.0.0
CMD ["node", "apps/web/server.js"]
