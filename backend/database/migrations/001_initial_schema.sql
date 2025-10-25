-- Migration: 001_initial_schema
-- Description: Create initial database schema for freemium entitlement system
-- Created: 2025-10-24
-- Author: Love OKLCH Backend

BEGIN;

-- Create custom types
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

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable trigram extension for text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users table (extends existing or creates new)
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Subscription Plans
CREATE TABLE IF NOT EXISTS plans (
    plan_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    billing_interval VARCHAR(20), -- 'monthly', 'yearly', 'one_time', null for free
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Feature Catalog
CREATE TABLE IF NOT EXISTS features (
    feature_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    is_boolean BOOLEAN DEFAULT false, -- true for on/off, false for limits/quotas
    default_value JSONB DEFAULT '{}',
    validation_schema JSONB, -- JSON schema for value validation
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    subscription_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(plan_id) ON DELETE RESTRICT,
    status subscription_status DEFAULT 'pending',
    payment_type payment_type DEFAULT 'recurring',
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP WITH TIME ZONE,
    grace_period_end TIMESTAMP WITH TIME ZONE,
    trial_end_date TIMESTAMP WITH TIME ZONE,
    billing_cycle_anchor TIMESTAMP WITH TIME ZONE,
    external_subscription_id VARCHAR(255), -- from payment provider
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Entitlement Matrix (Plan-Feature associations)
CREATE TABLE IF NOT EXISTS plan_features (
    plan_feature_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES plans(plan_id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES features(feature_id) ON DELETE CASCADE,
    value JSONB NOT NULL DEFAULT '{}',
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(plan_id, feature_id)
);

-- Admin Roles (for role-based access control)
CREATE TABLE IF NOT EXISTS admin_roles (
    role_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role_name admin_role_type NOT NULL,
    permissions JSONB DEFAULT '{}',
    granted_by UUID REFERENCES users(user_id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE, -- optional expiration
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Feature Usage Tracking (for quota enforcement)
CREATE TABLE IF NOT EXISTS feature_usage (
    usage_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES features(feature_id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(subscription_id) ON DELETE SET NULL,
    usage_count INTEGER DEFAULT 0,
    usage_data JSONB DEFAULT '{}',
    period_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    period_end TIMESTAMP WITH TIME ZONE,
    last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_dates ON subscriptions(status, end_date, grace_period_end);
CREATE INDEX IF NOT EXISTS idx_plan_features_plan_id ON plan_features(plan_id);
CREATE INDEX IF NOT EXISTS idx_features_key_name ON features(key_name);
CREATE INDEX IF NOT EXISTS idx_feature_usage_user_feature ON feature_usage(user_id, feature_id);
CREATE INDEX IF NOT EXISTS idx_admin_roles_user_active ON admin_roles(user_id, is_active);

-- Additional performance indexes for entitlement queries
CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email, is_active);
CREATE INDEX IF NOT EXISTS idx_plans_slug_active ON plans(slug, is_active);
CREATE INDEX IF NOT EXISTS idx_features_key_active ON features(key_name, is_active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_plan_status ON subscriptions(user_id, plan_id, status);
CREATE INDEX IF NOT EXISTS idx_plan_features_plan_feature ON plan_features(plan_id, feature_id);

-- Trigger function for updating updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plans_updated_at 
    BEFORE UPDATE ON plans 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_features_updated_at 
    BEFORE UPDATE ON features 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at 
    BEFORE UPDATE ON subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plan_features_updated_at 
    BEFORE UPDATE ON plan_features 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_roles_updated_at 
    BEFORE UPDATE ON admin_roles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_usage_updated_at 
    BEFORE UPDATE ON feature_usage 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT 
    s.*,
    u.email as user_email,
    u.name as user_name,
    p.name as plan_name,
    p.slug as plan_slug
FROM subscriptions s
JOIN users u ON s.user_id = u.user_id
JOIN plans p ON s.plan_id = p.plan_id
WHERE s.status IN ('active', 'grace_period')
  AND u.is_active = true
  AND p.is_active = true;

CREATE OR REPLACE VIEW user_entitlements AS
SELECT 
    u.user_id,
    u.email,
    s.subscription_id,
    s.status as subscription_status,
    p.plan_id,
    p.name as plan_name,
    f.feature_id,
    f.key_name as feature_key,
    f.display_name as feature_name,
    pf.value as feature_value,
    pf.is_enabled as feature_enabled
FROM users u
LEFT JOIN subscriptions s ON u.user_id = s.user_id 
    AND s.status IN ('active', 'grace_period')
LEFT JOIN plans p ON s.plan_id = p.plan_id
LEFT JOIN plan_features pf ON p.plan_id = pf.plan_id
LEFT JOIN features f ON pf.feature_id = f.feature_id
WHERE u.is_active = true
  AND (p.is_active = true OR p.is_active IS NULL)
  AND (f.is_active = true OR f.is_active IS NULL);

COMMIT;

-- Log migration completion
SELECT 'Migration 001_initial_schema completed successfully' AS result;