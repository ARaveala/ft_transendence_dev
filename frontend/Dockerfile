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
CMD ["npm", "run", "dev"]
