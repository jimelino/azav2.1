FROM php:8.2-cli

WORKDIR /app

# 1. Instalar dependencias del sistema y ACTIVAR pdo y pdo_mysql
RUN apt-get update && apt-get install -y unzip git \
    && docker-php-ext-install pdo pdo_mysql

COPY . .

# 2. Instalar Composer de forma directa y limpia
RUN php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');" \
    && php composer-setup.php \
    && php -r "unlink('composer-setup.php');" \
    && php composer.phar install --no-dev

EXPOSE 10000

# Ejecutar migración solo si existe el archivo, para evitar fallos en entornos donde el directorio database no está dentro del contexto de build
CMD if [ -f /app/database/migrate.php ]; then php /app/database/migrate.php; else echo "INFO: migrate.php no encontrado, se omite migración."; fi && php -S 0.0.0.0:$PORT -t public