#!/bin/sh
set -e

# Run Prisma migrations
echo "Running database migrations..."
npx prisma migrate deploy || npx prisma db push --skip-generate

# Start the application
echo "Starting CleanCheck application..."
exec "$@"
