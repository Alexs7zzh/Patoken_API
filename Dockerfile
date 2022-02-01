FROM node:16-alpine AS deps
RUN apk add --no-cache curl libc6-compat openssl \
    && curl -sL https://unpkg.com/@pnpm/self-installer | node
WORKDIR /app
COPY package.json pnpm-lock.yaml prisma ./
RUN pnpm install --frozen-lockfile --prod

FROM node:16-alpine AS runner
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 8000
CMD [ "node", "index.js" ]