# =========================================
# Stage 1: Build the React/Vite Application
# =========================================
ARG NODE_VERSION=20-alpine

FROM node:${NODE_VERSION} AS builder

WORKDIR /app

# Install pnpm (pinned to v10)
RUN npm install -g pnpm@10

# Copy package-related files first to leverage Docker's caching mechanism
COPY package.json pnpm-lock.yaml .npmrc ./

# Install project dependencies using pnpm (ensures a clean, reproducible install)
RUN --mount=type=cache,target=/root/.pnpm-store pnpm install --frozen-lockfile

# Fail the build if any high or critical CVE is found in production dependencies
RUN pnpm audit --audit-level=high --prod

# Copy the rest of the application source code into the container
COPY . .

# Build the React/Vite application (outputs to /app/dist)
RUN pnpm build

# =========================================
# Stage 2: Serve static files with Brotli-capable Nginx
# =========================================
# APP_PORT defaults to 3000 (Dokploy / Traefik). Override at build time for local compose:
#   docker build --build-arg APP_PORT=8080 .
ARG APP_PORT=3000

FROM fholzer/nginx-brotli:v1.26.2 AS production

ARG APP_PORT=3000
ENV APP_PORT=${APP_PORT}

# Copy the static build output from the build stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx config and align listen port with APP_PORT
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN sed -i "s/listen 8080;/listen ${APP_PORT};/" /etc/nginx/conf.d/default.conf

# Set up directory permissions for non-root nginx user
RUN chown -R nginx:nginx /usr/share/nginx/html \
 && mkdir -p /var/cache/nginx /var/run/nginx \
 && touch /var/run/nginx.pid \
 && chown -R nginx:nginx /var/cache/nginx /var/run/nginx /var/run/nginx.pid

USER nginx

EXPOSE ${APP_PORT}

# Base image ENTRYPOINT is already ["nginx"]; only pass flags here.
CMD ["-g", "daemon off;"]

HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
  CMD ["sh", "-c", "curl -f http://127.0.0.1:$APP_PORT/health || exit 1"]
