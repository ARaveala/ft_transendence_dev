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

FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev
RUN npm i @fastify/static

# Optional: sqlite CLI for debugging
RUN apt-get update && apt-get install -y --no-install-recommends sqlite3 curl && rm -rf /var/lib/apt/lists/*

COPY . .
RUN mkdir -p data
RUN chmod 777 data

# # Expose the port Fastify listens on
EXPOSE 3000

ENV NODE_ENV=production \
    DB_DIR=/app/data \
    DB_FILE=app.sqlite \
    INIT_SQL=/app/database/init.sql \
    SECRETS_FILE=/run/secrets/app.env

COPY ./tools/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
# CMD [ "node", "server.js" ]
