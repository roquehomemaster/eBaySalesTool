# Use Node.js as the base image for the backend
FROM node:16-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY backend/package*.json ./
RUN npm install

# Copy the rest of the backend code
COPY backend/ ./

# Expose the backend port
EXPOSE 5000

# Start the backend server
CMD ["npm", "start"]
