# Use Node.js 18 as the base image
FROM node:18-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./ 

# Install dependencies
RUN npm install

# Copy only necessary files
COPY package*.json ./
COPY src ./src
COPY database/seeds ./database/seeds

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["node", "src/app.js"]