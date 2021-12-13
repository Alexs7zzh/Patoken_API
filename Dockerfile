FROM node:lts-slim

RUN apt-get update && apt-get upgrade -y && apt-get autoclean -y && apt-get autoremove -y && apt-get -y --no-install-recommends install libssl-dev

WORKDIR /usr/src/app
COPY . .
RUN npm ci && npx prisma generate && npx prisma migrate deploy
EXPOSE 8000
CMD [ "node", "index.js" ]