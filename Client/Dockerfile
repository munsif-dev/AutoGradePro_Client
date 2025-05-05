# autogradepro-frontend/Dockerfile
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps flag
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files - fixed path for standard Next.js output
COPY --from=builder /app/.next/static /usr/share/nginx/html/_next/static
COPY --from=builder /app/public /usr/share/nginx/html/public
COPY --from=builder /app/node_modules /usr/share/nginx/html/node_modules
COPY --from=builder /app/package.json /usr/share/nginx/html/package.json
COPY --from=builder /app/.next/server /usr/share/nginx/html/.next/server

# Create a simple startup script
COPY --from=builder /app/next.config.mjs /usr/share/nginx/html/next.config.mjs

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]