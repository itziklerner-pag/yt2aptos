FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/backend/package*.json ./packages/backend/

# Install dependencies
RUN npm ci

# Copy source code
COPY tsconfig.json .eslintrc.js .prettierrc ./
COPY packages/shared/ ./packages/shared/
COPY packages/backend/ ./packages/backend/

# Build packages
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=packages/backend

# Production stage
FROM node:18-alpine

WORKDIR /app

# Set NODE_ENV
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/backend/package*.json ./packages/backend/

# Install production dependencies only
RUN npm ci --production

# Copy built files from builder stage
COPY --from=builder /app/packages/shared/dist/ ./packages/shared/dist/
COPY --from=builder /app/packages/backend/dist/ ./packages/backend/dist/

# Create storage directory
RUN mkdir -p storage logs

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "packages/backend/dist/index.js"]