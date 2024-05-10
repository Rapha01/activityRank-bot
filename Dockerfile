FROM node:20-slim as base
ENV NODE_ENV=production
WORKDIR /app
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/releases ./.yarn/releases

# base dependencies
FROM base as deps
RUN yarn install --immutable

# Install production dependencies
FROM base as production-deps
WORKDIR /app

COPY --from=deps /app/node_modules /app/node_modules
RUN yarn workspaces focus --production

# Build
FROM base as build
WORKDIR /app

COPY --from=deps /app/node_modules /app/node_modules

COPY . .
RUN yarn build

FROM base
WORKDIR /app

COPY --from=production-deps /app/node_modules /app/node_modules

COPY --from=build /app/src/assets /app/dist/assets
COPY --from=build /app/dist /app/dist
COPY --from=build /app/package.json /app/package.json

EXPOSE 3000
ENV PORT 3000

ENTRYPOINT [ "yarn", "serve" ]
