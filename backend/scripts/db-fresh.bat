@echo off
REM Database refresh script for Windows - resets and reseeds the database

echo 🔄 Starting database refresh...

REM Reset the database
echo 1️⃣ Resetting database...
call npm run db:migrate:reset -- --force

REM Enable UUID extension
echo 2️⃣ Enabling UUID extension...
echo CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; | docker exec -i love-oklch-postgres psql -U postgres -d love_oklch_dev

REM Push schema
echo 3️⃣ Pushing schema...
call npm run db:push

REM Seed data
echo 4️⃣ Seeding data...
call npm run db:seed

echo ✅ Database refresh complete!