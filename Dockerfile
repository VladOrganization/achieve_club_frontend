# Build stage
FROM node:20-alpine AS builder

ARG VITE_API_URL=https://byteschool.online
ARG VITE_API_PORT=5001

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Runtime stage
FROM nginx:alpine

# Копируем собранное приложение в Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем конфиг Nginx (см. ниже)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Создаем директорию для сертификатов (будет заполнена volume)
RUN mkdir -p /etc/nginx/ssl

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]