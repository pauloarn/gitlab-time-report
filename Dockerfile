# Stage 1: Build
FROM node:22-alpine AS build

WORKDIR /app

# Instala as dependências
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN npm install

# Copia o resto do código e faz o build
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:stable-alpine

# Copia o arquivo de configuração do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos de build do estágio anterior
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

