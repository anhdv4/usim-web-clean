FROM node:18-alpine

WORKDIR /app

# Install system dependencies for Puppeteer Chrome
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    curl \
    && rm -rf /var/cache/apk/*

# Set Puppeteer to use the installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

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