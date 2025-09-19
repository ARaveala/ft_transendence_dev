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
FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# Optional: sqlite CLI for debugging
RUN apt-get update && apt-get install -y --no-install-recommends sqlite3 && rm -rf /var/lib/apt/lists/*

COPY . .
RUN mkdir -p /app/data

# # Expose the port Fastify listens on
EXPOSE 3000

ENV NODE_ENV=production \
    DB_DIR=/app/data \
    DB_FILE=app.sqlite \
    INIT_SQL=/app/database/init.sql

CMD ["node", "server.js"]