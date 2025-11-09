## Use Node.js LTS image
#FROM node:20-bookworm-slim
#
#RUN apt-get update && apt-get install -y --no-install-recommends sqlite3 curl && rm -rf /var/lib/apt/lists/*
#
## Set working directory
#WORKDIR /app
#
## Copy package.json + package-lock.json
#COPY package*.json ./
#
## Install dependencies
#RUN npm install
#
## Copy the rest of the project
#COPY . .
#
## Expose the Vite dev server port
#EXPOSE 5173
#
## Run the dev server (Vite)
#CMD ["npm", "run", "dev"]

FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends sqlite3 curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

RUN npm install -g serve
EXPOSE 5174
CMD ["serve", "-s", "dist", "-l", "5174"]
