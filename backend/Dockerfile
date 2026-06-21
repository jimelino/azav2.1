# --- ETAPA 1: Compilar el Frontend de React ---
FROM node:22 AS frontend-builder
WORKDIR /app/frontend
# Copiar el package.json del frontend e instalar dependencias
COPY frontend/package*.json ./
RUN npm install
# Copiar el resto del frontend y compilar
COPY frontend/ ./
RUN CI=false npm run build

# --- ETAPA 2: Configurar el Backend de PHP ---
FROM php:8.2-cli
WORKDIR /app

# Instalar dependencias del sistema y extensiones de PHP
RUN apt-get update && apt-get install -y unzip git \
    && docker-php-ext-install pdo pdo_mysql

# Copiar todo el contenido del backend
COPY backend/ ./

# Copiar los archivos compilados de React de la Etapa 1 a la carpeta pública de PHP
COPY --from=frontend-builder /app/frontend/build ./public

# Instalar dependencias de Composer
RUN php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');" \
    && php composer-setup.php \
    && php -r "unlink('composer-setup.php');" \
    && php composer.phar install --no-dev

# Exponer el puerto que Railway asigna automáticamente
EXPOSE 8080

# Comando para levantar el servidor interno de PHP sirviendo la carpeta pública
CMD ["php", "-S", "0.0.0.0:8080", "-t", "public"]