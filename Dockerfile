# Stage 1: Build Next.js
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Stage 2: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Install Python3, SQLite, and Python requests package for the campaign runner
RUN apk add --no-cache python3 py3-pip py3-requests sqlite

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000

# Create log directory inside container
RUN mkdir -p /app/logs

# Copy files from builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/creator_agent ./creator_agent
COPY --from=builder /app/data ./data
COPY --from=builder /app/start-production.js ./start-production.js

EXPOSE 3000

CMD ["npm", "start"]
