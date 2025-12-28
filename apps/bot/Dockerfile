# syntax=docker/dockerfile:1

ARG APP_DIR_NAME=apps/bot
ARG APP_PKG_NAME=@activityrank/bot

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

ENV NODE_ENV=production
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

COPY --from=pruner /app/out/full/ .

FROM base AS runner
ARG APP_DIR_NAME
# ARGs are only available at build time, so they don't work in CMD instructions
ENV APP_PATH="$APP_DIR_NAME/src/app.ts"
ENV NODE_ENV=NOT-PROD
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 ar
RUN adduser --system --uid 1001 activityrank
USER activityrank

COPY --from=installer --chown=activityrank:ar /app .

CMD exec node $APP_PATH
