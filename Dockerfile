FROM node:18 as base
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci
COPY .swcrc ./

FROM base as builder
COPY src /usr/src/app/src
RUN npm run build

FROM node:18-slim as production
ENV NODE_ENV production
USER node
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci --production
COPY --from=builder /usr/src/app/dist ./dist
