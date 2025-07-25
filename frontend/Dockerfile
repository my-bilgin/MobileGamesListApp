# frontend/Dockerfile - Sadece build aşaması
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN ls -l /app/src
RUN npm run build
# Build çıktısını volume'a kopyala
RUN cp -r dist/* /app/dist/ || true
# Sadece build tamamlandığını belirtmek için basit bir komut
CMD ["echo", "Build completed"] 