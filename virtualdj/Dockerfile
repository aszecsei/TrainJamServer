FROM node:alpine
EXPOSE 8080

WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
# Debug
RUN npm install
# Production
# RUN npm install --only=production

# Bundle app source
COPY . .

CMD ["node", "index.js"]
USER node