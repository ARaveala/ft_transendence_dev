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
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install prod deps first for better layer caching
COPY package*.json ./
RUN npm ci --omit=dev
RUN apk add --no-cache sqlite

# Copy the rest of your code
# If your files live under src/, database/, migrations/, etc., copy them all
COPY . .

# Ensure the data directory exists (SQLite lives here)
RUN mkdir -p /app/data

# Default command can be your API; we’ll override it to run the smoke test
CMD ["node", "src/server.js"]