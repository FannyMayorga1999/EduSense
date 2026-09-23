#!/bin/sh
#
# Punto de entrada del contenedor del backend de EduSense.
# Espera a la base de datos, aplica migraciones, siembra datos si se solicita
# y finalmente ejecuta el comando principal del servicio.
#
# Autor: Fanny Mayorga | Fecha: 16-09-2026

set -e

if [ -f /var/www/html/.env.docker ]; then
  cp /var/www/html/.env.docker /var/www/html/.env
  echo "Variables de entorno de contenedor aplicadas (.env.docker -> .env)."
fi

# Espera activa hasta que la base de datos responda.
if [ -n "${DB_HOST:-}" ]; then
  echo "Esperando a la base de datos en ${DB_HOST}:${DB_PORT:-5432}..."
  while ! php -r "pg_connect('host=${DB_HOST} port=${DB_PORT:-5432} user=${DB_USERNAME:-edusense} password=${DB_PASSWORD:-} dbname=${DB_DATABASE:-edusense}') ? exit(0) : exit(1);" 2>/dev/null; do
    sleep 2
  done
  echo "Base de datos lista."
fi

php artisan migrate --force

if [ "${SEED_DATA:-false}" = "true" ]; then
  php artisan db:seed --force
  echo "Datos de demostraci├│n sembrados."
fi

exec "$@"
