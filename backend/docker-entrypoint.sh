#!/bin/bash
set -e

PORT=${PORT:-80}

# Configure Apache to listen on Render's PORT
sed -i "s/Listen 80/Listen $PORT/" /etc/apache2/ports.conf
sed -i "s/__PORT__/$PORT/" /etc/apache2/sites-available/000-default.conf

# Write CI4 .env — DATABASE_URL is read directly from system env by CI4's env() helper
# Do NOT write DATABASE_URL here; URL special chars can break CI4's .env parser
cat > /var/www/html/.env <<EOF
CI_ENVIRONMENT = production
JWT_SECRET  = ${JWT_SECRET:-hpe-asset-intel-secret-key-2026}
CORS_ORIGIN = ${CORS_ORIGIN:-*}
EOF

exec "$@"
