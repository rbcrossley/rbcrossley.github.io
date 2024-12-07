# Use Node.js as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if present)
COPY package*.json ./

# Install dependencies
RUN npm install

# Install the latest version of Astro globally (if needed)
RUN npm install -g create-astro@latest

# Copy the rest of the application code
COPY . .

# Expose the port that the app runs on
EXPOSE 4321

# Command to start the application
CMD ["npm", "run", "dev"]

