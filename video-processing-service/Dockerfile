# STAGE 1 : BUILD STAGE
FROM node:18 AS builder

# Set the working directory in the container to /app
WORKDIR /app 

# Copy package.json and package-lock.json into the working directory
COPY package*.json ./

# Install any needed packages
RUN npm install

# Copy app source inside the container including src folder and the rest of the files
COPY . .

# Build the app 
RUN npm run build

# STAGE 2 : PRODUCTION STAGE
FROM node:18

#Install ffmpeg in the container
RUN apt-get update && apt-get install -y ffmpeg

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json into the working directory
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy built app from the builder stage
COPY --from=builder /app/dist ./dist

# Make port 3000 available outside this container
EXPOSE 3000

# defint the command to run your application using CMD which defines your runtime
CMD [ "npm" , "run", "serve" ]