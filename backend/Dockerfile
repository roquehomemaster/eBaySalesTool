# Use Node.js 18 as the base image
FROM node:18-alpine

# Allow cache busting when seed files change
ARG SEED_VERSION=dev

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./ 

# Install dependencies
RUN npm install

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy only necessary files
COPY package*.json ./
COPY src ./src
# Copy seed version marker first (if exists) then full seeds to force layer invalidation when version changes
COPY database/seeds/.seed_version ./database/seeds/.seed_version
COPY database/seeds ./database/seeds

# Generate swagger.json inside the image (merge fragments)
RUN node scripts/generate_swagger.js || echo '{"paths":{}}' > swagger.json

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["node", "src/app.js"]