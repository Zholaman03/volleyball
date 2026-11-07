#!/bin/sh
# SQLite көшірмесі: /data/backups ішінде, 14 күн сақталады
set -e
DEST=/data/backups
mkdir -p "$DEST"
FILE="$DEST/database-$(date +%F-%H%M).sqlite"
sqlite3 "$DB_DATABASE" ".backup '$FILE'"
gzip -f "$FILE"
find "$DEST" -name 'database-*.sqlite.gz' -mtime +14 -delete
echo "Көшірме: $FILE.gz"
