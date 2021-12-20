FROM node:16-slim

RUN apt-get update && apt-get upgrade -y && apt-get autoclean -y && apt-get autoremove -y && apt-get install openssl -y

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .
RUN npx prisma generate

EXPOSE 8000
CMD [ "node", "index.js" ]