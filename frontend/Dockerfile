# syntax=docker/dockerfile:1.7

# =====================================================================
# Frontend image — React + TypeScript + Vite, served by Nginx.
# Build from the project root:   docker build -f frontend/Dockerfile .
# =====================================================================

ARG NODE_VERSION=20-alpine
ARG NGINX_VERSION=1.27-alpine

# -------- builder ----------------------------------------------------
FROM node:${NODE_VERSION} AS builder

WORKDIR /build

# Install dependencies first (cache-friendly).
COPY frontend/package.json frontend/package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy the rest of the source and build.
COPY frontend/ ./
RUN npm run build

# -------- runtime (nginx) -------------------------------------------
FROM nginx:${NGINX_VERSION} AS runtime

# Drop the default site, install ours.
RUN rm /etc/nginx/conf.d/default.conf
COPY frontend/nginx.conf /etc/nginx/conf.d/app.conf

# Copy the production bundle.
COPY --from=builder /build/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
