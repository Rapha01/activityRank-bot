FROM node:18 AS base
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci
COPY .swcrc ./

FROM base AS builder
COPY src /usr/src/app/src
RUN npm run build

FROM node:18-slim AS production
ENV NODE_ENV production
USER node
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci --production
COPY --from=builder /usr/src/app/dist ./dist
