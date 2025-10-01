# ---- base ----
FROM node:20-slim AS base
WORKDIR /app
ENV NODE_ENV=production
# aprovechar fetch global (Node 18+)
RUN corepack enable

# ---- deps ----
FROM base AS deps
COPY package.json ./
RUN npm ci --omit=dev

# ---- build (no transpile) ----
FROM base AS build
COPY --from=deps /app/node_modules /app/node_modules
COPY . .
# no hay build step (ESM puro)

# ---- runtime ----
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends \
    dumb-init ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=build /app /app
# pm2-runtime
RUN npm i -g pm2@5
EXPOSE 3000
CMD ["dumb-init","pm2-runtime","ecosystem.config.cjs"]
