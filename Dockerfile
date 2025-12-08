FROM node:20-alpine

WORKDIR /app

# Install dependencies (include dev so tsx loader is available)
COPY package*.json ./
RUN npm ci --include=dev

# Copy source
COPY . .

ENV NODE_ENV=production
ENV PORT=5174
EXPOSE 5174

# Start the TypeScript server with tsx (Node 20+ needs --import)
CMD ["npm", "start"]

