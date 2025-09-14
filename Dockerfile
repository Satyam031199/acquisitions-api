# syntax=docker/dockerfile:1.7

# --- Base image for running and building ---
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Set production environment by default
ENV NODE_ENV=production \
    PORT=3000

# Use a non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S node -u 1001 -G nodejs

# --- Dependencies layer ---
FROM base AS deps

# Install dependencies using a clean, reproducible install
COPY package*.json ./
RUN npm ci --omit=dev

# --- Production image ---
FROM base AS runner

# Copy dependency tree
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Expose app port
EXPOSE 3000

# Healthcheck hitting the built-in /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT}/health || exit 1

# Switch to non-root user
USER node

CMD ["npm", "start"]
