# Use Node.js 18 as the base image
FROM node:18-alpine

# Allow cache busting when seed files change
ARG SEED_VERSION=dev

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies (use npm ci if lock present for deterministic builds)
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy source
COPY src ./src
# Include backend scripts (swagger generation, validation, build helpers)
COPY scripts ./scripts
# Include root-level models directory (contains ebayIntegrationModels.js consolidated definitions)
COPY models ./models
# Copy seed version marker first (if exists) then full seeds to force layer invalidation when version changes
COPY database/seeds/.seed_version ./database/seeds/.seed_version
COPY database/seeds ./database/seeds

# Generate and validate swagger.json inside the image (merge fragments)
RUN node scripts/generate_swagger.js && node scripts/validate_swagger.js

# Expose the actual application port (Express defaults to 5000 in app.js)
EXPOSE 5000

# Start the application
CMD ["node", "src/app.js"]