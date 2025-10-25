#!/bin/bash
# Database refresh script - resets and reseeds the database

echo "🔄 Starting database refresh..."

# Reset the database
echo "1️⃣ Resetting database..."
npm run db:migrate:reset -- --force

# Enable UUID extension
echo "2️⃣ Enabling UUID extension..."
echo 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";' | docker exec -i love-oklch-postgres psql -U postgres -d love_oklch_dev

# Push schema
echo "3️⃣ Pushing schema..."
npm run db:push

# Seed data
echo "4️⃣ Seeding data..."
npm run db:seed

echo "✅ Database refresh complete!"