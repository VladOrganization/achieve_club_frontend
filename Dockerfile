# Build stage
FROM node:20-alpine AS builder

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

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]