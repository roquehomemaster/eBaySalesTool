# Use a compatible Node.js version
FROM node:16-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the backend code
COPY ./src ./src

# Expose the backend port
EXPOSE 5000

# Start the backend server
CMD ["node", "src/app.js"]