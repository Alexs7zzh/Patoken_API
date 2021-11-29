FROM node:lts-slim

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npx prisma db push
EXPOSE 8000
CMD [ "node", "index.js" ]