# Use Node.js version >=18 to match backend requirements
FROM node:18-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package*.json ./`
RUN npm install

# Copy the rest of the backend code
COPY ./src ./src

# Ensure project-config.json is included in the Docker build context
COPY ../project-config.json /usr/src/project-config.json

# Expose the backend port
EXPOSE 5000

# Start the backend server
CMD ["node", "src/app.js"]