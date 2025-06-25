FROM node:16-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Install 'serve' to serve static build
RUN npm install -g serve

# Copy the rest of the application files
COPY . /app

# Build the React app for production
RUN npm run build

# Expose the frontend port
EXPOSE 3000

# Serve the production build
CMD ["serve", "-s", "build", "-l", "3000"]