# Stage 1: Development
FROM node:20-alpine AS development

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies including devDependencies
RUN npm install

# Copy source code
COPY . .

# Build app
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built files from development stage
COPY --from=development /usr/src/app/dist ./dist

# Expose port
EXPOSE 3000

# Set NODE_ENV
ENV NODE_ENV=production

# Start application
CMD ["npm", "run", "start:prod"]