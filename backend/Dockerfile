# backend/Dockerfile
FROM node:22-alpine
WORKDIR /app
RUN npm install -g npm@latest
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5023
CMD ["node", "src/index.js"]