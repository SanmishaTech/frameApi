# Use official Node.js image as build stage
FROM node:18 AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .

# Build the app (if using TypeScript)
RUN if [ -f tsconfig.json ]; then npm run build; fi

# Production image
FROM node:18-slim

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
# COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.env ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma

# Expose port (match your .env PORT)
EXPOSE 3000

# Start the app with migration
CMD npx prisma migrate deploy && npm start