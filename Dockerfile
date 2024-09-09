# Use BunJS official image as the base image
FROM oven/bun:latest

# Set the working directory in the container
WORKDIR /app

# Copy package.json and bun.lockb (for dependencies) to the working directory
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install

# Copy the rest of your application code
COPY . .

# Expose the port that BunJS runs on (7331 in your case)
EXPOSE 7331

# Set the command to run the BunJS application
CMD ["bun", "run", "start"]
