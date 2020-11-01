FROM node:12
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY ./src/package*.json ./
RUN npm install
COPY ./src .
