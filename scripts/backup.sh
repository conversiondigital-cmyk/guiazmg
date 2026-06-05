#!/usr/bin/env bash
set -euo pipefail

# ── Config ──
DB_NAME="${DB_NAME:-guiazmg}"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASS:-root}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAILY="${RETENTION_DAILY:-30}"
RETENTION_WEEKLY="${RETENTION_WEEKLY:-12}"
RETENTION_MONTHLY="${RETENTION_MONTHLY:-12}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
DATE="$(date +%Y-%m-%d)"

mkdir -p "$BACKUP_DIR/daily" "$BACKUP_DIR/weekly" "$BACKUP_DIR/monthly"

# ── Backup function ──
do_backup() {
  local target_dir="$1"
  local suffix="${2:-}"
  local filename="${DB_NAME}_${TIMESTAMP}${suffix}.sql.gz"
  local filepath="${target_dir}/${filename}"

  echo "=== Backup: ${filepath} ==="
  PGPASSWORD="$DB_PASS" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --no-owner \
    --no-acl \
    --format=c \
    --compress=9 \
    --file="${filepath%.gz}"

  gzip -f "${filepath%.gz}"
  echo "=== Done: ${filepath} ($(du -h "$filepath" | cut -f1)) ==="
}

# ── Rotation ──
rotate() {
  local dir="$1"
  local keep="$2"
  ls -1t "$dir"/*.sql.gz 2>/dev/null | tail -n +$((keep + 1)) | while read -r old; do
    echo "Removing old backup: $old"
    rm -f "$old"
  done
}

case "${1:-daily}" in
  daily)
    do_backup "$BACKUP_DIR/daily"
    rotate "$BACKUP_DIR/daily" "$RETENTION_DAILY"
    ;;
  weekly)
    do_backup "$BACKUP_DIR/weekly" "_weekly"
    rotate "$BACKUP_DIR/weekly" "$RETENTION_WEEKLY"
    ;;
  monthly)
    do_backup "$BACKUP_DIR/monthly" "_monthly"
    rotate "$BACKUP_DIR/monthly" "$RETENTION_MONTHLY"
    ;;
  restore)
    RESTORE_FILE="${2:-}"
    if [ -z "$RESTORE_FILE" ]; then
      echo "Usage: $0 restore <backup-file.sql.gz>"
      exit 1
    fi
    if [ ! -f "$RESTORE_FILE" ]; then
      echo "File not found: $RESTORE_FILE"
      exit 1
    fi
    echo "=== Restoring: $RESTORE_FILE ==="
    gunzip -c "$RESTORE_FILE" | PGPASSWORD="$DB_PASS" pg_restore \
      -h "$DB_HOST" \
      -p "$DB_PORT" \
      -U "$DB_USER" \
      -d "$DB_NAME" \
      --no-owner \
      --no-acl \
      --clean \
      --if-exists

    echo "=== Restore complete ==="
    ;;
  *)
    echo "Usage: $0 {daily|weekly|monthly|restore <file>}"
    exit 1
    ;;
esac
