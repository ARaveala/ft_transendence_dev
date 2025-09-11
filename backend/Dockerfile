# Use official Node.js image
FROM node:20

# Create app directory
WORKDIR /app


COPY package*.json ./
# install dependencies
# npm install installs all dependencies , they need ot be cleaned up 
RUN apt update && npm install 

# Copy the rest of the app from file systems to the continaer ie(project/*)
# ignoring README.md and node_modules? dockerignore
COPY . /app

# Expose the port Fastify listens on
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
