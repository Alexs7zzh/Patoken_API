FROM node:lts-slim

RUN apt update && apt upgrade -y && apt autoclean -y && apt autoremove -y
RUN apt install libssl-dev

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npx prisma migrate deploy
EXPOSE 8000
CMD [ "node", "index.js" ]