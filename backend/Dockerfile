# --- build stage ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
# If you have a build step (TypeScript, etc.), do it here:
# RUN npm run build

# --- runtime stage ---
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
# If you compiled to /app/dist, swap the CMD accordingly:
# For typical JS:
CMD ["node", "server.js"]
# Or for TypeScript build output:
# CMD ["node", "dist/server.js"]