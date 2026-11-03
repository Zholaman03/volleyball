#!/usr/bin/env bash
# SQLite дерекқорының күнделікті көшірмесі (setup.sh cron-ға қосады).
# ЕСКЕРТУ: көшірме сол серверде тұрса, сервер жоғалса, көшірме де жоғалады. Кейде оны басқа жерге көшіріп тұрыңыз.
set -euo pipefail

DATA_DIR=${DATA_DIR:-/var/lib/volleyball}
KEEP_DAYS=${KEEP_DAYS:-14}

stamp=$(date +%Y%m%d-%H%M%S)
dest="$DATA_DIR/backups/database-$stamp.sqlite"

mkdir -p "$DATA_DIR/backups"
# .backup дерекқор жұмыс істеп тұрғанда да дұрыс көшірме жасайды (cp-дан сенімдірек)
sqlite3 "$DATA_DIR/database.sqlite" ".backup '$dest'"
gzip "$dest"
find "$DATA_DIR/backups" -name 'database-*.sqlite.gz' -mtime +"$KEEP_DAYS" -delete

echo "$(date -Is) ok $dest.gz"
