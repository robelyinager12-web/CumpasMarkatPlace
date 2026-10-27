FROM node:22-alpine AS build
RUN corepack enable && corepack prepare pnpm@10 --activate && apk add --no-cache openssl
WORKDIR /repo
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared packages/shared
RUN pnpm install --frozen-lockfile --filter @unikamp/api...
COPY apps/api apps/api
RUN pnpm --filter @unikamp/api build

FROM node:22-alpine
RUN corepack enable && corepack prepare pnpm@10 --activate && apk add --no-cache openssl
WORKDIR /repo
COPY --from=build /repo /repo
ENV NODE_ENV=production
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s CMD wget -qO- "http://localhost:${PORT:-4000}/api/v1/health" || exit 1
# Applies database migrations, then starts the server
CMD ["pnpm", "--filter", "@unikamp/api", "start:prod"]