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

# Apache virtual-host (port injected at runtime by entrypoint)
COPY backend/apache.conf /etc/apache2/sites-available/000-default.conf

RUN chown -R www-data:www-data writable

COPY backend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["apache2-foreground"]
