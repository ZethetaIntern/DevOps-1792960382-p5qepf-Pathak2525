# Backend image. Build from repo root:  docker build -f infrastructure/docker/Dockerfile -t paysecure-dr-api .
FROM node:20-alpine AS deps
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --omit=dev

FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY backend/ ./
COPY runbooks/ /runbooks/
USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:5000/api/health || exit 1
CMD ["node", "src/server.js"]
