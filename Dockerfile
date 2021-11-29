FROM node:lts-slim as builder

# LABEL version="2.0.0"
# LABEL description="Example Fastify (Node.js) webapp Docker Image"
# LABEL maintainer="Sandro Martini <sandro.martini@gmail.com>"

RUN apt-get update && apt-get upgrade -y && apt-get autoclean -y && apt-get autoremove -y

RUN groupadd -r nodejs && useradd -g nodejs -s /bin/bash -d /home/nodejs -m nodejs
USER nodejs
RUN mkdir -p /home/nodejs/app/node_modules && chown -R nodejs:nodejs /home/nodejs/app

WORKDIR /home/nodejs/app

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

ENV NPM_CONFIG_LOGLEVEL=warn

COPY package*.json ./

RUN npm install && npm cache clean --force

COPY --chown=nodejs:nodejs . .

RUN npx prisma generate && npx prisma db push

EXPOSE 8000

CMD [ "node", "./index.js" ]