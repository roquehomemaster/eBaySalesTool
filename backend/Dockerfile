# Use Node.js 18 as the base image
FROM node:18-alpine

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
COPY database/seeds ./database/seeds

# Generate swagger.json inside the image (merge fragments)
RUN node scripts/generate_swagger.js || echo '{"paths":{}}' > swagger.json

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["node", "src/app.js"]