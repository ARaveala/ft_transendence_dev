<<<<<<< HEAD
# Use Node.js LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json + package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install 
RUN npm install -D @types/react @types/react-dom

# Copy the rest of the project
COPY . .

# Build for production (optional if just testing dev server)
# RUN npm run build

# Expose port for Vite dev server
EXPOSE 5173

# Run the dev server
CMD ["npm", "run", "dev", "--", "--host"]
=======
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
>>>>>>> database
