FROM node:21-slim AS build-stage

ARG APP_DIR=/app
ARG SITE_URL=http://localhost:8080
ENV SITE_URL=${SITE_URL}

WORKDIR ${APP_DIR}

# Self-host builds do not need Chromium/Puppeteer prerendering.
ENV SELF_HOST=true
ENV PUPPETEER_SKIP_DOWNLOAD=true

# Install dependencies
COPY package*.json ./
COPY packages/ui/package.json ./packages/ui/
COPY packages/types/package.json ./packages/types/
COPY packages/backend/package.json ./packages/backend/

RUN npm install

# Copy source and build frontend
COPY . .
RUN npm run build:ui

FROM nginx:alpine AS production-stage

COPY --from=build-stage /app/packages/ui/dist /app
COPY nginx.selfhost.conf /etc/nginx/nginx.conf
