#!/bin/bash
set -e

PORT=${PORT:-80}

# Configure Apache to listen on Render's PORT
sed -i "s/Listen 80/Listen $PORT/" /etc/apache2/ports.conf
sed -i "s/__PORT__/$PORT/" /etc/apache2/sites-available/000-default.conf

# Write CI4 .env — DATABASE_URL is provided by Render PostgreSQL add-on
cat > /var/www/html/.env <<EOF
CI_ENVIRONMENT = production

DATABASE_URL = ${DATABASE_URL:-}

JWT_SECRET  = ${JWT_SECRET:-hpe-asset-intel-secret-key-2026}
CORS_ORIGIN = ${CORS_ORIGIN:-*}
EOF

exec "$@"
