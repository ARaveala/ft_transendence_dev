# --- build stage ---
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Many SPA builders respect VITE_* at build-time
ARG VITE_API_BASE=/api
ENV VITE_API_BASE=$VITE_API_BASE
RUN npm run build

# --- serve stage ---
FROM nginx:1.27-alpine
# Copy compiled SPA
COPY --from=build /app/dist /usr/share/nginx/html
# Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80