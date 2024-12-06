# Use Node.js as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if present)
COPY package*.json ./

# Install dependencies
RUN npm ci

# Ensure Astro is globally available (optional, only if globally needed)
RUN npm install -g astro@latest

# Copy the rest of the application code
COPY . .

# Build the Astro site
RUN npm run build

# # Expose the `dist` directory for the host system
# VOLUME ["/app/dist"]

# Default command (for local testing, not used in CI)
CMD ["npm", "run", "dev"]
