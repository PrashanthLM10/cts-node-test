# Use the official Node.js image as the base image
FROM node:18

ENV NODE_ENV=production

# Set the working directory in the container
WORKDIR /app

# Copy the application files into the working directory
COPY . /app

# Install the application dependencies
RUN npm install --production

ENV PORT 8080

# Expose port to look for incoming TCP requests
EXPOSE 3000

# Define the entry point for the container
CMD ["npm", "start"]
