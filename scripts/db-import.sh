#!/bin/bash
# Database import script - works with both SQLite and PostgreSQL

set -e

IMPORT_FILE="$1"

if [ -z "$IMPORT_FILE" ]; then
  echo "❌ Error: Please provide a SQL dump file to import"
  echo "Usage: npm run db:import <path-to-backup.sql>"
  exit 1
fi

if [ ! -f "$IMPORT_FILE" ]; then
  echo "❌ Error: File not found: $IMPORT_FILE"
  exit 1
fi

# Determine database type from environment
if [ "$NODE_ENV" = "production" ] || [ -n "$DATABASE_URL" ]; then
  # PostgreSQL (production)
  echo "📥 Importing into PostgreSQL database..."

  if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not set for PostgreSQL import"
    exit 1
  fi

  echo "⚠️  WARNING: This will import data into your PostgreSQL database."
  echo "   Database: $DATABASE_URL"
  echo "   Source file: $IMPORT_FILE"
  echo ""
  read -p "Are you sure you want to continue? (yes/no): " CONFIRM

  if [ "$CONFIRM" != "yes" ]; then
    echo "Import cancelled."
    exit 0
  fi

  psql "$DATABASE_URL" < "$IMPORT_FILE"
  echo "✅ PostgreSQL database imported successfully"
else
  # SQLite (development)
  echo "📥 Importing into SQLite database..."

  if [ ! -f "sqlite.db" ]; then
    echo "⚠️  sqlite.db not found. Creating new database..."
  else
    echo "⚠️  WARNING: This will modify your existing sqlite.db file."
    echo "   Source file: $IMPORT_FILE"
    echo ""
    read -p "Do you want to backup the current database first? (yes/no): " BACKUP

    if [ "$BACKUP" = "yes" ]; then
      BACKUP_FILE="sqlite.db.backup-$(date +%Y%m%d-%H%M%S)"
      cp sqlite.db "$BACKUP_FILE"
      echo "✅ Current database backed up to: $BACKUP_FILE"
    fi
  fi

  sqlite3 sqlite.db < "$IMPORT_FILE"
  echo "✅ SQLite database imported successfully"
fi
