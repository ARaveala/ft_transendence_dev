# ---------- Stage 1: Build the main frontend ----------
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install main frontend dependencies
COPY package*.json ./
RUN npm install

# Copy the frontend source (Vite)
COPY . .

# Build the main frontend
RUN npm run build

# ---------- Stage 2: Final image ----------
FROM nginx:stable-alpine AS production

# Copy built main frontend
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy pre-compiled Pong game files
COPY frontend/pong_game/script.js /usr/share/nginx/html/pong_game/script.js
COPY frontend/pong_game/index.html /usr/share/nginx/html/pong_game/index.html
COPY frontend/pong_game/powerup.js /usr/share/nginx/html/pong_game/powerup.js
COPY frontend/pong_game/pong-server.js /usr/share/nginx/html/pong_game/pong-server.js

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
