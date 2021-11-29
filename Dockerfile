FROM node:lts-slim

RUN apt-get update && apt-get upgrade -y && apt-get autoclean -y && apt-get autoremove -y
RUN apt-get -y install libssl-dev

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npx prisma migrate deploy
EXPOSE 8000
CMD [ "node", "index.js" ]