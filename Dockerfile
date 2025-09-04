# Base image
FROM node:20.14.0 AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build TypeScript
RUN yarn build


# -----------------------------
# Production image
FROM node:20.14.0 AS runner

WORKDIR /usr/src/app

# Copy only needed files from builder
COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/yarn.lock ./
COPY --from=builder /usr/src/app/acme ./acme

# Install only production dependencies
RUN yarn install --frozen-lockfile --production

# Set environment variables
ARG PORT=9203
ENV PORT=${PORT}

# Expose port
EXPOSE ${PORT}

# Run app with yarn start (node ./acme/src/index.js)
CMD ["yarn", "start"]