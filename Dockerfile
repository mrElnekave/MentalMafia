# Use the official Node.js LTS image as a base
FROM node:lts

# Set the working directory in the container
WORKDIR /usr/app

# Copy the package.json and package-lock.json to install dependencies
COPY ../package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the container
COPY ./sum ./sum

# Expose the port that the JIFF server will run on
EXPOSE 8080

# Move to the sum directory
WORKDIR /usr/app/sum

# Run the server
CMD ["node", "server.js"]