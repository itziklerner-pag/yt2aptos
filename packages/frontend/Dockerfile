FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/frontend/package*.json ./packages/frontend/

# Install dependencies
RUN npm ci

# Copy source code
COPY tsconfig.json .eslintrc.js .prettierrc ./
COPY packages/shared/ ./packages/shared/
COPY packages/frontend/ ./packages/frontend/

# Build packages
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=packages/frontend

# Production stage with Nginx
FROM nginx:alpine

# Copy the build output
COPY --from=builder /app/packages/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]