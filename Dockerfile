# ── Stage 1: Build React/Vite frontend ────────────────────────────────────
FROM node:20-slim AS frontend

WORKDIR /build
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ── Stage 2: PHP 8.1 + Apache runtime ─────────────────────────────────────
FROM php:8.1-apache

RUN apt-get update && apt-get install -y \
        git unzip libicu-dev libzip-dev \
    && docker-php-ext-install pdo pdo_mysql mysqli intl zip \
    && a2enmod rewrite \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Bootstrap CodeIgniter 4
RUN composer create-project codeigniter4/appstarter . --no-dev --no-interaction

# Overlay our custom application code
COPY backend/app/ app/

# Place the built React app inside CI4's public/ directory
COPY --from=frontend /build/dist/ public/

# Custom .htaccess: /api/* → PHP (CodeIgniter), everything else → React SPA
COPY backend/public.htaccess public/.htaccess

# Apache virtual-host (port is injected at runtime by entrypoint)
COPY backend/apache.conf /etc/apache2/sites-available/000-default.conf

RUN chown -R www-data:www-data writable

COPY backend/docker-entrypoint.sh /docker-entrypoint.sh
# Strip Windows CRLF line endings so bash can parse the shebang on Linux
RUN sed -i 's/\r$//' /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["apache2-foreground"]
