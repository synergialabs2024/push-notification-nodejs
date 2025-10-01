# ---------- Builder ----------
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN npm ci --omit=dev
# Si usas pnpm, en lugar de la línea anterior:
# RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile --prod

# ---------- Runtime ----------
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules /app/node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
