# --- Stage 1: Build the frontend ---
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy dependencies manifests
COPY package*.json ./

# Install dependencies (using CI mode for reproducibility)
RUN npm ci

# Copy the rest of the source code
COPY . .

# Set environment variable for API base (used at build time)
# This URL points to the backend service name in docker-compose
ARG VITE_API_BASE_URL=http://backend:3000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build for production
RUN npm run build


# --- Stage 2: Serve using Nginx ---
FROM nginx:alpine

# Copy the built React files from previous stage
COPY --from=build /app/dist /usr/share/nginx/html

# (Optional) Replace default Nginx config to support SPA routing
# This ensures react-router works properly on reload
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 to the outside world
EXPOSE 80

# Run Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
