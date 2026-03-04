# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src
COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npx prisma generate

RUN npm run build

# Production stage
FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/generated/prisma ./src/generated/prisma
COPY prisma ./prisma
COPY .env ./.env

EXPOSE 3000

RUN npm install -g prisma
# Colocar seed depois
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]