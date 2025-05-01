# Use official Node.js image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the backend source code
COPY . .

# Expose the port your app runs on
EXPOSE 4000

# Start the backend using ts-node
CMD ["npx", "ts-node", "index.ts"]
