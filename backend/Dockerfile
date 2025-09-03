# ---- Base image ----
FROM node:18-alpine

# Make sure logs flush promptly
ENV NODE_ENV=production \
    NPM_CONFIG_UPDATE_NOTIFIER=false

# Create app directory
WORKDIR /app

# Install OS packages:
# - sqlite: CLI for inspecting the DB inside the container
# - python3, make, g++: needed if any native modules (e.g., sqlite3/bcrypt) need to compile
# - libc6-compat: improves compatibility for some prebuilt binaries
RUN apk add --no-cache sqlite python3 make g++ libc6-compat

# Install dependencies first (better layer caching)
# If you use npm:
COPY package*.json ./
RUN npm install --omit=dev

# If you use yarn or pnpm, swap the above two lines accordingly:
# COPY yarn.lock package.json ./
# RUN yarn --production
# or
# COPY pnpm-lock.yaml package.json ./
# RUN corepack enable && pnpm i --prod

# Copy the rest of your app
COPY . .

RUN mkdir -p /app/data && chown -R node:node /app/data
# Optional: run as non-root user
# Alpine's node image includes a 'node' user
USER node

# Expose your app port (adjust if your server uses another)
EXPOSE 3000

# Start your server
CMD ["node", "server.js"]