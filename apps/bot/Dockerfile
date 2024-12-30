# syntax=docker/dockerfile:1

ARG NODE_VERSION=20.17
ARG APP_DIR_NAME=apps/bot
ARG APP_PKG_NAME=@activityrank/bot

FROM node:${NODE_VERSION}-slim AS base
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
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml

# First install the dependencies (as they change less often)
FROM installer AS dev-deps
WORKDIR /app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM installer AS production-deps
WORKDIR /app
ENV NODE_ENV=production
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS builder
ARG APP_PKG_NAME

WORKDIR /app
COPY --from=pruner /app/out/full/ .
COPY --from=dev-deps /app/ .
COPY turbo.json turbo.json
RUN pnpm run --filter=$APP_PKG_NAME... build 
# Delete node_modules; they are only used for the `build` command 
# and we don't want them included in the copy in the `runner` stage
RUN find . -name "node_modules" -type d -prune -exec rm -r '{}' +

FROM base AS runner
ARG APP_DIR_NAME
# ARGs are only available at compile time, so they don't work in CMD instructions
ENV APP_PATH="$APP_DIR_NAME/dist/app.js"
ENV NODE_ENV=production
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 ar
RUN adduser --system --uid 1001 activityrank
USER activityrank

COPY --from=builder --chown=activityrank:ar /app .
COPY --from=production-deps --chown=activityrank:ar /app .

CMD exec node $APP_PATH
