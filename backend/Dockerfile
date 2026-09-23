# Imagen de producción/dev para el backend Laravel de EduSense.
#
# Autor: Fanny Mayorga | Fecha: 16-09-2026

FROM php:8.4-cli

# Dependencias del sistema y extensiones de base de datos (Postgres + SQLite para pruebas).
# gd y zip son requeridos por PhpOffice/PhpSpreadsheet (export xlsx).
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        unzip \
        libpq-dev \
        libsqlite3-dev \
        libpng-dev \
        libjpeg-dev \
        libwebp-dev \
        libzip-dev \
    && docker-php-ext-configure gd --with-jpeg --with-webp \
    && docker-php-ext-install -j"$(nproc)" pdo_pgsql pgsql pdo_sqlite gd zip \
    && docker-php-ext-configure pcntl --enable-pcntl \
    && docker-php-ext-install pcntl \
    && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Instalación de dependencias en capa cacheable.
COPY composer.json composer.lock ./
RUN composer install --no-interaction --prefer-dist --no-scripts --no-autoloader

# Código fuente y punto de entrada.
COPY docker/entrypoint.sh /usr/local/bin/edusense-entrypoint.sh
COPY . .

RUN composer install --no-interaction --prefer-dist \
    && chmod +x /usr/local/bin/edusense-entrypoint.sh

EXPOSE 8000 8080

ENTRYPOINT ["/usr/local/bin/edusense-entrypoint.sh"]
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]