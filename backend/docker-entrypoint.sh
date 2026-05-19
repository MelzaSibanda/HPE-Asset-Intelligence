#!/bin/bash
set -e

PORT=${PORT:-80}

# Render exposes $PORT — wire Apache to it
sed -i "s/Listen 80/Listen $PORT/" /etc/apache2/ports.conf
sed -i "s/__PORT__/$PORT/" /etc/apache2/sites-available/000-default.conf

# Build CI4 .env from container environment variables
cat > /var/www/html/.env <<EOF
CI_ENVIRONMENT = production

database.default.hostname = ${DB_HOSTNAME:-localhost}
database.default.database = ${DB_DATABASE:-hpe_asset_intelligence}
database.default.username = ${DB_USERNAME:-root}
database.default.password = ${DB_PASSWORD:-}
database.default.DBDriver = MySQLi
database.default.DBPrefix =
database.default.port     = ${DB_PORT:-3306}

JWT_SECRET = ${JWT_SECRET:-hpe-asset-intel-secret-key-2026}
CORS_ORIGIN = ${CORS_ORIGIN:-http://localhost:5173}
EOF

exec "$@"
