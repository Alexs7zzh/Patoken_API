FROM node:14-slim AS BUILD_IMAGE

RUN apt-get update && apt-get upgrade -y && apt-get autoclean -y && apt-get autoremove -y && apt-get install openssl -y

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .
RUN npx prisma generate

FROM node:12-alpine

WORKDIR /usr/src/app

COPY --from=BUILD_IMAGE /usr/src/app .

EXPOSE 8000
CMD [ "node", "index.js" ]