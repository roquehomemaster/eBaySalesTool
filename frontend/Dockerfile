FROM node:16-alpine

# Set the working directory
WORKDIR /app

# Copy only package.json and package-lock.json first, then install dependencies
COPY package*.json ./
RUN npm install

# Install 'curl' for healthcheck and 'serve' to serve static build
RUN apk add --no-cache curl && npm install -g serve

# Copy the rest of the application files (excluding node_modules and build)
COPY . .

# Build the React app for production
RUN npm run build

# Expose the frontend port
EXPOSE 3000

# Serve the production build
CMD ["npx", "serve", "-s", "build", "-l", "3000"]