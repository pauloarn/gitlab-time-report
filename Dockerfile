# =========================================
# Stage 1: Build the React/Vite Application
# =========================================
ARG NODE_VERSION=18-alpine
ARG NGINX_VERSION=stable-alpine

# Use a lightweight Node.js image for building
FROM node:${NODE_VERSION} AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package-related files first to leverage Docker's caching mechanism
COPY package.json package-lock.json ./

# Install project dependencies using npm ci (ensures a clean, reproducible install)
RUN --mount=type=cache,target=/root/.npm npm ci

# Copy the rest of the application source code into the container
COPY . .

# Build the React/Vite application (outputs to /app/dist)
RUN npm run build

# =========================================
# Stage 2: Prepare Nginx to Serve Static Files
# =========================================

FROM nginx:${NGINX_VERSION} AS production

# Copy the static build output from the build stage to Nginx's default HTML serving directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx config for SPA routing and optimization
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 to allow HTTP traffic
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 