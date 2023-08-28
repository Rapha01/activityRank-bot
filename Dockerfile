FROM node:16 as base
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci
COPY src .swcrc ./

FROM base as builder
RUN npm run build

FROM node:16-slim as production
ENV NODE_ENV production
USER node
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci --production
COPY --from=builder /usr/src/app/dist ./dist
