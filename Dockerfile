# --- Étape 1 : build avec bun (le projet utilise bun.lock, pas npm) ---
FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock bunfig.toml ./
RUN bun install
COPY . .
# Cible Node.js (le projet cible Cloudflare par défaut)
ENV NITRO_PRESET=node-server
RUN bun run build

# --- Étape 2 : exécution avec Node ---
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV NITRO_HOST=0.0.0.0
ENV PORT=80
ENV NITRO_PORT=80
COPY --from=build /app/.output ./.output
EXPOSE 80
CMD ["node", ".output/server/index.mjs"]
