# ---- base ----
FROM node:20-slim AS base
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable   # activa pnpm/yarn/bun

# ---- deps ----
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# ---- build (ESM puro, no transpile) ----
FROM base AS build
COPY --from=deps /app/node_modules /app/node_modules
COPY . .

# ---- runtime ----
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends \
    dumb-init ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=build /app /app
RUN npm i -g pm2@5
EXPOSE 3338
CMD ["dumb-init","pm2-runtime","ecosystem.config.cjs"]
