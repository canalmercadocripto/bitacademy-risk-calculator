# Multi-stage build para otimizar o tamanho da imagem

# Stage 1: Build
FROM node:18-alpine as build

WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci --silent

# Copiar código da aplicação
COPY . .

# Build da aplicação
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Copiar arquivos do build
COPY --from=build /app/build /usr/share/nginx/html

# Copiar configuração personalizada do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta 80
EXPOSE 80

# Comando para iniciar o nginx
CMD ["nginx", "-g", "daemon off;"]