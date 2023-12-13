FROM node:18-slim as production
ENV NODE_ENV production
USER node
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci --production
COPY dist ./dist
