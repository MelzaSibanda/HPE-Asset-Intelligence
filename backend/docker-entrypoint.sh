#!/bin/bash
set -e

PORT=${PORT:-80}

# Configure Apache to listen on the port Render/Railway injects
sed -i "s/Listen 80/Listen $PORT/" /etc/apache2/ports.conf
sed -i "s/__PORT__/$PORT/" /etc/apache2/sites-available/000-default.conf

# Railway exposes MySQL as MYSQLHOST/MYSQLUSER/etc.
# Fall back to DB_* names for Render or manual setups.
_DB_HOST="${DB_HOSTNAME:-${MYSQLHOST:-localhost}}"
_DB_NAME="${DB_DATABASE:-${MYSQLDATABASE:-hpe_asset_intelligence}}"
_DB_USER="${DB_USERNAME:-${MYSQLUSER:-root}}"
_DB_PASS="${DB_PASSWORD:-${MYSQLPASSWORD:-}}"
_DB_PORT="${DB_PORT:-${MYSQLPORT:-3306}}"

# Write CI4 .env from resolved environment variables
cat > /var/www/html/.env <<EOF
CI_ENVIRONMENT = production

database.default.hostname = ${_DB_HOST}
database.default.database = ${_DB_NAME}
database.default.username = ${_DB_USER}
database.default.password = ${_DB_PASS}
database.default.DBDriver = MySQLi
database.default.DBPrefix =
database.default.port     = ${_DB_PORT}

JWT_SECRET  = ${JWT_SECRET:-hpe-asset-intel-secret-key-2026}
CORS_ORIGIN = ${CORS_ORIGIN:-*}
EOF

exec "$@"
