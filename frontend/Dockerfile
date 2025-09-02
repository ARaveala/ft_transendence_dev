# --- build stage ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# For React/Vite/Vue/etc.
# Set VITE_API_BASE to match Nginx location (/api) if needed by your app.
ARG VITE_API_BASE=/api
ENV VITE_API_BASE=$VITE_API_BASE
RUN npm run build

# --- serve stage ---
FROM nginx:1.27-alpine
# Copy your app build (adjust path for your framework)
COPY --from=build /app/dist /usr/share/nginx/html
# Nginx config with reverse proxy to backend
COPY nginx.conf /etc/nginx/conf.d/default.conf