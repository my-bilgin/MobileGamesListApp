# frontend/Dockerfile - Build ve volume kopyalama
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN ls -l /app/src
RUN npm run build
# Build çıktısını container içinde tut
RUN mkdir -p /app/build-output && cp -r dist/* /app/build-output/
# Container başladığında build çıktısını volume'a kopyala ve sürekli çalış
CMD ["sh", "-c", "cp -r /app/build-output/* /app/dist/ && tail -f /dev/null"] 