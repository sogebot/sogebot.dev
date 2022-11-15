FROM node:18-alpine

ENV LAST_UPDATED 2022-11-09-1237

ENV NODE_ENV production
ENV ENV production

COPY . /app

# Change working directory
WORKDIR /app

# Install dependencies
RUN npm install

# Expose API port to the outside
EXPOSE 3000

# Add startup script
CMD [ "node", "build/index.js" ]