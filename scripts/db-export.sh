#!/bin/bash
# Database export script - works with both SQLite and PostgreSQL

set -e

# Create fixtures directory if it doesn't exist
mkdir -p fixtures

# Determine database type from environment
if [ "$NODE_ENV" = "production" ] || [ -n "$DATABASE_URL" ]; then
  # PostgreSQL (production)
  echo "📦 Exporting PostgreSQL database..."

  TIMESTAMP=$(date +%Y%m%d-%H%M%S)
  FILENAME="fixtures/backup-postgres-${TIMESTAMP}.sql"

  if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not set for PostgreSQL export"
    exit 1
  fi

  pg_dump "$DATABASE_URL" > "$FILENAME"
  echo "✅ PostgreSQL database exported to: $FILENAME"
else
  # SQLite (development)
  echo "📦 Exporting SQLite database..."

  TIMESTAMP=$(date +%Y%m%d-%H%M%S)
  FILENAME="fixtures/backup-sqlite-${TIMESTAMP}.sql"

  if [ ! -f "sqlite.db" ]; then
    echo "❌ Error: sqlite.db not found"
    exit 1
  fi

  sqlite3 sqlite.db .dump > "$FILENAME"
  echo "✅ SQLite database exported to: $FILENAME"
fi

echo ""
echo "To import this backup later, run:"
echo "  npm run db:import $FILENAME"
