FROM node:20-alpine

WORKDIR /app

# Upgrade npm to latest version
RUN npm install -g npm@11.12.0

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Start development server with dependency check
CMD ["sh", "-c", "npm install && npm run dev -- --host 0.0.0.0"]
