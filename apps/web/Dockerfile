# syntax=docker/dockerfile:1

ARG APP_DIR_NAME=apps/web
ARG APP_PKG_NAME=@activityrank/web

FROM node:24-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable
RUN pnpm add -g turbo@^2

FROM base AS pruner
ARG APP_PKG_NAME

WORKDIR /app
COPY . .

# Generate a partial monorepo with a pruned lockfile for a target workspace.
RUN pnpm exec turbo prune $APP_PKG_NAME --docker

FROM base AS installer
WORKDIR /app

COPY --from=pruner /app/out/json/ .

FROM installer AS deps
WORKDIR /app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM base AS builder
ARG APP_PKG_NAME

ARG COMMIT_HASH
ENV PUBLIC_COMMIT_HASH=$COMMIT_HASH

WORKDIR /app
COPY --from=pruner /app/out/full/ .
COPY --from=deps /app/ .
COPY turbo.json turbo.json
RUN pnpm run --filter=$APP_PKG_NAME... build 
# Delete node_modules; they are only used for the `build` command 
# and we don't want them included in the copy in the `runner` stage
RUN find . -name "node_modules" -type d -prune -exec rm -r '{}' +

FROM base AS runner
ARG APP_DIR_NAME
# ARGs are only available at compile time, so they don't work in CMD instructions
ENV APP_PATH="$APP_DIR_NAME/build/index.js"

ENV NODE_ENV=production
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 ar
RUN adduser --system --uid 1001 activityrank
USER activityrank

COPY --from=builder --chown=activityrank:ar /app .

CMD exec node $APP_PATH
