FROM node:18-bullseye-slim

ENV LAST_UPDATED 2022-11-09-1237

ENV NODE_ENV production
ENV ENV production

RUN apt-get update
RUN apt-get install -y build-essential unzip nasm libtool make bash git autoconf wget zlib1g-dev python3

COPY . /app

# Change working directory
WORKDIR /app

# Install dependencies
RUN npm install

# Expose API port to the outside
EXPOSE 3000

# Add startup script
CMD [ "node", "build/index.js" ]