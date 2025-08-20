# Use official Node.js image
FROM node:20

# Create app directory
WORKDIR /app


COPY package*.json ./
# install dependencies
# there is a way to install all the dependencies listed in package.json?
RUN apt update && npm install && npm install -y sqlite3 && apt install nodejs npm - y &&\
	npm install fastify && \
	npm install module-alias --save

#	npm install fastify-cors && \
#	npm install fastify-static && \
#	npm install fastify-formbody && \
#	npm install fastify-helmet && \
#	npm install fastify-rate-limit && \
#	npm install fastify-swagger && \
#	npm install dotenv && \



# Copy the rest of the app from file systems to the continaer ie(project/*)
# ignoring README.md and node_modules? dockerignore
COPY . .

# Expose the port Fastify listens on
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
