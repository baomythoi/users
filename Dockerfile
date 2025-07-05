# Use the official Node.js image from the Docker Hub
FROM node:20.14.0

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and yarn.lock to the working directory
COPY package.json yarn.lock ./

# Install dependencies using Yarn
RUN yarn install

# Copy the rest of the application code to the working directory
COPY . .

# Build the application (if needed)
RUN yarn build

# Specify the directory containing the build output (adjust as per your application)
ARG BUILD_DIR=./acme

# Copy built files into the container
COPY ${BUILD_DIR} ./acme

# Expose the port the app runs on
ARG PORT=9003
ENV PORT=${PORT}
# EXPOSE ${PORT}

# Define the command to run the app
CMD ["yarn", "start"]
