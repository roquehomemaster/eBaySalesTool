FROM node:16-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Ensure node_modules is excluded
COPY . /app
RUN rm -rf node_modules

RUN apk add --no-cache curl

# Ensure dependencies are installed before starting the application
RUN npm install react-router-dom axios

# Expose the frontend port
EXPOSE 3000

# Start the frontend server
CMD ["npm", "start"]