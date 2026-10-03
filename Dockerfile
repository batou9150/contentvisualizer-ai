# syntax=docker/dockerfile:1

# ---- Build the client bundle ----
FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Production dependencies only ----
FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- Runtime ----
FROM node:24-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
COPY src/server ./src/server
COPY src/shared ./src/shared
# Node 24 runs the TypeScript server directly (type stripping), so there is no server build step.
USER node
EXPOSE 3000
CMD ["node", "src/server/index.ts"]
