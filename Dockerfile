FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build ứng dụng
RUN npm run build

# Expose port
EXPOSE 3000

# Start ứng dụng
CMD ["npm", "start"]