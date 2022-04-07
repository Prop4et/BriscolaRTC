FROM node:17-alpine3.14
WORKDIR /app
COPY ./server/package.json /app
RUN npm install
COPY ./server /app
CMD node server.js