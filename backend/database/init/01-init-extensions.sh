#!/bin/bash
set -e

# Database initialization script for Love OKLCH Freemium Entitlement System
# This script runs automatically when PostgreSQL container starts for the first time

echo "Starting database initialization for Love OKLCH..."

# Create extensions that might be needed
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Enable UUID generation
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    
    -- Enable JSONB operators and functions
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";
    
    -- Create custom types for the application
    CREATE TYPE subscription_status AS ENUM (
        'active',
        'expired', 
        'canceled',
        'pending',
        'grace_period'
    );
    
    CREATE TYPE payment_type AS ENUM (
        'recurring',
        'one_time'
    );
    
    CREATE TYPE admin_role_type AS ENUM (
        'super_admin',
        'plan_manager',
        'billing_admin',
        'support_admin'
    );
    
    -- Log successful initialization
    INSERT INTO pg_stat_statements_info (dealloc) VALUES (0)
    ON CONFLICT DO NOTHING;
    
EOSQL

echo "Database initialization completed successfully!"