FROM node:18-alpine
WORKDIR /app

# Npm'i güncelle
RUN npm install -g npm@latest

COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5023
CMD ["node", "src/index.js"]