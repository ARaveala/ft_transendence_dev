# # Use official Node.js image
# FROM node:20

# # Create app directory
# WORKDIR /app


# COPY package*.json ./
# # install dependencies
# # npm install installs all dependencies , they need ot be cleaned up 
# RUN apt update && npm install 

# # Copy the rest of the app from file systems to the continaer ie(project/*)
# # ignoring README.md and node_modules? dockerignore
# COPY . /app

# # Expose the port Fastify listens on
# EXPOSE 3000

# # Start the server
# CMD ["node", "server.js"]

# --- build/runtime image ---
# FROM node:20-alpine
# WORKDIR /app
# COPY package*.json ./
# RUN npm ci --omit=dev
# RUN apk add --no-cache sqlite
# COPY . .
# RUN mkdir -p /app/data
# ENV NODE_ENV=production DB_DIR=/app/data DB_FILE=app.sqlite INIT_SQL=/app/database/init.sql
# EXPOSE 3000
# CMD ["node", "server.js"]

# --- Stage 1: Install and prepare backend ---
FROM node:20-bookworm-slim

# Set working directory inside the container
WORKDIR /app

# Copy dependency files first (for better layer caching)
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# (Optional) If you need static file serving (e.g., frontend assets)
RUN npm install @fastify/static

# (Optional) SQLite CLI for debugging inside the container
# You can remove this in final submission if not needed
RUN apt-get update && apt-get install -y --no-install-recommends sqlite3 && rm -rf /var/lib/apt/lists/*

# Copy the rest of the backend source
COPY . .

# Ensure a persistent data directory for SQLite database
RUN mkdir -p /app/data

# Environment variables for production
ENV NODE_ENV=production \
    PORT=3000 \
    DB_DIR=/app/data \
    DB_FILE=app.sqlite \
    INIT_SQL=/app/database/init.sql

# Expose Fastify port
EXPOSE 3000

# Start the Fastify server
CMD ["node", "server.js"]
